'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isConnected: boolean;
  isCallActive: boolean;
  error: string | null;
  startLocalStream: () => Promise<MediaStream>;
  stopLocalStream: () => void;
  call: (roomCode: string) => Promise<void>;
  answer: (roomCode: string) => Promise<void>;
  hangup: () => void;
}

export function useWebRTC(): UseWebRTCReturn {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachLocalStream = useCallback((stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    const socket = getSocket();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const roomCode = (document.querySelector('[data-room-code]') as HTMLElement)?.dataset?.roomCode || '';
        socket.emit('webrtc-ice-candidate', {
          roomCode,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        attachRemoteStream(event.streams[0]);
        setIsConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsCallActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        setIsCallActive(false);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [attachRemoteStream]);

  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      attachLocalStream(stream);
      return stream;
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied'
        : `Camera error: ${err.message}`;
      setError(msg);
      throw err;
    }
  }, [attachLocalStream]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const call = useCallback(async (roomCode: string) => {
    try {
      if (!localStreamRef.current) {
        await startLocalStream();
      }

      let pc = pcRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit('webrtc-offer', {
        roomCode,
        offer: pc.localDescription?.toJSON(),
      });
    } catch (err: any) {
      setError(`Call failed: ${err.message}`);
    }
  }, [startLocalStream, createPeerConnection]);

  const answer = useCallback(async (roomCode: string) => {
    try {
      if (!localStreamRef.current) {
        await startLocalStream();
      }

      let pc = pcRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);

      const socket = getSocket();
      socket.emit('webrtc-answer', {
        roomCode,
        answer: pc.localDescription?.toJSON(),
      });
    } catch (err: any) {
      setError(`Answer failed: ${err.message}`);
    }
  }, [startLocalStream, createPeerConnection]);

  const hangup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    setIsConnected(false);
    setIsCallActive(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    async function onOffer(payload: { offer: unknown; fromUserId: string }) {
      const pc = pcRef.current || createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer as RTCSessionDescriptionInit));
        const roomCode = (document.querySelector('[data-room-code]') as HTMLElement)?.dataset?.roomCode || '';
        await answer(roomCode);
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    }

    async function onAnswer(payload: { answer: unknown; fromUserId: string }) {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer as RTCSessionDescriptionInit));
      } catch (err) {
        console.error('Failed to handle answer:', err);
      }
    }

    async function onIceCandidate(payload: { candidate: unknown; fromUserId: string }) {
      const pc = pcRef.current;
      if (!pc || !payload.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate as RTCIceCandidateInit));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    }

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIceCandidate);

    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIceCandidate);
    };
  }, [createPeerConnection, answer]);

  useEffect(() => {
    return () => {
      hangup();
      stopLocalStream();
    };
  }, [hangup, stopLocalStream]);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isCallActive,
    error,
    startLocalStream,
    stopLocalStream,
    call,
    answer,
    hangup,
  };
}

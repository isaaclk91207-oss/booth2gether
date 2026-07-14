'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseCameraOptions {
  video?: boolean;
  audio?: boolean;
  width?: number;
  height?: number;
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPermissionGranted: boolean;
  isCameraActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { video = true, audio = false, width = 640, height = 480 } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        stopCamera();
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: width }, height: { ideal: height } } : false,
        audio,
      });

      streamRef.current = mediaStream;
      setIsPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
      setIsPermissionGranted(false);
      setIsCameraActive(false);
    }
  }, [video, audio, width, height, stopCamera]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isCameraActive) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream: streamRef.current,
    videoRef,
    isPermissionGranted,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CameraPreview } from '@/components/shared/camera-preview';
import { CountdownOverlay } from '@/components/shared/countdown-overlay';
import { useSocket } from '@/hooks/useSocket';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '@/stores/room-store';
import { api } from '@/lib/api';
import { TOTAL_SHOTS, SHOT_INTERVAL_MS, COUNTDOWN_DURATION } from '@booth2gether/shared';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [currentShot, setCurrentShot] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_DURATION);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [uploadStates, setUploadStates] = useState<UploadState[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const localUser = useRoomStore((s) => s.localUser);
  const remoteUser = useRoomStore((s) => s.remoteUser);

  const {
    localStream,
    remoteStream,
    error: webrtcError,
    startLocalStream,
  } = useWebRTC();

  useSocket();
  const { emitCapture } = useRoomSocket(code);

  const localVideoRefCapture = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefCapture = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    startLocalStream().catch(() => {});
  }, []);

  useEffect(() => {
    if (localStream && localVideoRefCapture.current) {
      localVideoRefCapture.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRefCapture.current) {
      remoteVideoRefCapture.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const capturePhoto = useCallback(() => {
    if (!localVideoRefCapture.current || !localUser) return;

    setIsCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = localVideoRefCapture.current.videoWidth || 640;
    canvas.height = localVideoRefCapture.current.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(localVideoRefCapture.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false);
        return;
      }

      const previewUrl = URL.createObjectURL(blob);
      setCapturedPhotos((prev) => [...prev, previewUrl]);
      setUploadStates((prev) => [...prev, 'uploading']);

      try {
        await api.uploadPhoto(blob, code, localUser.id, currentShot);
        setUploadStates((prev) => {
          const next = [...prev];
          next[next.length - 1] = 'done';
          return next;
        });
        emitCapture(currentShot);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadStates((prev) => {
          const next = [...prev];
          next[next.length - 1] = 'error';
          return next;
        });
      }

      setTimeout(() => {
        setIsCapturing(false);
        setCurrentShot((prev) => prev + 1);
      }, 500);
    }, 'image/jpeg', 0.85);
  }, [currentShot, code, localUser, emitCapture]);

  useEffect(() => {
    if (isCountingDown) {
      if (countdownValue <= 0) {
        setIsCountingDown(false);
        capturePhoto();
        return;
      }
      const timer = setTimeout(() => {
        setCountdownValue((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCountingDown, countdownValue, capturePhoto]);

  useEffect(() => {
    if (currentShot > 0 && currentShot < TOTAL_SHOTS && !isCountingDown) {
      const timer = setTimeout(() => {
        setCountdownValue(COUNTDOWN_DURATION);
        setIsCountingDown(true);
      }, SHOT_INTERVAL_MS);
      return () => clearTimeout(timer);
    }

    if (currentShot >= TOTAL_SHOTS) {
      const allDone = uploadStates.every((s) => s === 'done');
      if (allDone) {
        setTimeout(() => {
          router.push(`/room/${code}/preview`);
        }, 1000);
      }
    }
  }, [currentShot, isCountingDown, uploadStates, code, router]);

  const handleLeave = () => {
    router.push(`/room/${code}`);
  };

  const getUploadIcon = (state: UploadState) => {
    switch (state) {
      case 'uploading':
        return <Upload className="h-3 w-3 animate-pulse" />;
      case 'done':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'error':
        return <span className="text-xs text-red-500">!</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col" data-room-code={code}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave
        </Button>
        <div className="text-sm font-medium">
          Room: {code} &middot; Shot: {Math.min(currentShot + 1, TOTAL_SHOTS)} of {TOTAL_SHOTS}
        </div>
      </header>

      {isCountingDown && (
        <CountdownOverlay
          count={countdownValue}
          onComplete={() => setIsCountingDown(false)}
        />
      )}

      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CameraPreview
            label={localUser ? `${localUser.name} (You)` : 'You'}
            isLocal={true}
            videoRef={localVideoRefCapture}
            hasStream={!!localStream}
            error={webrtcError}
            className={`aspect-video ${isCapturing ? 'ring-4 ring-white' : ''}`}
          />
          <CameraPreview
            label={remoteUser?.name || 'Friend'}
            videoRef={remoteVideoRefCapture}
            hasStream={!!remoteStream}
            className="aspect-video"
          />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {currentShot}/{TOTAL_SHOTS} shots
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {Array.from({ length: TOTAL_SHOTS }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < currentShot
                      ? 'bg-green-500'
                      : i === currentShot
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {capturedPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedPhotos.map((photo, i) => (
              <div key={i} className="relative">
                <img
                  src={photo}
                  alt={`Shot ${i + 1}`}
                  className="h-16 w-20 rounded object-cover"
                />
                <div className="absolute -right-1 -top-1 rounded-full bg-background p-0.5">
                  {getUploadIcon(uploadStates[i] ?? 'idle')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

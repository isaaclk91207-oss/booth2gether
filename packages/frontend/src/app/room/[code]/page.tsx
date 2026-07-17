'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RoomCodeDisplay } from '@/components/shared/room-code-display';
import { CameraPreview } from '@/components/shared/camera-preview';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ErrorMessage } from '@/components/shared/error-message';
import { useSocket } from '@/hooks/useSocket';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '@/stores/room-store';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [localReady, setLocalReady] = useState(false);
  const [error, setError] = useState('');

  const localUser = useRoomStore((s) => s.localUser);
  const remoteUser = useRoomStore((s) => s.remoteUser);
  const updateReadyStatus = useRoomStore((s) => s.updateReadyStatus);
  const hydrateSession = useRoomStore((s) => s.hydrateSession);

  useSocket();

  useEffect(() => {
    hydrateSession();
  }, []);
  const { emitJoin, emitReady, emitStartSession, emitLeave } = useRoomSocket(code);

  const {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isCallActive,
    error: webrtcError,
    startLocalStream,
    call,
    hangup,
  } = useWebRTC();

  const isHost = localUser?.role === 'HOST';
  const bothReady = localUser?.isReady && remoteUser?.isReady;
  const hasGuest = !!remoteUser;

  useEffect(() => {
    if (localUser) {
      setLocalReady(localUser.isReady);
      emitJoin(localUser.id);
      startLocalStream().catch(() => {});
    }
  }, [localUser]);

  useEffect(() => {
    if (hasGuest && !isHost && localStream) {
      call(code);
    }
  }, [hasGuest, isHost, localStream, code]);

  const handleToggleReady = () => {
    const newReady = !localReady;
    setLocalReady(newReady);
    emitReady(newReady);
    if (localUser) {
      updateReadyStatus(localUser.id, newReady);
    }
  };

  const handleStart = () => {
    emitStartSession();
  };

  const handleLeave = () => {
    hangup();
    emitLeave();
    router.push('/');
  };

  useEffect(() => {
    if (!localUser && code) {
      setError('No user session found. Please create or join a room first.');
    }
    if (localUser) {
      setError('');
    }
  }, [localUser, code]);

  return (
    <div className="flex min-h-screen flex-col" data-room-code={code}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave
        </Button>
        <RoomCodeDisplay code={code} />
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CameraPreview
            label={localUser ? `${localUser.name} (You)` : 'Loading...'}
            isLocal={true}
            videoRef={localVideoRef}
            hasStream={!!localStream}
            error={webrtcError}
            className="aspect-video"
          />
          <CameraPreview
            label={remoteUser?.name || 'Waiting for friend...'}
            videoRef={remoteVideoRef}
            hasStream={!!remoteStream}
            className="aspect-video"
          />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Status: {isCallActive ? 'Video connected' : hasGuest ? 'Both connected' : 'Waiting for guest...'}
              </div>

              <div className="space-y-2">
                {localUser && (
                  <UserAvatar
                    user={localUser}
                    showRole={true}
                    showReady={true}
                  />
                )}

                {remoteUser ? (
                  <UserAvatar
                    user={remoteUser}
                    showRole={true}
                    showReady={true}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Waiting for guest to join...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(error || webrtcError) && <ErrorMessage message={error || webrtcError || ''} />}

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            variant={localReady ? 'secondary' : 'default'}
            onClick={handleToggleReady}
          >
            {localReady ? 'Cancel Ready' : "I'm Ready"}
          </Button>

          {bothReady && isHost && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleStart}
            >
              Start Session
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Both users must be ready to start
        </p>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/page-container';
import { ErrorMessage } from '@/components/shared/error-message';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/stores/room-store';

export default function JoinRoomWithCodePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setLocalUser = useRoomStore((s) => s.setLocalUser);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { room, user } = await api.joinRoom(code, name.trim());
      setLocalUser(user);

      const socket = getSocket();
      socket.emit('join-room', {
        roomCode: room.code,
        userId: user.id,
      });

      router.push(`/room/${room.code}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join Room</CardTitle>
            <CardDescription>
              Joining room with code
            </CardDescription>
            {code && (
              <div className="mt-2">
                <span className="font-mono text-2xl font-bold tracking-widest">{code}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Your name
                </label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <Button
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Room'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

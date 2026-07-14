'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/page-container';
import { ErrorMessage } from '@/components/shared/error-message';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/stores/room-store';

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setLocalUser = useRoomStore((s) => s.setLocalUser);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { room, user } = await api.createRoom(name.trim());
      setLocalUser(user);

      const socket = getSocket();
      socket.emit('join-room', {
        roomCode: room.code,
        userId: user.id,
      });

      router.push(`/room/${room.code}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
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
            <CardTitle>Create Room</CardTitle>
            <CardDescription>Enter your name to create a new room</CardDescription>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <Button
                size="lg"
                className="w-full"
                onClick={handleCreate}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          You&apos;ll get a code to share with your friend
        </p>
      </div>
    </PageContainer>
  );
}

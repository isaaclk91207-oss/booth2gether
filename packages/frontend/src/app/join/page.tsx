'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/page-container';
import { ErrorMessage } from '@/components/shared/error-message';

export default function JoinRoomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success - redirect to room
    router.push(`/room/${roomCode.trim().toUpperCase()}`);
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
            <CardDescription>Enter the room code and your name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Room code
                </label>
                <Input
                  id="code"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="text-center font-mono text-lg tracking-widest uppercase"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

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
                disabled={isLoading || !name.trim() || !roomCode.trim()}
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
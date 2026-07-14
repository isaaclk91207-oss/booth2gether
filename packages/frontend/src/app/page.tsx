'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/shared/logo';
import { PageContainer } from '@/components/shared/page-container';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const handleJoinWithCode = () => {
    if (roomCode.trim()) {
      router.push(`/join/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col items-center gap-8">
        <Logo size="lg" />

        <p className="text-center text-muted-foreground">
          Take photos together in real-time with friends
        </p>

        <Card className="w-full">
          <CardContent className="flex flex-col gap-4 p-6">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => router.push('/create')}
            >
              <Camera className="mr-2 h-5 w-5" />
              Create Room
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full text-base"
              onClick={() => router.push('/join')}
            >
              <Users className="mr-2 h-5 w-5" />
              Join Room
            </Button>
          </CardContent>
        </Card>

        <div className="flex w-full items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or enter code</span>
          <Separator className="flex-1" />
        </div>

        <div className="flex w-full gap-2">
          <Input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center font-mono text-lg tracking-widest uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
          />
          <Button
            variant="secondary"
            onClick={handleJoinWithCode}
            disabled={!roomCode.trim()}
          >
            Join
          </Button>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>1. Create</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>2. Invite</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>3. Snap</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
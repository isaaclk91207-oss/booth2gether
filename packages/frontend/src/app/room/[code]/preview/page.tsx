'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSocket } from '@/hooks/useSocket';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [photos, setPhotos] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useSocket();
  useRoomSocket(code);

  useEffect(() => {
    api.getRoomPhotos(code).then(({ photos }) => {
      setPhotos(photos);
    }).catch(console.error);
  }, [code]);

  useEffect(() => {
    const socket = getSocket();

    function onProcessingStarted() {
      setIsProcessing(true);
    }

    function onStripReady(_payload: { stripUrl: string }) {
      setIsProcessing(false);
      setTimeout(() => {
        router.push(`/room/${code}/result`);
      }, 1000);
    }

    socket.on('processing-started', onProcessingStarted);
    socket.on('strip-ready', onStripReady);

    return () => {
      socket.off('processing-started', onProcessingStarted);
      socket.off('strip-ready', onStripReady);
    };
  }, [code, router]);

  const totalExpected = 8;
  const progress = Math.min((photos.length / totalExpected) * 100, 100);

  const getPhotoUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-6">
          <h2 className="text-xl font-semibold">
            {isProcessing ? 'Processing your photos...' : 'Photos ready!'}
          </h2>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }, (_, i) => {
              const photo = photos[i];
              return (
                <div
                  key={i}
                  className={`aspect-square rounded overflow-hidden ${
                    photo ? 'opacity-100' : 'opacity-30'
                  } transition-opacity`}
                >
                  {photo ? (
                    <img
                      src={getPhotoUrl(photo.imageUrl)}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isProcessing ? 'Uploading...' : 'Upload complete'}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for all photos...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

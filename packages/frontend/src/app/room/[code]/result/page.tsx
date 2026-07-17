'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, Share2, Camera, XCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Logo } from '@/components/shared/logo';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useSocket();

  useEffect(() => {
    api.getResult(code)
      .then((data) => {
        setStripUrl(data.stripUrl);
        setPhotos(data.photos);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load result:', err);
        setIsLoading(false);
      });
  }, [code]);

  useEffect(() => {
    const socket = getSocket();

    function onStripReady(payload: { stripUrl: string }) {
      setStripUrl(payload.stripUrl);
    }

    socket.on('strip-ready', onStripReady);
    return () => {
      socket.off('strip-ready', onStripReady);
    };
  }, []);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${code}`
    : `/join/${code}`;

  const getPhotoUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!stripUrl) return;
    try {
      const response = await fetch(`${API_BASE_URL}${stripUrl}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booth2gether-${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${API_BASE_URL}${stripUrl}`, '_blank');
    }
  };

  useEffect(() => {
    if (stripUrl) {
      handleDownload();
    }
  }, [stripUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading your photos...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>
        <div className="text-sm font-medium">Your Photo Strip is Ready!</div>
      </header>

      <main className="flex flex-1 flex-col items-center gap-6 p-4">
        {stripUrl ? (
          <Card className="w-full max-w-sm overflow-hidden">
            <CardContent className="p-0">
              <img
                src={`${API_BASE_URL}${stripUrl}`}
                alt="Photo Strip"
                className="w-full"
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-sm">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Generating your strip...
              </p>
            </CardContent>
          </Card>
        )}

        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.slice(0, 4).map((photo, i) => (
              <img
                key={photo.id}
                src={getPhotoUrl(photo.imageUrl)}
                alt={`Shot ${i + 1}`}
                className="h-20 w-16 rounded object-cover"
              />
            ))}
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleDownload}
            disabled={!stripUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>

          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Photo Strip</DialogTitle>
                <DialogDescription>
                  Copy this link to share your photo strip with friends
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                <code className="flex-1 text-sm">{shareUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    'Copy'
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setShowShareDialog(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/room/${code}`)}
          >
            <Camera className="mr-2 h-4 w-4" />
            New Session
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => router.push('/')}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Close Room
          </Button>
        </div>

        <Logo size="sm" className="mt-4 opacity-50" />
      </main>
    </div>
  );
}

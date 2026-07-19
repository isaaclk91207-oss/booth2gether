'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Share2,
  Camera,
  XCircle,
  Check,
  Loader2,
  GripVertical,
  Sparkles,
} from 'lucide-react';
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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PhotoItem {
  id: string;
  imageUrl: string;
  shotIndex: number;
  order: number;
  selected: boolean;
}

function SortablePhoto({
  photo,
  index,
  onToggle,
  getPhotoUrl,
}: {
  photo: PhotoItem;
  index: number;
  onToggle: (id: string) => void;
  getPhotoUrl: (url: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
        photo.selected
          ? 'border-primary shadow-md'
          : 'border-transparent opacity-40'
      } ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}
    >
      <img
        src={getPhotoUrl(photo.imageUrl)}
        alt={`Photo ${index + 1}`}
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(photo.id);
        }}
        className={`absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white transition-colors ${
          photo.selected ? 'bg-primary' : 'bg-muted-foreground/60'
        }`}
      >
        {photo.selected ? (
          <Check className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
      </button>

      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-1 left-1 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-black/50 text-white active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-black/50 text-[10px] font-bold text-white">
        {index + 1}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase() || '';

  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useSocket();

  useEffect(() => {
    api
      .getResult(code)
      .then((data) => {
        setStripUrl(data.stripUrl);
        setPhotos(
          data.photos.map((p: any, i: number) => ({
            id: p.id,
            imageUrl: p.imageUrl,
            shotIndex: p.shotIndex,
            order: p.order ?? i,
            selected: p.selected ?? true,
          })),
        );
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
      setIsRegenerating(false);
    }

    socket.on('strip-ready', onStripReady);
    return () => {
      socket.off('strip-ready', onStripReady);
    };
  }, []);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${code}`
      : `/join/${code}`;

  const getPhotoUrl = useCallback(
    (imageUrl: string) => {
      if (imageUrl.startsWith('http')) return imageUrl;
      return `${API_BASE_URL}${imageUrl}`;
    },
    [],
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPhotos((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((item, i) => ({ ...item, order: i }));
    });
    setHasChanges(true);
  };

  const handleToggle = (id: string) => {
    setPhotos((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
    setHasChanges(true);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.reorderPhotos(
        code,
        photos.map((p) => ({ id: p.id, order: p.order, selected: p.selected })),
      );
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to regenerate strip:', err);
      setIsRegenerating(false);
    }
  };

  const selectedCount = photos.filter((p) => p.selected).length;

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
              {isRegenerating ? (
                <div className="flex flex-col items-center gap-4 p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Regenerating your strip...
                  </p>
                </div>
              ) : (
                <img
                  src={`${API_BASE_URL}${stripUrl}`}
                  alt="Photo Strip"
                  className="w-full"
                />
              )}
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
          <div className="w-full max-w-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {selectedCount} of {photos.length} photos selected
              </p>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || selectedCount === 0}
                >
                  {isRegenerating ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-3 w-3" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={photos.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, i) => (
                    <SortablePhoto
                      key={photo.id}
                      photo={photo}
                      index={i}
                      onToggle={handleToggle}
                      getPhotoUrl={getPhotoUrl}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleDownload}
            disabled={!stripUrl || isRegenerating}
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

import { cn } from '@/lib/utils';
import { User, VideoOff } from 'lucide-react';
import { RefObject } from 'react';

interface CameraPreviewProps {
  label?: string;
  isLocal?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  hasStream?: boolean;
  error?: string | null;
  className?: string;
}

export function CameraPreview({
  label,
  isLocal = false,
  videoRef,
  hasStream = false,
  error,
  className,
}: CameraPreviewProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-muted', className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          'h-full w-full object-cover',
          (!hasStream || error) && 'hidden',
        )}
      />

      {!hasStream && !error && (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
          <User className="h-12 w-12" />
          <span className="text-sm">
            {isLocal ? 'Starting camera...' : 'Waiting for friend...'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-destructive">
          <VideoOff className="h-12 w-12" />
          <span className="text-center text-sm px-4">{error}</span>
        </div>
      )}

      {label && (
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {label}
        </div>
      )}
    </div>
  );
}

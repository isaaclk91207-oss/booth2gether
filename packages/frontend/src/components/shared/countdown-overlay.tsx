'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownOverlayProps {
  count: number;
  onComplete?: () => void;
  className?: string;
}

export function CountdownOverlay({ count: initialCount, onComplete, className }: CountdownOverlayProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (count <= 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80',
        className
      )}
    >
      <div className="text-[120px] font-bold text-white animate-pulse">
        {count}
      </div>
    </div>
  );
}
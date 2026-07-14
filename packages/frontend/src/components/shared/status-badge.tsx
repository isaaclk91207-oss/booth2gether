import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROOM_STATES } from '@booth2gether/shared';

type RoomState = (typeof ROOM_STATES)[keyof typeof ROOM_STATES];

interface StatusBadgeProps {
  state: RoomState;
  className?: string;
}

const stateConfig: Record<RoomState, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  WAITING: { label: 'Waiting', variant: 'secondary' },
  JOINED: { label: 'Joined', variant: 'default' },
  READY: { label: 'Ready', variant: 'success' },
  SHOOTING: { label: 'Shooting', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'destructive' },
};

export function StatusBadge({ state, className }: StatusBadgeProps) {
  const config = stateConfig[state] ?? { label: state, variant: 'outline' as const };

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}
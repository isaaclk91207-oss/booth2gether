import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User } from '@booth2gether/shared';

interface UserAvatarProps {
  user: User;
  showRole?: boolean;
  showReady?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({ user, showRole = false, showReady = false, className }: UserAvatarProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{user.name}</span>
        <div className="flex items-center gap-2">
          {showRole && (
            <Badge variant="outline" className="text-xs">
              {user.role}
            </Badge>
          )}
          {showReady && (
            <Badge variant={user.isReady ? 'success' : 'secondary'} className="text-xs">
              {user.isReady ? 'Ready' : 'Not ready'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
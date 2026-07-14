import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        'flex min-h-screen flex-col items-center justify-center px-4 py-8',
        className
      )}
    >
      <div className="w-full max-w-md space-y-6">{children}</div>
    </main>
  );
}
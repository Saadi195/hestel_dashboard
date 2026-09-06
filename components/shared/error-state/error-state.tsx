import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Displays a user-friendly error state.
 * Never shows raw error messages or stack traces.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center',
        className,
      )}
    >
      <AlertCircle className="text-destructive mb-4 h-10 w-10" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

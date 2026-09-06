import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Full-area loading spinner for data loading states.
 */
export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-10 text-center', className)}>
      <Loader2 className="text-muted-foreground mb-3 h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

/**
 * Inline skeleton loader for table rows.
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="bg-muted h-4 animate-pulse rounded" />
        </td>
      ))}
    </tr>
  );
}

import { formatDate } from '@/lib/utils/date';

export interface DateDisplayProps {
  date: string | Date | null | undefined;
  fallback?: string;
  className?: string;
}

export function DateDisplay({ date, fallback = '—', className }: DateDisplayProps) {
  if (!date) return <span className={className}>{fallback}</span>;
  return <span className={className}>{formatDate(date)}</span>;
}

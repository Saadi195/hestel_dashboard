import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_VARIANT_MAP: Record<string, BadgeProps['variant']> = {
  ACTIVE: 'success',
  RESERVED: 'info',
  NOTICE_PERIOD: 'warning',
  CHECKOUT_PENDING: 'warning',
  CHECKED_OUT: 'secondary',
  SUSPENDED: 'destructive',
  AVAILABLE: 'success',
  MAINTENANCE: 'destructive',
  EMPTY: 'secondary',
  PARTIALLY_OCCUPIED: 'info',
  FULLY_OCCUPIED: 'success',
  UNASSIGNED: 'secondary',
  ASSIGNED: 'info',
  PAID: 'success',
  PARTIALLY_PAID: 'info',
  UNPAID: 'warning',
  OVERDUE: 'destructive',
  WAIVED: 'secondary',
  PENDING: 'warning',
  REFUNDED: 'info',
  SETTLED: 'success',
  SUBMITTED: 'info',
  APPROVED: 'success',
  CANCELLED: 'destructive',
  COMPLETED: 'success',
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'outline';
  const displayLabel = label ?? status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={className}>
      {displayLabel}
    </Badge>
  );
}

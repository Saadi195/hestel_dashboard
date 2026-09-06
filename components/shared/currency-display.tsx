import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency';

export interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export function CurrencyDisplay({ amount, compact = false, className }: CurrencyDisplayProps) {
  const formatted = compact ? formatCurrencyCompact(amount) : formatCurrency(amount);
  return <span className={className}>{formatted}</span>;
}

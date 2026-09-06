/**
 * Currency utilities for Pakistani Rupee (PKR).
 *
 * All financial formatting is centralized here.
 * Never format currency ad-hoc in components.
 */

const PKR_FORMATTER = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const PKR_COMPACT_FORMATTER = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * Formats a number as PKR currency.
 *
 * @example formatCurrency(15000) → "PKR 15,000"
 */
export function formatCurrency(amount: number): string {
  return PKR_FORMATTER.format(amount);
}

/**
 * Formats a number as compact PKR currency (for dashboard stats).
 *
 * @example formatCurrencyCompact(1500000) → "PKR 1.5M"
 */
export function formatCurrencyCompact(amount: number): string {
  return PKR_COMPACT_FORMATTER.format(amount);
}

/**
 * Parses a currency string back to a number.
 * Strips currency symbols and commas.
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Calculates the remaining amount from total and paid.
 */
export function calculateRemaining(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

/**
 * Formats an amount with a sign prefix (+ or -) for transaction display.
 *
 * @example formatSignedCurrency(5000, 'credit') → "+PKR 5,000"
 * @example formatSignedCurrency(5000, 'debit')  → "-PKR 5,000"
 */
export function formatSignedCurrency(amount: number, type: 'credit' | 'debit'): string {
  const prefix = type === 'credit' ? '+' : '-';
  return `${prefix}${formatCurrency(amount)}`;
}

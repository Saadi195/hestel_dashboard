import { ProrationPolicy, RentStatus } from '@/domain/payments/entities';
import { BusinessRuleError } from '@/lib/errors/app-error';

/**
 * Derives the rent status from authoritative charge amount and total payments.
 */
export function deriveRentStatus(
  chargeAmount: number,
  totalPaymentsAmount: number,
  dueDate: string,
  asOfDate: Date = new Date(),
): RentStatus {
  if (totalPaymentsAmount >= chargeAmount) {
    return RentStatus.PAID;
  }
  if (totalPaymentsAmount > 0) {
    return RentStatus.PARTIALLY_PAID;
  }

  const due = new Date(dueDate);
  if (asOfDate > due) {
    return RentStatus.OVERDUE;
  }

  return RentStatus.UNPAID;
}

/**
 * Calculates derived outstanding rent balance.
 */
export function calculateOutstandingRent(
  chargeAmount: number,
  totalPaymentsAmount: number,
): number {
  return Math.max(0, chargeAmount - totalPaymentsAmount);
}

/**
 * Calculates initial rent charge according to the configured ProrationPolicy.
 */
export function calculateInitialRentCharge(
  monthlyRent: number,
  checkInDate: Date,
  policy: ProrationPolicy = ProrationPolicy.FULL_MONTH,
): number {
  if (monthlyRent < 0) {
    throw new BusinessRuleError('Monthly rent cannot be negative.', 'INVALID_MONTHLY_RENT');
  }

  if (policy === ProrationPolicy.FULL_MONTH) {
    return monthlyRent;
  }

  // DAILY_PRORATED
  const year = checkInDate.getFullYear();
  const month = checkInDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = daysInMonth - checkInDate.getDate() + 1;

  const dailyRate = monthlyRent / daysInMonth;
  const prorated = dailyRate * Math.max(1, daysRemaining);

  return Math.round(prorated * 100) / 100;
}

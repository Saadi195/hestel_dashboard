import { BusinessRuleError } from '@/lib/errors/app-error';

import { FineStatus } from './entities';

/**
 * Calculates derived fine balance from authoritative fine amount and sum of fine payments.
 */
export function deriveFineBalance(amount: number, totalPaymentsAmount: number): number {
  return Math.max(0, amount - totalPaymentsAmount);
}

/**
 * Derives current fine status.
 */
export function deriveFineStatus(
  amount: number,
  totalPaymentsAmount: number,
  isWaived: boolean,
): FineStatus {
  if (isWaived) return FineStatus.WAIVED;
  if (totalPaymentsAmount <= 0) return FineStatus.UNPAID;
  if (totalPaymentsAmount >= amount) return FineStatus.PAID;
  return FineStatus.PARTIALLY_PAID;
}

/**
 * Validates that a fine can be waived.
 */
export function assertCanWaiveFine(isWaived: boolean, derivedStatus: FineStatus): void {
  if (isWaived || derivedStatus === FineStatus.WAIVED) {
    throw new BusinessRuleError('This fine has already been waived.', 'FINE_ALREADY_WAIVED');
  }
  if (derivedStatus === FineStatus.PAID) {
    throw new BusinessRuleError(
      'Cannot waive a fine that has already been fully paid.',
      'FINE_ALREADY_PAID',
    );
  }
}

/**
 * Validates that a fine payment is valid.
 */
export function assertValidFinePayment(paymentAmount: number, outstandingBalance: number): void {
  if (paymentAmount <= 0) {
    throw new BusinessRuleError(
      'Payment amount must be greater than zero.',
      'FINE_PAYMENT_INVALID_AMOUNT',
    );
  }
  if (paymentAmount > outstandingBalance) {
    throw new BusinessRuleError(
      `Payment amount (${paymentAmount}) cannot exceed outstanding fine balance (${outstandingBalance}).`,
      'FINE_PAYMENT_EXCEEDS_BALANCE',
    );
  }
}

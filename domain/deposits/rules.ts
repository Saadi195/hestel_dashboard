import { BusinessRuleError } from '@/lib/errors/app-error';

import { DepositStatus } from './entities';

/**
 * Calculates derived total deposit paid from installment transaction records.
 */
export function deriveDepositPaidTotal(paymentsSum: number): number {
  return Math.max(0, paymentsSum);
}

/**
 * Calculates derived deposit balance (paid - deductions).
 */
export function deriveNetDepositBalance(paymentsSum: number, deductionsSum: number): number {
  return Math.max(0, paymentsSum - deductionsSum);
}

/**
 * Derives current deposit status.
 */
export function deriveDepositStatus(
  requiredAmount: number,
  paymentsSum: number,
  isSettledOrRefunded: boolean = false,
): DepositStatus {
  if (isSettledOrRefunded) return DepositStatus.REFUNDED;
  if (paymentsSum <= 0) return DepositStatus.PENDING;
  if (paymentsSum >= requiredAmount) return DepositStatus.PAID;
  return DepositStatus.PARTIALLY_PAID;
}

/**
 * Validates a deposit deduction.
 */
export function assertValidDepositDeduction(
  deductionAmount: number,
  netDepositBalance: number,
): void {
  if (deductionAmount <= 0) {
    throw new BusinessRuleError(
      'Deduction amount must be greater than zero.',
      'INVALID_DEDUCTION_AMOUNT',
    );
  }
  if (deductionAmount > netDepositBalance) {
    throw new BusinessRuleError(
      `Deduction amount (${deductionAmount}) cannot exceed available deposit balance (${netDepositBalance}).`,
      'DEDUCTION_EXCEEDS_DEPOSIT_BALANCE',
    );
  }
}

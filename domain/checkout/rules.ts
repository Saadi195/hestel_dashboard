import { BusinessRuleError } from '@/lib/errors/app-error';

import type {
  DynamicSettlementCalculation,
  CheckoutSettlementStatus,
} from './entities';

/**
 * Dynamically computes checkout settlement numbers from authoritative transaction balances.
 */
export function calculateDynamicSettlement(
  residentId: string,
  totalRentDue: number,
  totalFinesDue: number,
  depositPaid: number,
  depositDeductions: number,
  allowDeductRentFromDeposit: boolean = true,
  allowDeductFinesFromDeposit: boolean = true,
): DynamicSettlementCalculation {
  const netDepositAvailable = Math.max(0, depositPaid - depositDeductions);

  let rentDeduction = 0;
  let finesDeduction = 0;
  let remainingDeposit = netDepositAvailable;

  if (allowDeductRentFromDeposit && totalRentDue > 0 && remainingDeposit > 0) {
    rentDeduction = Math.min(totalRentDue, remainingDeposit);
    remainingDeposit -= rentDeduction;
  }

  if (allowDeductFinesFromDeposit && totalFinesDue > 0 && remainingDeposit > 0) {
    finesDeduction = Math.min(totalFinesDue, remainingDeposit);
    remainingDeposit -= finesDeduction;
  }

  const remainingRentDue = totalRentDue - rentDeduction;
  const remainingFinesDue = totalFinesDue - finesDeduction;

  const refundableDeposit = remainingDeposit;
  const netAmountDue = remainingRentDue + remainingFinesDue;

  return {
    residentId,
    totalRentDue,
    totalFinesDue,
    depositPaid,
    depositDeductions,
    refundableDeposit,
    netAmountDue,
  };
}

/**
 * Asserts that a settlement can be finalized/approved.
 */
export function assertCanApproveSettlement(
  status: CheckoutSettlementStatus,
  hasApproverPermission: boolean,
): void {
  if (!hasApproverPermission) {
    throw new BusinessRuleError(
      'You do not have permission to approve checkout settlements.',
      'UNAUTHORIZED_CHECKOUT_APPROVER',
    );
  }
  if (status === 'APPROVED' || status === 'COMPLETED') {
    throw new BusinessRuleError(
      'This checkout settlement has already been approved.',
      'SETTLEMENT_ALREADY_APPROVED',
    );
  }
}

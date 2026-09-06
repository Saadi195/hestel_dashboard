/**
 * Checkout domain entities.
 */

export enum CheckoutSettlementStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REFUNDED = 'REFUNDED',
  COMPLETED = 'COMPLETED',
}

/**
 * Dynamically calculated settlement values prior to approval.
 */
export interface DynamicSettlementCalculation {
  residentId: string;
  totalRentDue: number;
  totalFinesDue: number;
  depositPaid: number;
  depositDeductions: number;
  refundableDeposit: number;
  netAmountDue: number;
}

/**
 * Immutable historical settlement snapshot persisted upon final approval.
 */
export interface CheckoutSettlementSnapshot {
  id: string;
  hostelId: string;
  residentId: string;
  noticeId: string | null;
  checkoutDate: string;
  snapshotTotalRentDue: number;
  snapshotTotalFinesDue: number;
  snapshotDepositPaid: number;
  snapshotDepositDeductions: number;
  snapshotRefundableAmount: number;
  snapshotNetAmountDue: number;
  status: CheckoutSettlementStatus;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Security Deposit domain entities.
 */

export enum DepositStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
}

export interface SecurityDeposit {
  id: string;
  hostelId: string;
  residentId: string;
  requiredAmount: number; // AUTHORITATIVE
  createdAt: string;
  updatedAt: string;
}

export interface SecurityDepositPayment {
  id: string;
  depositId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface SecurityDepositDeduction {
  id: string;
  depositId: string;
  reason: string;
  amount: number;
  approvedBy: string;
  createdAt: string;
}

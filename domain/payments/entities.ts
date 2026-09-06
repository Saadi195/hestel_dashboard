/**
 * Rent and Payment domain entities.
 */

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  EASYPAISA = 'EASYPAISA',
  JAZZCASH = 'JAZZCASH',
  OTHER = 'OTHER',
}

export enum RentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum ProrationPolicy {
  FULL_MONTH = 'FULL_MONTH',
  DAILY_PRORATED = 'DAILY_PRORATED',
}

export interface RentCharge {
  id: string;
  hostelId: string;
  residentId: string;
  billingPeriod: string; // e.g. '2026-08'
  amount: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentPayment {
  id: string;
  rentChargeId: string;
  residentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
}

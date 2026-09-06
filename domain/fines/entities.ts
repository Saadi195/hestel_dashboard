/**
 * Fine domain entities.
 */

export enum FineStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

export interface Fine {
  id: string;
  hostelId: string;
  residentId: string;
  title: string;
  reason: string;
  amount: number; // AUTHORITATIVE (amountPaid removed)
  isWaived: boolean;
  waivedBy: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
  issuedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinePayment {
  id: string;
  fineId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  recordedBy: string;
  createdAt: string;
}

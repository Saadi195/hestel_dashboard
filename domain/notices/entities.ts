/**
 * Notice domain entities.
 */

export enum NoticeStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Notice {
  id: string;
  hostelId: string;
  residentId: string;
  noticeDate: string;
  requiredDays: number;
  expectedCheckoutDate: string;
  reason: string | null;
  status: NoticeStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

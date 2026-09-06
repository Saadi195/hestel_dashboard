/**
 * Resident Assignment domain entities.
 */

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ResidentAssignment {
  id: string;
  residentId: string;
  bedId: string;
  checkInDate: string;
  checkOutDate: string | null;
  status: AssignmentStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

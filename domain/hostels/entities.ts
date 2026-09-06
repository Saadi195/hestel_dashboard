/**
 * Hostel domain entities.
 */

export enum HostelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Hostel {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: HostelStatus;
  createdAt: string;
  updatedAt: string;
}

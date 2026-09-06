/**
 * Resident domain entities.
 *
 * Pure TypeScript — no React, no Supabase, no framework imports.
 */

export enum ResidentStatus {
  RESERVED = 'RESERVED',
  ACTIVE = 'ACTIVE',
  NOTICE_PERIOD = 'NOTICE_PERIOD',
  CHECKOUT_PENDING = 'CHECKOUT_PENDING',
  CHECKED_OUT = 'CHECKED_OUT',
  SUSPENDED = 'SUSPENDED',
}

export interface Resident {
  id: string;
  hostelId: string;
  fullName: string;
  phone: string;
  guardianName: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  cnic: string | null; // SENSITIVE PII
  address: string | null;
  profilePictureUrl: string | null;
  status: ResidentStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentSuspension {
  id: string;
  residentId: string;
  hostelId: string;
  reason: string;
  suspendedBy: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentSummary {
  id: string;
  fullName: string;
  phone: string;
  status: ResidentStatus;
  roomNumber: string | null;
  bedNumber: string | null;
  checkInDate: string | null;
}

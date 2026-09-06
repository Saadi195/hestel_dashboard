/**
 * Visitor domain entities.
 */

export interface Visitor {
  id: string;
  hostelId: string;
  residentId: string;
  visitorName: string;
  visitorPhone: string | null;
  cnic: string | null;
  relationship: string | null;
  checkIn: string;
  checkOut: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
}

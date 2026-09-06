/**
 * Room and Bed domain entities.
 */

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  DORMITORY = 'DORMITORY',
}

export enum OperationalStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DerivedRoomOccupancy {
  EMPTY = 'EMPTY',
  PARTIALLY_OCCUPIED = 'PARTIALLY_OCCUPIED',
  FULLY_OCCUPIED = 'FULLY_OCCUPIED',
}

export enum DerivedBedOccupancy {
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
}

export interface Room {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number | null;
  roomType: RoomType;
  capacity: number;
  operationalStatus: OperationalStatus;
  monthlyRent: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  operationalStatus: OperationalStatus;
  createdAt: string;
  updatedAt: string;
}

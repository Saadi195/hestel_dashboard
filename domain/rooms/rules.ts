import { BusinessRuleError } from '@/lib/errors/app-error';

import {
  OperationalStatus,
  DerivedRoomOccupancy,
  DerivedBedOccupancy,
} from './entities';

/**
 * Derives the occupancy status of a room dynamically from active bed assignments.
 */
export function deriveRoomOccupancy(
  activeAssignmentsCount: number,
  capacity: number,
): DerivedRoomOccupancy {
  if (activeAssignmentsCount <= 0) return DerivedRoomOccupancy.EMPTY;
  if (activeAssignmentsCount >= capacity) return DerivedRoomOccupancy.FULLY_OCCUPIED;
  return DerivedRoomOccupancy.PARTIALLY_OCCUPIED;
}

/**
 * Derives the occupancy status of a bed dynamically from active assignments.
 */
export function deriveBedOccupancy(hasActiveAssignment: boolean): DerivedBedOccupancy {
  return hasActiveAssignment ? DerivedBedOccupancy.ASSIGNED : DerivedBedOccupancy.UNASSIGNED;
}

/**
 * Asserts that a bed can accept an active assignment.
 */
export function assertBedIsAssignable(
  bedOperationalStatus: OperationalStatus,
  roomOperationalStatus: OperationalStatus,
  hasActiveAssignment: boolean,
): void {
  if (roomOperationalStatus === OperationalStatus.MAINTENANCE) {
    throw new BusinessRuleError(
      'This room is currently under maintenance and cannot accept new resident assignments.',
      'ROOM_UNDER_MAINTENANCE',
    );
  }
  if (bedOperationalStatus === OperationalStatus.MAINTENANCE) {
    throw new BusinessRuleError(
      'This bed is currently under maintenance and cannot accept new resident assignments.',
      'BED_UNDER_MAINTENANCE',
    );
  }
  if (hasActiveAssignment) {
    throw new BusinessRuleError(
      'This bed is already assigned to another active resident.',
      'BED_ALREADY_ASSIGNED',
    );
  }
}

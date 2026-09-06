import { describe, it, expect } from 'vitest';

import {
  OperationalStatus,
  DerivedRoomOccupancy,
  DerivedBedOccupancy,
} from '@/domain/rooms/entities';
import {
  deriveRoomOccupancy,
  deriveBedOccupancy,
  assertBedIsAssignable,
} from '@/domain/rooms/rules';

describe('Room & Bed Occupancy Rules', () => {
  it('derives room occupancy correctly based on active assignments', () => {
    expect(deriveRoomOccupancy(0, 2)).toBe(DerivedRoomOccupancy.EMPTY);
    expect(deriveRoomOccupancy(1, 2)).toBe(DerivedRoomOccupancy.PARTIALLY_OCCUPIED);
    expect(deriveRoomOccupancy(2, 2)).toBe(DerivedRoomOccupancy.FULLY_OCCUPIED);
    expect(deriveRoomOccupancy(3, 2)).toBe(DerivedRoomOccupancy.FULLY_OCCUPIED);
  });

  it('derives bed occupancy correctly', () => {
    expect(deriveBedOccupancy(false)).toBe(DerivedBedOccupancy.UNASSIGNED);
    expect(deriveBedOccupancy(true)).toBe(DerivedBedOccupancy.ASSIGNED);
  });

  it('asserts bed assignability correctly', () => {
    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.AVAILABLE, false),
    ).not.toThrow();

    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.MAINTENANCE, false),
    ).toThrow('room is currently under maintenance');

    expect(() =>
      assertBedIsAssignable(OperationalStatus.MAINTENANCE, OperationalStatus.AVAILABLE, false),
    ).toThrow('bed is currently under maintenance');

    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.AVAILABLE, true),
    ).toThrow('already assigned to another active resident');
  });
});

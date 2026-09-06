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

describe('Room & Bed Integrity Integration', () => {
  it('derives room occupancy levels correctly across 0, partial, and full capacity', () => {
    expect(deriveRoomOccupancy(0, 4)).toBe(DerivedRoomOccupancy.EMPTY);
    expect(deriveRoomOccupancy(2, 4)).toBe(DerivedRoomOccupancy.PARTIALLY_OCCUPIED);
    expect(deriveRoomOccupancy(4, 4)).toBe(DerivedRoomOccupancy.FULLY_OCCUPIED);
    expect(deriveRoomOccupancy(5, 4)).toBe(DerivedRoomOccupancy.FULLY_OCCUPIED);
  });

  it('derives bed occupancy correctly', () => {
    expect(deriveBedOccupancy(true)).toBe(DerivedBedOccupancy.ASSIGNED);
    expect(deriveBedOccupancy(false)).toBe(DerivedBedOccupancy.UNASSIGNED);
  });

  it('allows bed assignment when room and bed are AVAILABLE and unassigned', () => {
    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.AVAILABLE, false),
    ).not.toThrow();
  });

  it('blocks assignment to rooms under maintenance', () => {
    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.MAINTENANCE, false),
    ).toThrowError(/room is currently under maintenance/i);
  });

  it('blocks assignment to beds under maintenance', () => {
    expect(() =>
      assertBedIsAssignable(OperationalStatus.MAINTENANCE, OperationalStatus.AVAILABLE, false),
    ).toThrowError(/bed is currently under maintenance/i);
  });

  it('blocks assignment to already assigned beds', () => {
    expect(() =>
      assertBedIsAssignable(OperationalStatus.AVAILABLE, OperationalStatus.AVAILABLE, true),
    ).toThrowError(/bed is already assigned/i);
  });
});

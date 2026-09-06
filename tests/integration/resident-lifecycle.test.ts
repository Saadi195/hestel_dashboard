import { describe, it, expect } from 'vitest';

import { ResidentStatus } from '@/domain/residents/entities';
import {
  isValidStatusTransition,
  isResidentOccupying,
  canCheckIn,
  canSubmitNotice,
  canSuspend,
  canCheckOut,
} from '@/domain/residents/rules';

describe('Resident Lifecycle State Machine Integration', () => {
  it('validates complete lifecycle flow: RESERVED -> ACTIVE -> NOTICE_PERIOD -> CHECKOUT_PENDING -> CHECKED_OUT', () => {
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.ACTIVE)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.ACTIVE, ResidentStatus.NOTICE_PERIOD)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.NOTICE_PERIOD, ResidentStatus.CHECKOUT_PENDING)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.CHECKOUT_PENDING, ResidentStatus.CHECKED_OUT)).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    // Cannot skip directly to CHECKED_OUT from RESERVED
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.CHECKED_OUT)).toBe(false);
    // Cannot transition from CHECKED_OUT (terminal state)
    expect(isValidStatusTransition(ResidentStatus.CHECKED_OUT, ResidentStatus.ACTIVE)).toBe(false);
    // Cannot transition directly from RESERVED to NOTICE_PERIOD
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.NOTICE_PERIOD)).toBe(false);
  });

  it('correctly identifies occupying statuses', () => {
    expect(isResidentOccupying(ResidentStatus.RESERVED)).toBe(false);
    expect(isResidentOccupying(ResidentStatus.ACTIVE)).toBe(true);
    expect(isResidentOccupying(ResidentStatus.NOTICE_PERIOD)).toBe(true);
    expect(isResidentOccupying(ResidentStatus.CHECKOUT_PENDING)).toBe(true);
    expect(isResidentOccupying(ResidentStatus.SUSPENDED)).toBe(true);
    expect(isResidentOccupying(ResidentStatus.CHECKED_OUT)).toBe(false);
  });

  it('enforces workflow step guards', () => {
    expect(canCheckIn(ResidentStatus.RESERVED)).toBe(true);
    expect(canCheckIn(ResidentStatus.ACTIVE)).toBe(false);

    expect(canSubmitNotice(ResidentStatus.ACTIVE)).toBe(true);
    expect(canSubmitNotice(ResidentStatus.RESERVED)).toBe(false);

    expect(canSuspend(ResidentStatus.ACTIVE)).toBe(true);
    expect(canSuspend(ResidentStatus.NOTICE_PERIOD)).toBe(true);
    expect(canSuspend(ResidentStatus.RESERVED)).toBe(false);

    expect(canCheckOut(ResidentStatus.CHECKOUT_PENDING)).toBe(true);
    expect(canCheckOut(ResidentStatus.ACTIVE)).toBe(false);
  });
});

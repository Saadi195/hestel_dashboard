import { describe, it, expect } from 'vitest';

import { ResidentStatus } from '@/domain/residents/entities';
import {
  isValidStatusTransition,
  canCheckIn,
  canSubmitNotice,
  canSuspend,
  canCheckOut,
} from '@/domain/residents/rules';

describe('Resident Status Transitions & Rules', () => {
  it('allows valid transitions in the resident lifecycle', () => {
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.ACTIVE)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.ACTIVE, ResidentStatus.NOTICE_PERIOD)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.ACTIVE, ResidentStatus.SUSPENDED)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.NOTICE_PERIOD, ResidentStatus.SUSPENDED)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.SUSPENDED, ResidentStatus.ACTIVE)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.NOTICE_PERIOD, ResidentStatus.CHECKOUT_PENDING)).toBe(true);
    expect(isValidStatusTransition(ResidentStatus.CHECKOUT_PENDING, ResidentStatus.CHECKED_OUT)).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.CHECKED_OUT)).toBe(false);
    expect(isValidStatusTransition(ResidentStatus.CHECKED_OUT, ResidentStatus.ACTIVE)).toBe(false);
    expect(isValidStatusTransition(ResidentStatus.RESERVED, ResidentStatus.SUSPENDED)).toBe(false);
    expect(isValidStatusTransition(ResidentStatus.SUSPENDED, ResidentStatus.CHECKED_OUT)).toBe(false);
  });

  it('validates action eligibility functions', () => {
    expect(canCheckIn(ResidentStatus.RESERVED)).toBe(true);
    expect(canCheckIn(ResidentStatus.ACTIVE)).toBe(false);

    expect(canSubmitNotice(ResidentStatus.ACTIVE)).toBe(true);
    expect(canSubmitNotice(ResidentStatus.NOTICE_PERIOD)).toBe(false);

    expect(canSuspend(ResidentStatus.ACTIVE)).toBe(true);
    expect(canSuspend(ResidentStatus.NOTICE_PERIOD)).toBe(true);
    expect(canSuspend(ResidentStatus.RESERVED)).toBe(false);

    expect(canCheckOut(ResidentStatus.CHECKOUT_PENDING)).toBe(true);
    expect(canCheckOut(ResidentStatus.ACTIVE)).toBe(false);
  });
});

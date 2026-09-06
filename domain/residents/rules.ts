import { ResidentStatus } from './entities';

/**
 * Valid state transitions for the resident lifecycle.
 *
 * RESERVED → ACTIVE (check-in)
 * ACTIVE → NOTICE_PERIOD (notice submitted)
 * ACTIVE → SUSPENDED (suspension)
 * NOTICE_PERIOD → CHECKOUT_PENDING (notice period elapsed)
 * NOTICE_PERIOD → SUSPENDED (suspension during notice)
 * SUSPENDED → ACTIVE (reinstated)
 * CHECKOUT_PENDING → CHECKED_OUT (checkout approved)
 */
const ALLOWED_TRANSITIONS: Record<ResidentStatus, ResidentStatus[]> = {
  [ResidentStatus.RESERVED]: [ResidentStatus.ACTIVE],
  [ResidentStatus.ACTIVE]: [ResidentStatus.NOTICE_PERIOD, ResidentStatus.SUSPENDED],
  [ResidentStatus.NOTICE_PERIOD]: [ResidentStatus.CHECKOUT_PENDING, ResidentStatus.SUSPENDED],
  [ResidentStatus.SUSPENDED]: [ResidentStatus.ACTIVE],
  [ResidentStatus.CHECKOUT_PENDING]: [ResidentStatus.CHECKED_OUT],
  [ResidentStatus.CHECKED_OUT]: [], // Terminal state
};

/**
 * Validates whether a resident status transition is valid according to business rules.
 */
export function isValidStatusTransition(from: ResidentStatus, to: ResidentStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getValidNextStatuses(current: ResidentStatus): ResidentStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}

export function isResidentOccupying(status: ResidentStatus): boolean {
  return [
    ResidentStatus.ACTIVE,
    ResidentStatus.NOTICE_PERIOD,
    ResidentStatus.CHECKOUT_PENDING,
    ResidentStatus.SUSPENDED,
  ].includes(status);
}

export function canCheckIn(status: ResidentStatus): boolean {
  return status === ResidentStatus.RESERVED;
}

export function canSubmitNotice(status: ResidentStatus): boolean {
  return status === ResidentStatus.ACTIVE;
}

export function canSuspend(status: ResidentStatus): boolean {
  return status === ResidentStatus.ACTIVE || status === ResidentStatus.NOTICE_PERIOD;
}

export function canCheckOut(status: ResidentStatus): boolean {
  return status === ResidentStatus.CHECKOUT_PENDING;
}

import { BusinessRuleError } from '@/lib/errors/app-error';

/**
 * Validates that a resident does not already have an active assignment.
 */
export function assertNoActiveResidentAssignment(hasActiveAssignment: boolean): void {
  if (hasActiveAssignment) {
    throw new BusinessRuleError(
      'The resident already has an active bed assignment. Complete or cancel the existing assignment first.',
      'RESIDENT_HAS_ACTIVE_ASSIGNMENT',
    );
  }
}

/**
 * Validates check-in date is valid format and not in the far future.
 */
export function assertValidCheckInDate(checkInDate: string): void {
  const date = new Date(checkInDate);
  if (isNaN(date.getTime())) {
    throw new BusinessRuleError('Invalid check-in date format.', 'INVALID_CHECKIN_DATE');
  }
}

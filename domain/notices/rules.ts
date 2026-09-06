import { addDays } from 'date-fns';

/**
 * Notice domain rules.
 *
 * The 15-day notice period is configurable via hostel_settings.
 * The calculation is centralized here — SINGLE SOURCE OF TRUTH.
 *
 * Never hard-code 15 in any component, page, or service.
 * Always use calculateExpectedCheckoutDate().
 */

/** Default notice period in days. Overridable via hostel_settings. */
export const DEFAULT_NOTICE_PERIOD_DAYS = 15;

/**
 * Calculates the expected checkout date based on the notice submission date
 * and the configured notice period.
 *
 * @param noticeDate - The date notice was submitted
 * @param noticePeriodDays - Configurable days (from hostel_settings.notice_period_days)
 * @returns The expected checkout date
 */
export function calculateExpectedCheckoutDate(
  noticeDate: Date,
  noticePeriodDays: number = DEFAULT_NOTICE_PERIOD_DAYS,
): Date {
  if (noticePeriodDays < 0) {
    throw new Error('Notice period days cannot be negative');
  }
  return addDays(noticeDate, noticePeriodDays);
}

/**
 * Checks if the notice period has elapsed from the given notice date.
 *
 * @param noticeDate - The date notice was submitted
 * @param noticePeriodDays - Configurable days
 * @param asOf - The date to check against (defaults to today)
 */
export function isNoticePeriodElapsed(
  noticeDate: Date,
  noticePeriodDays: number = DEFAULT_NOTICE_PERIOD_DAYS,
  asOf: Date = new Date(),
): boolean {
  const expectedCheckout = calculateExpectedCheckoutDate(noticeDate, noticePeriodDays);
  return asOf >= expectedCheckout;
}

/**
 * Returns the number of days remaining in the notice period.
 * Returns 0 if the notice period has already elapsed.
 */
export function getNoticeDaysRemaining(
  noticeDate: Date,
  noticePeriodDays: number = DEFAULT_NOTICE_PERIOD_DAYS,
  asOf: Date = new Date(),
): number {
  const expectedCheckout = calculateExpectedCheckoutDate(noticeDate, noticePeriodDays);
  const remaining = Math.ceil((expectedCheckout.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

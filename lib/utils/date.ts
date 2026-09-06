import { format, formatDistanceToNow, parseISO, addDays, differenceInDays } from 'date-fns';

/**
 * Date utilities for the Hostel Management System.
 *
 * All date formatting and calculation is centralized here.
 * Always use these helpers instead of raw date manipulation in components.
 */

/**
 * Formats a date string or Date object for display.
 *
 * @example formatDate('2024-01-15') → "15 Jan 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

/**
 * Formats a date with time.
 *
 * @example formatDateTime('2024-01-15T10:30:00') → "15 Jan 2024, 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

/**
 * Returns a relative time string.
 *
 * @example formatRelativeTime('2024-01-01') → "3 months ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Formats a date for HTML input[type="date"] fields.
 *
 * @example formatDateInput(new Date()) → "2024-01-15"
 */
export function formatDateInput(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Calculates the expected checkout date from a notice date.
 *
 * @param noticeDate - The date the resident submitted notice
 * @param noticePeriodDays - Configurable notice period (default: 15)
 * @returns The calculated checkout date
 */
export function calculateCheckoutDate(noticeDate: Date | string, noticePeriodDays: number): Date {
  const d = typeof noticeDate === 'string' ? parseISO(noticeDate) : noticeDate;
  return addDays(d, noticePeriodDays);
}

/**
 * Calculates the number of days between two dates.
 */
export function daysBetween(from: Date | string, to: Date | string): number {
  const fromDate = typeof from === 'string' ? parseISO(from) : from;
  const toDate = typeof to === 'string' ? parseISO(to) : to;
  return differenceInDays(toDate, fromDate);
}

/**
 * Returns today's date formatted for API use (YYYY-MM-DD).
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

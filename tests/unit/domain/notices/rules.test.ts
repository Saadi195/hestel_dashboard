import { describe, it, expect } from 'vitest';

import {
  calculateExpectedCheckoutDate,
  isNoticePeriodElapsed,
  getNoticeDaysRemaining,
  DEFAULT_NOTICE_PERIOD_DAYS,
} from '@/domain/notices/rules';

describe('Notice Period Rules & Date Edge Cases', () => {
  it('has a default notice period of 15 days', () => {
    expect(DEFAULT_NOTICE_PERIOD_DAYS).toBe(15);
  });

  it('calculates expected checkout date from notice date', () => {
    const noticeDate = new Date('2026-01-01');
    const result = calculateExpectedCheckoutDate(noticeDate, 15);
    expect(result).toEqual(new Date('2026-01-16'));
  });

  it('handles month-end transitions correctly (e.g. Jan 20 + 15 days = Feb 4)', () => {
    const noticeDate = new Date('2026-01-20');
    const result = calculateExpectedCheckoutDate(noticeDate, 15);
    expect(result).toEqual(new Date('2026-02-04'));
  });

  it('handles leap year February date calculations correctly (Feb 15, 2024 + 15 days = Mar 1)', () => {
    // 2024 is a leap year (Feb has 29 days)
    const noticeDate = new Date('2024-02-15');
    const result = calculateExpectedCheckoutDate(noticeDate, 15);
    expect(result).toEqual(new Date('2024-03-01'));
  });

  it('detects elapsed notice period', () => {
    const noticeDate = new Date('2026-01-01');
    const asOf = new Date('2026-01-20');
    expect(isNoticePeriodElapsed(noticeDate, 15, asOf)).toBe(true);
  });

  it('detects non-elapsed notice period', () => {
    const noticeDate = new Date('2026-01-01');
    const asOf = new Date('2026-01-10');
    expect(isNoticePeriodElapsed(noticeDate, 15, asOf)).toBe(false);
  });

  it('calculates remaining notice days correctly', () => {
    const noticeDate = new Date('2026-01-01');
    const asOf = new Date('2026-01-06');
    expect(getNoticeDaysRemaining(noticeDate, 15, asOf)).toBe(10);
  });

  it('returns 0 when notice period has elapsed', () => {
    const noticeDate = new Date('2026-01-01');
    const asOf = new Date('2026-02-01');
    expect(getNoticeDaysRemaining(noticeDate, 15, asOf)).toBe(0);
  });

  it('throws for negative notice period', () => {
    expect(() => calculateExpectedCheckoutDate(new Date(), -1)).toThrow();
  });
});

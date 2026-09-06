import { describe, it, expect } from 'vitest';

import { RentStatus, ProrationPolicy } from '@/domain/payments/entities';
import {
  deriveRentStatus,
  calculateOutstandingRent,
  calculateInitialRentCharge,
} from '@/domain/rent/rules';

describe('Rent & Proration Rules', () => {
  it('derives rent status based on charge vs payments', () => {
    const dueDate = '2026-08-05';
    const asOfBeforeDue = new Date('2026-08-01');
    const asOfAfterDue = new Date('2026-08-10');

    expect(deriveRentStatus(15000, 15000, dueDate, asOfBeforeDue)).toBe(RentStatus.PAID);
    expect(deriveRentStatus(15000, 5000, dueDate, asOfBeforeDue)).toBe(RentStatus.PARTIALLY_PAID);
    expect(deriveRentStatus(15000, 0, dueDate, asOfBeforeDue)).toBe(RentStatus.UNPAID);
    expect(deriveRentStatus(15000, 0, dueDate, asOfAfterDue)).toBe(RentStatus.OVERDUE);
  });

  it('calculates derived outstanding rent balance', () => {
    expect(calculateOutstandingRent(15000, 5000)).toBe(10000);
    expect(calculateOutstandingRent(15000, 15000)).toBe(0);
    expect(calculateOutstandingRent(15000, 20000)).toBe(0);
  });

  it('calculates initial rent with FULL_MONTH proration policy', () => {
    const checkIn = new Date('2026-08-15');
    const rent = calculateInitialRentCharge(15000, checkIn, ProrationPolicy.FULL_MONTH);
    expect(rent).toBe(15000);
  });

  it('calculates initial rent with DAILY_PRORATED policy', () => {
    // August has 31 days. Checking in on Aug 16 = 16 days remaining (16..31)
    const checkIn = new Date('2026-08-16');
    const rent = calculateInitialRentCharge(31000, checkIn, ProrationPolicy.DAILY_PRORATED);
    expect(rent).toBe(16000); // 1000 per day * 16 days
  });
});

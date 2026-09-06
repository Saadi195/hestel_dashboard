import { describe, it, expect } from 'vitest';

import { calculateDynamicSettlement } from '@/domain/checkout/rules';
import {
  deriveDepositPaidTotal,
  deriveNetDepositBalance,
} from '@/domain/deposits/rules';
import { FineStatus } from '@/domain/fines/entities';
import { deriveFineBalance, deriveFineStatus, assertCanWaiveFine } from '@/domain/fines/rules';
import { ProrationPolicy, RentStatus } from '@/domain/payments/entities';
import {
  deriveRentStatus,
  calculateOutstandingRent,
  calculateInitialRentCharge,
} from '@/domain/rent/rules';

describe('Financial Integrity & Calculation Integration', () => {
  describe('Rent Charge & Payment Calculations', () => {
    it('calculates full month rent charge correctly', () => {
      const charge = calculateInitialRentCharge(30000, new Date('2026-02-15'), ProrationPolicy.FULL_MONTH);
      expect(charge).toBe(30000);
    });

    it('calculates daily prorated rent correctly for February leap year vs non-leap year', () => {
      // 2024 is leap year (29 days in Feb)
      const leapFebDate = new Date('2024-02-15');
      const proratedLeap = calculateInitialRentCharge(29000, leapFebDate, ProrationPolicy.DAILY_PRORATED);
      // Days remaining from 15th to 29th inclusive = 15 days. (29000/29)*15 = 15000
      expect(proratedLeap).toBe(15000);

      // 2025 is non-leap year (28 days in Feb)
      const nonLeapFebDate = new Date('2025-02-15');
      const proratedNonLeap = calculateInitialRentCharge(28000, nonLeapFebDate, ProrationPolicy.DAILY_PRORATED);
      // Days remaining from 15th to 28th inclusive = 14 days. (28000/28)*14 = 14000
      expect(proratedNonLeap).toBe(14000);
    });

    it('derives rent status correctly across PAID, PARTIALLY_PAID, UNPAID, and OVERDUE', () => {
      const dueDate = '2026-01-10';
      const beforeDue = new Date('2026-01-05');
      const afterDue = new Date('2026-01-15');

      expect(deriveRentStatus(10000, 10000, dueDate, beforeDue)).toBe(RentStatus.PAID);
      expect(deriveRentStatus(10000, 4000, dueDate, beforeDue)).toBe(RentStatus.PARTIALLY_PAID);
      expect(deriveRentStatus(10000, 0, dueDate, beforeDue)).toBe(RentStatus.UNPAID);
      expect(deriveRentStatus(10000, 0, dueDate, afterDue)).toBe(RentStatus.OVERDUE);
    });

    it('calculates outstanding rent balance without negative outputs', () => {
      expect(calculateOutstandingRent(15000, 5000)).toBe(10000);
      expect(calculateOutstandingRent(15000, 15000)).toBe(0);
      expect(calculateOutstandingRent(15000, 20000)).toBe(0);
    });
  });

  describe('Security Deposit Calculations', () => {
    it('derives deposit payments total and net available balance after deductions', () => {
      const paidTotal = deriveDepositPaidTotal(15000);
      expect(paidTotal).toBe(15000);

      const netBalance = deriveNetDepositBalance(15000, 3000);
      expect(netBalance).toBe(12000);
    });
  });

  describe('Fine & Waiver Rules', () => {
    it('derives fine status and balance from authoritative transaction totals', () => {
      expect(deriveFineBalance(5000, 2000)).toBe(3000);
      expect(deriveFineStatus(5000, 0, false)).toBe(FineStatus.UNPAID);
      expect(deriveFineStatus(5000, 2000, false)).toBe(FineStatus.PARTIALLY_PAID);
      expect(deriveFineStatus(5000, 5000, false)).toBe(FineStatus.PAID);
      expect(deriveFineStatus(5000, 0, true)).toBe(FineStatus.WAIVED);
    });

    it('prevents waiving an already fully-paid fine', () => {
      expect(() => assertCanWaiveFine(false, FineStatus.PAID)).toThrowError(/cannot waive a fine that has already been fully paid/i);
    });
  });

  describe('Checkout Dynamic Settlement Engine', () => {
    it('calculates settlement correctly when deposit covers rent and fines completely', () => {
      const settlement = calculateDynamicSettlement(
        'resident-1',
        5000, // rent due
        1000, // fines due
        15000, // deposit paid
        2000, // deposit deductions
      );
      expect(settlement.refundableDeposit).toBe(7000);
      expect(settlement.netAmountDue).toBe(0);
    });

    it('calculates settlement correctly when liabilities exceed deposit', () => {
      const settlement = calculateDynamicSettlement(
        'resident-2',
        10000, // rent due
        5000,  // fines due
        5000,  // deposit paid
        0,     // deposit deductions
      );
      expect(settlement.refundableDeposit).toBe(0);
      expect(settlement.netAmountDue).toBe(10000);
    });
  });
});

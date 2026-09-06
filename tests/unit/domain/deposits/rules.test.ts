import { describe, it, expect } from 'vitest';

import { DepositStatus } from '@/domain/deposits/entities';
import {
  deriveDepositPaidTotal,
  deriveNetDepositBalance,
  deriveDepositStatus,
  assertValidDepositDeduction,
} from '@/domain/deposits/rules';

describe('Security Deposit Rules', () => {
  it('derives deposit paid and net deposit balance', () => {
    expect(deriveDepositPaidTotal(20000)).toBe(20000);
    expect(deriveNetDepositBalance(20000, 5000)).toBe(15000);
    expect(deriveNetDepositBalance(20000, 25000)).toBe(0);
  });

  it('derives deposit status', () => {
    expect(deriveDepositStatus(20000, 0)).toBe(DepositStatus.PENDING);
    expect(deriveDepositStatus(20000, 10000)).toBe(DepositStatus.PARTIALLY_PAID);
    expect(deriveDepositStatus(20000, 20000)).toBe(DepositStatus.PAID);
    expect(deriveDepositStatus(20000, 20000, true)).toBe(DepositStatus.REFUNDED);
  });

  it('validates deposit deductions against available net balance', () => {
    expect(() => assertValidDepositDeduction(5000, 15000)).not.toThrow();
    expect(() => assertValidDepositDeduction(0, 15000)).toThrow('greater than zero');
    expect(() => assertValidDepositDeduction(20000, 15000)).toThrow('cannot exceed available deposit balance');
  });
});

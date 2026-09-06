import { describe, it, expect } from 'vitest';

import { FineStatus } from '@/domain/fines/entities';
import {
  deriveFineBalance,
  deriveFineStatus,
  assertCanWaiveFine,
  assertValidFinePayment,
} from '@/domain/fines/rules';

describe('Fine Rules (Without duplicate amountPaid)', () => {
  it('derives fine balance from authoritative amount and sum of fine payments', () => {
    expect(deriveFineBalance(5000, 0)).toBe(5000);
    expect(deriveFineBalance(5000, 2000)).toBe(3000);
    expect(deriveFineBalance(5000, 5000)).toBe(0);
  });

  it('derives fine status correctly', () => {
    expect(deriveFineStatus(5000, 0, false)).toBe(FineStatus.UNPAID);
    expect(deriveFineStatus(5000, 2000, false)).toBe(FineStatus.PARTIALLY_PAID);
    expect(deriveFineStatus(5000, 5000, false)).toBe(FineStatus.PAID);
    expect(deriveFineStatus(5000, 0, true)).toBe(FineStatus.WAIVED);
  });

  it('validates fine waivers', () => {
    expect(() => assertCanWaiveFine(false, FineStatus.UNPAID)).not.toThrow();
    expect(() => assertCanWaiveFine(false, FineStatus.PARTIALLY_PAID)).not.toThrow();
    expect(() => assertCanWaiveFine(true, FineStatus.WAIVED)).toThrow('already been waived');
    expect(() => assertCanWaiveFine(false, FineStatus.PAID)).toThrow('already been fully paid');
  });

  it('validates fine payment amounts', () => {
    expect(() => assertValidFinePayment(2000, 3000)).not.toThrow();
    expect(() => assertValidFinePayment(0, 3000)).toThrow('greater than zero');
    expect(() => assertValidFinePayment(4000, 3000)).toThrow('cannot exceed outstanding fine balance');
  });
});

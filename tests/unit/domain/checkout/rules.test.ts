import { describe, it, expect } from 'vitest';

import { CheckoutSettlementStatus } from '@/domain/checkout/entities';
import {
  calculateDynamicSettlement,
  assertCanApproveSettlement,
} from '@/domain/checkout/rules';

describe('Checkout Settlement Rules', () => {
  it('calculates dynamic checkout settlement dynamically', () => {
    // Deposit 20,000 paid, 2,000 damage deduction, 5,000 rent due, 1,000 fine due
    const settlement = calculateDynamicSettlement(
      'res-123',
      5000,
      1000,
      20000,
      2000,
      true, // allow deduct rent
      true, // allow deduct fines
    );

    // Available deposit = 20,000 - 2,000 = 18,000
    // Rent deduction = 5,000 -> remaining deposit = 13,000
    // Fine deduction = 1,000 -> remaining deposit = 12,000
    expect(settlement.refundableDeposit).toBe(12000);
    expect(settlement.netAmountDue).toBe(0);
  });

  it('calculates net amount due when deposit is insufficient to cover rent/fines', () => {
    // Deposit 5,000 paid, 0 damage deduction, 10,000 rent due, 2,000 fine due
    const settlement = calculateDynamicSettlement(
      'res-123',
      10000,
      2000,
      5000,
      0,
      true,
      true,
    );

    // Available deposit = 5,000
    // Rent deduction = 5,000 -> remaining rent = 5,000. Deposit left = 0.
    // Fine deduction = 0 -> remaining fine = 2,000.
    expect(settlement.refundableDeposit).toBe(0);
    expect(settlement.netAmountDue).toBe(7000);
  });

  it('validates settlement approval permissions and state', () => {
    expect(() =>
      assertCanApproveSettlement(CheckoutSettlementStatus.PENDING, true),
    ).not.toThrow();

    expect(() =>
      assertCanApproveSettlement(CheckoutSettlementStatus.PENDING, false),
    ).toThrow('do not have permission');

    expect(() =>
      assertCanApproveSettlement(CheckoutSettlementStatus.APPROVED, true),
    ).toThrow('already been approved');
  });
});

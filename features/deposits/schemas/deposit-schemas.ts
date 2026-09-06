import { z } from 'zod';

import { PaymentMethod } from '@/domain/payments/entities';

export const createDepositSchema = z.object({
  hostelId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val : '00000000-0000-0000-0000-000000000001'),
    z.string().uuid('Invalid hostel ID'),
  ),
  residentId: z.string().uuid('Invalid resident ID'),
  requiredAmount: z.number().positive('Required deposit must be greater than zero'),
});

export type CreateDepositSchemaInput = z.infer<typeof createDepositSchema>;

export const recordDepositPaymentSchema = z.object({
  securityDepositId: z.string().uuid('Invalid deposit ID'),
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.string().min(10, 'Payment date is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordDepositPaymentSchemaInput = z.infer<typeof recordDepositPaymentSchema>;

export const recordDepositDeductionSchema = z.object({
  securityDepositId: z.string().uuid('Invalid deposit ID'),
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Deduction amount must be greater than zero'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type RecordDepositDeductionSchemaInput = z.infer<typeof recordDepositDeductionSchema>;

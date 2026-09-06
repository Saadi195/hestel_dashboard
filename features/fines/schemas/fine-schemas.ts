import { z } from 'zod';

import { PaymentMethod } from '@/domain/payments/entities';

export const createFineSchema = z.object({
  hostelId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val : '00000000-0000-0000-0000-000000000001'),
    z.string().uuid('Invalid hostel ID'),
  ),
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Fine amount must be greater than zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export type CreateFineSchemaInput = z.infer<typeof createFineSchema>;

export const recordFinePaymentSchema = z.object({
  fineId: z.string().uuid('Invalid fine ID'),
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.string().min(10, 'Payment date is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordFinePaymentSchemaInput = z.infer<typeof recordFinePaymentSchema>;

export const waiveFineSchema = z.object({
  fineId: z.string().uuid('Invalid fine ID'),
  waiverReason: z.string().min(5, 'Waiver reason must be at least 5 characters'),
});

export type WaiveFineSchemaInput = z.infer<typeof waiveFineSchema>;

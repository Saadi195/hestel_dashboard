import { z } from 'zod';

import { PaymentMethod } from '@/domain/payments/entities';

export const createRentChargeSchema = z.object({
  hostelId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val : '00000000-0000-0000-0000-000000000001'),
    z.string().uuid('Invalid hostel ID'),
  ),
  residentId: z.string().uuid('Invalid resident ID'),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'Billing period must be YYYY-MM format'),
  amount: z.number().positive('Rent amount must be positive'),
  dueDate: z.string().min(10, 'Due date is required'),
});

export type CreateRentChargeSchemaInput = z.infer<typeof createRentChargeSchema>;

export const recordRentPaymentSchema = z.object({
  rentChargeId: z.string().uuid('Invalid rent charge ID'),
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.string().min(10, 'Payment date is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordRentPaymentSchemaInput = z.infer<typeof recordRentPaymentSchema>;

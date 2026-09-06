import { z } from 'zod';

import { ResidentStatus } from '@/domain/residents/entities';

export const createResidentSchema = z.object({
  hostelId: z.preprocess((val) => {
    if (typeof val !== 'string') return '00000000-0000-0000-0000-000000000001';
    const t = val.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? t : '00000000-0000-0000-0000-000000000001';
  }, z.string().uuid('Invalid hostel ID')),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  guardianName: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  cnic: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ResidentStatus).default(ResidentStatus.RESERVED),
});

export type CreateResidentSchemaInput = z.infer<typeof createResidentSchema>;

export const updateResidentSchema = z.object({
  id: z.string().uuid('Invalid resident ID'),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  guardianName: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  cnic: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ResidentStatus).optional(),
});

export type UpdateResidentSchemaInput = z.infer<typeof updateResidentSchema>;

export const suspendResidentSchema = z.object({
  residentId: z.string().uuid('Invalid resident ID'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  startDate: z.string().min(10, 'Start date is required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type SuspendResidentSchemaInput = z.infer<typeof suspendResidentSchema>;

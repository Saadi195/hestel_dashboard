import { z } from 'zod';

import { OperationalStatus } from '@/domain/rooms/entities';

export const createBedSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  bedNumber: z.string().min(1, 'Bed number is required'),
  operationalStatus: z.nativeEnum(OperationalStatus).default(OperationalStatus.AVAILABLE),
});

export type CreateBedSchemaInput = z.infer<typeof createBedSchema>;

export const updateBedSchema = z.object({
  id: z.string().uuid('Invalid bed ID'),
  bedNumber: z.string().min(1).optional(),
  operationalStatus: z.nativeEnum(OperationalStatus).optional(),
});

export type UpdateBedSchemaInput = z.infer<typeof updateBedSchema>;

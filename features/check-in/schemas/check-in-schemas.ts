import { z } from 'zod';

export const checkInSchema = z.object({
  residentId: z.string().uuid('Invalid resident ID'),
  bedId: z.string().uuid('Invalid bed ID'),
  checkInDate: z.string().min(10, 'Check-in date is required'),
});

export type CheckInSchemaInput = z.infer<typeof checkInSchema>;

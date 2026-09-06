import { z } from 'zod';

export const approveCheckoutSchema = z.object({
  settlementId: z.string().uuid('Invalid settlement ID'),
  residentId: z.string().uuid('Invalid resident ID'),
});

export type ApproveCheckoutSchemaInput = z.infer<typeof approveCheckoutSchema>;

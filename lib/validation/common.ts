import { z } from 'zod';

// ─────────────────────────────────────────────
// Primitive Schemas
// ─────────────────────────────────────────────

export const uuidSchema = z.string().uuid('Invalid ID format');

export const positiveIntSchema = z.number().int().positive();

export const nonNegativeNumberSchema = z.number().nonnegative();

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s\-()]{7,15}$/, 'Invalid phone number format')
  .optional();

export const cnicSchema = z
  .string()
  .regex(/^\d{5}-\d{7}-\d$/, 'CNIC must be in format: XXXXX-XXXXXXX-X')
  .optional();

export const pkrAmountSchema = z
  .number()
  .nonnegative('Amount must be 0 or greater')
  .multipleOf(0.01, 'Amount cannot have more than 2 decimal places');

export const dateSchema = z.string().date('Invalid date format (expected YYYY-MM-DD)');

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─────────────────────────────────────────────
// Sort/Filter
// ─────────────────────────────────────────────

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// ID Parameter
// ─────────────────────────────────────────────

export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParam = z.infer<typeof idParamSchema>;

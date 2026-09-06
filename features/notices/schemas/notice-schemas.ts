import { z } from 'zod';

export const submitNoticeSchema = z.object({
  hostelId: z.preprocess((val) => {
    if (typeof val !== 'string') return '00000000-0000-0000-0000-000000000001';
    const t = val.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? t : '00000000-0000-0000-0000-000000000001';
  }, z.string().uuid('Invalid hostel ID')),
  residentId: z.string().uuid('Invalid resident ID'),
  noticeDate: z.string().min(10, 'Notice date is required'),
  noticePeriodDays: z.number().int().positive().default(15),
  reason: z.string().optional(),
});

export type SubmitNoticeSchemaInput = z.infer<typeof submitNoticeSchema>;

export const cancelNoticeSchema = z.object({
  noticeId: z.string().uuid('Invalid notice ID'),
  cancellationReason: z.string().min(3, 'Cancellation reason is required'),
});

export type CancelNoticeSchemaInput = z.infer<typeof cancelNoticeSchema>;

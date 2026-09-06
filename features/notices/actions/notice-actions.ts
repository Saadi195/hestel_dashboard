'use server';

import { revalidatePath } from 'next/cache';

import type { Notice } from '@/domain/notices/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { SubmitNoticeSchemaInput, CancelNoticeSchemaInput } from '../schemas/notice-schemas';
import { NoticeService } from '../services/notice-service';

const noticeService = new NoticeService();

export const submitNoticeAction = withErrorHandling(
  async (input: SubmitNoticeSchemaInput): Promise<ActionResult<Notice>> => {
    const notice = await noticeService.submitNotice(input);
    revalidatePath('/notices');
    revalidatePath('/residents');
    return { success: true, data: notice };
  },
);

export const cancelNoticeAction = withErrorHandling(
  async (input: CancelNoticeSchemaInput): Promise<ActionResult<Notice>> => {
    const notice = await noticeService.cancelNotice(input);
    revalidatePath('/notices');
    revalidatePath('/residents');
    return { success: true, data: notice };
  },
);

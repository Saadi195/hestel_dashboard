import type { Notice } from '@/domain/notices/entities';
import { NoticeStatus } from '@/domain/notices/entities';
import {
  calculateExpectedCheckoutDate,
  getNoticeDaysRemaining,
} from '@/domain/notices/rules';
import { ResidentStatus } from '@/domain/residents/entities';
import { SupabaseNoticeRepository } from '@/infrastructure/repositories/supabase-notice-repository';
import { SupabaseResidentRepository } from '@/infrastructure/repositories/supabase-resident-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  submitNoticeSchema,
  cancelNoticeSchema,
  type SubmitNoticeSchemaInput,
  type CancelNoticeSchemaInput,
} from '../schemas/notice-schemas';

export interface NoticeWithSummary extends Notice {
  residentName: string;
  remainingDays: number;
}

export class NoticeService {
  private repository = new SupabaseNoticeRepository();
  private residentRepo = new SupabaseResidentRepository();

  async getNotices(_hostelId: string): Promise<NoticeWithSummary[]> {
    await requirePermission('notices.view');
    const notices = await this.repository.getAll();
    const supabase = await createClient();

    const noticesWithSummary: NoticeWithSummary[] = await Promise.all(
      notices.map(async (n) => {
        const { data: resident } = await supabase
          .from('residents')
          .select('full_name')
          .eq('id', n.residentId)
          .maybeSingle();

        const remainingDays = getNoticeDaysRemaining(new Date(n.noticeDate), n.requiredDays);

        return {
          ...n,
          residentName: (resident as { full_name: string } | null)?.full_name ?? 'Unknown Resident',
          remainingDays,
        };
      }),
    );

    return noticesWithSummary;
  }

  async submitNotice(input: SubmitNoticeSchemaInput): Promise<Notice> {
    const user = await requirePermission('notices.create');
    const validated = submitNoticeSchema.parse(input);

    const resident = await this.residentRepo.getById(validated.residentId);
    if (!resident) {
      throw new BusinessRuleError('Resident not found.', 'RESIDENT_NOT_FOUND');
    }

    if (resident.status !== ResidentStatus.ACTIVE) {
      throw new BusinessRuleError(
        `Resident must be in 'ACTIVE' status to submit notice (current status: ${resident.status}).`,
        'RESIDENT_NOT_ACTIVE',
      );
    }

    const activeNotice = await this.repository.getActiveByResidentId(resident.id);
    if (activeNotice) {
      throw new BusinessRuleError(
        'An active notice already exists for this resident.',
        'ACTIVE_NOTICE_EXISTS',
      );
    }

    const expectedCheckoutDateObj = calculateExpectedCheckoutDate(
      new Date(validated.noticeDate),
      validated.noticePeriodDays,
    );
    const expectedCheckoutDate = expectedCheckoutDateObj.toISOString().split('T')[0] ?? '';

    const notice = await this.repository.create({
      hostelId: validated.hostelId,
      residentId: resident.id,
      noticeDate: validated.noticeDate,
      requiredDays: validated.noticePeriodDays,
      expectedCheckoutDate,
      reason: validated.reason ?? null,
      status: NoticeStatus.SUBMITTED,
      createdBy: user.id,
    });

    await this.residentRepo.update(resident.id, {
      status: ResidentStatus.NOTICE_PERIOD,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'NOTICE_SUBMITTED',
      entity_type: 'notice',
      entity_id: notice.id,
      metadata: { expectedCheckoutDate },
    });

    return notice;
  }

  async cancelNotice(input: CancelNoticeSchemaInput): Promise<Notice> {
    const user = await requirePermission('notices.create');
    const validated = cancelNoticeSchema.parse(input);

    const notice = await this.repository.getById(validated.noticeId);
    if (!notice) {
      throw new BusinessRuleError('Notice record not found.', 'NOTICE_NOT_FOUND');
    }

    if (notice.status !== NoticeStatus.SUBMITTED) {
      throw new BusinessRuleError(
        `Cannot cancel notice in status '${notice.status}'.`,
        'INVALID_NOTICE_STATUS',
      );
    }

    const updatedNotice = await this.repository.update(notice.id, {
      status: NoticeStatus.CANCELLED,
      reason: validated.cancellationReason,
    });

    await this.residentRepo.update(notice.residentId, {
      status: ResidentStatus.ACTIVE,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'NOTICE_CANCELLED',
      entity_type: 'notice',
      entity_id: updatedNotice.id,
      metadata: { cancellationReason: validated.cancellationReason },
    });

    return updatedNotice;
  }
}

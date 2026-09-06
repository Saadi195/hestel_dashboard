import type { Notice } from '@/domain/notices/entities';
import { NoticeStatus } from '@/domain/notices/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  NoticeRepository,
  CreateNoticeInput,
  UpdateNoticeInput,
} from './notice-repository';

const memoryNotices: Notice[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000003',
    noticeDate: '2026-02-01',
    requiredDays: 30,
    expectedCheckoutDate: '2026-03-03',
    reason: 'Relocating to another city for employment',
    status: NoticeStatus.SUBMITTED,
    createdBy: '00000000-0000-0000-0000-000000000000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SupabaseNoticeRepository implements NoticeRepository {
  async getById(id: string): Promise<Notice | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById notice failed, falling back to memory store');
    }
    return memoryNotices.find((n) => n.id === id) ?? null;
  }

  async getAll(): Promise<Notice[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll notices failed, falling back to memory store');
    }
    return [...memoryNotices];
  }

  async getByHostelId(hostelId: string): Promise<Notice[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('notices').select('*').eq('hostel_id', hostelId).order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getByHostelId notices failed, falling back to memory store');
    }
    return memoryNotices.filter((n) => n.hostelId === hostelId);
  }

  async getActiveByResidentId(residentId: string): Promise<Notice | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('resident_id', residentId)
        .eq('status', 'SUBMITTED')
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getActiveByResidentId notice failed, falling back to memory store');
    }
    return memoryNotices.find((n) => n.residentId === residentId && n.status === NoticeStatus.SUBMITTED) ?? null;
  }

  async create(input: CreateNoticeInput): Promise<Notice> {
    const newNotice: Notice = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `not-${Date.now()}`,
      hostelId: input.hostelId,
      residentId: input.residentId,
      noticeDate: input.noticeDate,
      requiredDays: input.requiredDays ?? 15,
      expectedCheckoutDate: input.expectedCheckoutDate,
      reason: input.reason ?? null,
      status: input.status,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newNotice.id,
        hostel_id: input.hostelId,
        resident_id: input.residentId,
        notice_date: input.noticeDate,
        required_days: input.requiredDays ?? 15,
        expected_checkout_date: input.expectedCheckoutDate,
        reason: input.reason ?? null,
        status: input.status,
        created_by: null,
      };

      const { data, error } = await getTable(supabase, 'notices')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryNotices.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create notice failed, persisting in memory store');
    }

    memoryNotices.unshift(newNotice);
    return newNotice;
  }

  async update(id: string, input: UpdateNoticeInput): Promise<Notice> {
    const index = memoryNotices.findIndex((n) => n.id === id);
    const existing = index !== -1 ? memoryNotices[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.status !== undefined) payload['status'] = input.status;

      const { data, error } = await getTable(supabase, 'notices')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryNotices[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update notice failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Notice with ID ${id} not found`);
    }

    const updatedNotice: Notice = {
      ...existing,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    memoryNotices[index] = updatedNotice;
    return updatedNotice;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('notices').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete notice failed, removing from memory store');
    }
    const index = memoryNotices.findIndex((n) => n.id === id);
    if (index !== -1) {
      memoryNotices.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): Notice {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      residentId: String(row['resident_id']),
      noticeDate: String(row['notice_date']),
      requiredDays: row['required_days'] ? Number(row['required_days']) : 15,
      expectedCheckoutDate: String(row['expected_checkout_date']),
      reason: row['reason'] ? String(row['reason']) : null,
      status: (row['status'] as NoticeStatus) ?? NoticeStatus.SUBMITTED,
      createdBy: row['created_by'] ? String(row['created_by']) : 'system',
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

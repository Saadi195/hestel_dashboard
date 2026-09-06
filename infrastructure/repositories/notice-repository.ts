import type { Notice } from '@/domain/notices/entities';

import type { BaseRepository } from './base';

export type CreateNoticeInput = Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoticeInput = Partial<Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>>;

export interface NoticeRepository extends BaseRepository<Notice, CreateNoticeInput, UpdateNoticeInput> {
  getActiveByResidentId(residentId: string): Promise<Notice | null>;
  getByHostelId(hostelId: string): Promise<Notice[]>;
}

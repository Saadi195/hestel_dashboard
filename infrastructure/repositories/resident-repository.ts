import type { Resident } from '@/domain/residents/entities';

import type { BaseRepository, PaginatedResult } from './base';

export type CreateResidentInput = Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateResidentInput = Partial<Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>>;

export interface ResidentRepository extends BaseRepository<Resident, CreateResidentInput, UpdateResidentInput> {
  getByHostelId(hostelId: string, page?: number, limit?: number): Promise<PaginatedResult<Resident>>;
  getByPhone(phone: string): Promise<Resident | null>;
  getByCnic(cnic: string): Promise<Resident | null>;
}

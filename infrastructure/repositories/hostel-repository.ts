import type { Hostel } from '@/domain/hostels/entities';

import type { BaseRepository } from './base';

export type CreateHostelInput = Omit<Hostel, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateHostelInput = Partial<Omit<Hostel, 'id' | 'createdAt' | 'updatedAt'>>;

export interface HostelRepository extends BaseRepository<Hostel, CreateHostelInput, UpdateHostelInput> {
  getByName(name: string): Promise<Hostel | null>;
}

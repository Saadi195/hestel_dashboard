import type { Bed } from '@/domain/rooms/entities';

import type { BaseRepository } from './base';

export type CreateBedInput = Omit<Bed, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBedInput = Partial<Omit<Bed, 'id' | 'createdAt' | 'updatedAt'>>;

export interface BedRepository extends BaseRepository<Bed, CreateBedInput, UpdateBedInput> {
  getByRoomId(roomId: string): Promise<Bed[]>;
  getByBedNumber(roomId: string, bedNumber: string): Promise<Bed | null>;
}

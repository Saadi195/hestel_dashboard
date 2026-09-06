import type { Room } from '@/domain/rooms/entities';

import type { BaseRepository } from './base';

export type CreateRoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoomInput = Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>;

export interface RoomRepository extends BaseRepository<Room, CreateRoomInput, UpdateRoomInput> {
  getByHostelId(hostelId: string): Promise<Room[]>;
  getByRoomNumber(hostelId: string, roomNumber: string): Promise<Room | null>;
}

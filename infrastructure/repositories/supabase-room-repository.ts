import type { Room } from '@/domain/rooms/entities';
import { RoomType, OperationalStatus } from '@/domain/rooms/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type { RoomRepository, CreateRoomInput, UpdateRoomInput } from './room-repository';

const memoryRooms: Room[] = [
  {
    id: '10000000-0000-0000-0000-000000000101',
    hostelId: '00000000-0000-0000-0000-000000000001',
    roomNumber: '101',
    floor: 1,
    roomType: RoomType.DOUBLE,
    capacity: 2,
    operationalStatus: OperationalStatus.AVAILABLE,
    monthlyRent: 25000,
    description: 'Ground floor double room with attached washroom',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000102',
    hostelId: '00000000-0000-0000-0000-000000000001',
    roomNumber: '102',
    floor: 1,
    roomType: RoomType.TRIPLE,
    capacity: 3,
    operationalStatus: OperationalStatus.AVAILABLE,
    monthlyRent: 20000,
    description: 'Ground floor triple room with balcony',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000103',
    hostelId: '00000000-0000-0000-0000-000000000001',
    roomNumber: '103',
    floor: 1,
    roomType: RoomType.SINGLE,
    capacity: 1,
    operationalStatus: OperationalStatus.MAINTENANCE,
    monthlyRent: 35000,
    description: 'Single executive room under renovation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SupabaseRoomRepository implements RoomRepository {
  async getById(id: string): Promise<Room | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById room failed, falling back to memory store');
    }
    return memoryRooms.find((r) => r.id === id) ?? null;
  }

  async getAll(): Promise<Room[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('rooms').select('*').order('room_number');
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll rooms failed, falling back to memory store');
    }
    return [...memoryRooms];
  }

  async getByHostelId(hostelId: string): Promise<Room[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('rooms').select('*').eq('hostel_id', hostelId).order('room_number');
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getByHostelId rooms failed, falling back to memory store');
    }
    return memoryRooms.filter((r) => r.hostelId === hostelId);
  }

  async getByRoomNumber(hostelId: string, roomNumber: string): Promise<Room | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('room_number', roomNumber)
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByRoomNumber room failed, falling back to memory store');
    }
    return memoryRooms.find((r) => r.hostelId === hostelId && r.roomNumber === roomNumber) ?? null;
  }

  async create(input: CreateRoomInput): Promise<Room> {
    const newRoom: Room = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `room-${Date.now()}`,
      hostelId: input.hostelId,
      roomNumber: input.roomNumber,
      floor: input.floor ?? null,
      roomType: input.roomType,
      capacity: input.capacity,
      operationalStatus: input.operationalStatus,
      monthlyRent: input.monthlyRent,
      description: input.description ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newRoom.id,
        hostel_id: input.hostelId,
        room_number: input.roomNumber,
        floor: input.floor ?? null,
        room_type: input.roomType,
        capacity: input.capacity,
        operational_status: input.operationalStatus,
        monthly_rent: input.monthlyRent,
        description: input.description ?? null,
      };

      const { data, error } = await getTable(supabase, 'rooms')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryRooms.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create room failed, persisting in memory store');
    }

    memoryRooms.unshift(newRoom);
    return newRoom;
  }

  async update(id: string, input: UpdateRoomInput): Promise<Room> {
    const index = memoryRooms.findIndex((r) => r.id === id);
    const existing = index !== -1 ? memoryRooms[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.roomNumber !== undefined) payload['room_number'] = input.roomNumber;
      if (input.floor !== undefined) payload['floor'] = input.floor;
      if (input.roomType !== undefined) payload['room_type'] = input.roomType;
      if (input.capacity !== undefined) payload['capacity'] = input.capacity;
      if (input.operationalStatus !== undefined) payload['operational_status'] = input.operationalStatus;
      if (input.monthlyRent !== undefined) payload['monthly_rent'] = input.monthlyRent;
      if (input.description !== undefined) payload['description'] = input.description;

      const { data, error } = await getTable(supabase, 'rooms')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryRooms[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update room failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Room with ID ${id} not found`);
    }

    const updatedRoom: Room = {
      ...existing,
      roomNumber: input.roomNumber ?? existing.roomNumber,
      floor: input.floor !== undefined ? input.floor : existing.floor,
      roomType: input.roomType ?? existing.roomType,
      capacity: input.capacity ?? existing.capacity,
      operationalStatus: input.operationalStatus ?? existing.operationalStatus,
      monthlyRent: input.monthlyRent ?? existing.monthlyRent,
      description: input.description !== undefined ? input.description : existing.description,
      updatedAt: new Date().toISOString(),
    };

    memoryRooms[index] = updatedRoom;
    return updatedRoom;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('rooms').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete room failed, removing from memory store');
    }
    const index = memoryRooms.findIndex((r) => r.id === id);
    if (index !== -1) {
      memoryRooms.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): Room {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      roomNumber: String(row['room_number']),
      floor: row['floor'] !== null ? Number(row['floor']) : null,
      roomType: (row['room_type'] as RoomType) ?? RoomType.SINGLE,
      capacity: Number(row['capacity']),
      operationalStatus: (row['operational_status'] as OperationalStatus) ?? OperationalStatus.AVAILABLE,
      monthlyRent: Number(row['monthly_rent']),
      description: row['description'] ? String(row['description']) : null,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

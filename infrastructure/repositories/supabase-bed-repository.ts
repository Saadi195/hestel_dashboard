import type { Bed } from '@/domain/rooms/entities';
import { OperationalStatus } from '@/domain/rooms/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type { BedRepository, CreateBedInput, UpdateBedInput } from './bed-repository';

const memoryBeds: Bed[] = [
  {
    id: '20000000-0000-0000-0000-000000000101',
    roomId: '10000000-0000-0000-0000-000000000101',
    bedNumber: '101-A',
    operationalStatus: OperationalStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000102',
    roomId: '10000000-0000-0000-0000-000000000101',
    bedNumber: '101-B',
    operationalStatus: OperationalStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000103',
    roomId: '10000000-0000-0000-0000-000000000102',
    bedNumber: '102-A',
    operationalStatus: OperationalStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000104',
    roomId: '10000000-0000-0000-0000-000000000102',
    bedNumber: '102-B',
    operationalStatus: OperationalStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000105',
    roomId: '10000000-0000-0000-0000-000000000103',
    bedNumber: '103-A',
    operationalStatus: OperationalStatus.MAINTENANCE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SupabaseBedRepository implements BedRepository {
  async getById(id: string): Promise<Bed | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('beds').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById bed failed, falling back to memory store');
    }
    return memoryBeds.find((b) => b.id === id) ?? null;
  }

  async getAll(): Promise<Bed[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('beds').select('*').order('bed_number');
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll beds failed, falling back to memory store');
    }
    return [...memoryBeds];
  }

  async getByRoomId(roomId: string): Promise<Bed[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('beds').select('*').eq('room_id', roomId).order('bed_number');
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getByRoomId beds failed, falling back to memory store');
    }
    return memoryBeds.filter((b) => b.roomId === roomId);
  }

  async getByBedNumber(roomId: string, bedNumber: string): Promise<Bed | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .eq('room_id', roomId)
        .eq('bed_number', bedNumber)
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByBedNumber bed failed, falling back to memory store');
    }
    return memoryBeds.find((b) => b.roomId === roomId && b.bedNumber === bedNumber) ?? null;
  }

  async create(input: CreateBedInput): Promise<Bed> {
    const newBed: Bed = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `bed-${Date.now()}`,
      roomId: input.roomId,
      bedNumber: input.bedNumber,
      operationalStatus: input.operationalStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newBed.id,
        room_id: input.roomId,
        bed_number: input.bedNumber,
        operational_status: input.operationalStatus,
      };

      const { data, error } = await getTable(supabase, 'beds')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryBeds.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create bed failed, persisting in memory store');
    }

    memoryBeds.unshift(newBed);
    return newBed;
  }

  async update(id: string, input: UpdateBedInput): Promise<Bed> {
    const index = memoryBeds.findIndex((b) => b.id === id);
    const existing = index !== -1 ? memoryBeds[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.bedNumber !== undefined) payload['bed_number'] = input.bedNumber;
      if (input.operationalStatus !== undefined) payload['operational_status'] = input.operationalStatus;

      const { data, error } = await getTable(supabase, 'beds')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryBeds[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update bed failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Bed with ID ${id} not found`);
    }

    const updatedBed: Bed = {
      ...existing,
      bedNumber: input.bedNumber ?? existing.bedNumber,
      operationalStatus: input.operationalStatus ?? existing.operationalStatus,
      updatedAt: new Date().toISOString(),
    };

    memoryBeds[index] = updatedBed;
    return updatedBed;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('beds').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete bed failed, removing from memory store');
    }
    const index = memoryBeds.findIndex((b) => b.id === id);
    if (index !== -1) {
      memoryBeds.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): Bed {
    return {
      id: String(row['id']),
      roomId: String(row['room_id']),
      bedNumber: String(row['bed_number']),
      operationalStatus: (row['operational_status'] as OperationalStatus) ?? OperationalStatus.AVAILABLE,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

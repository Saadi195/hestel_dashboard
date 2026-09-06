import type { ResidentAssignment } from '@/domain/assignments/entities';
import { AssignmentStatus } from '@/domain/assignments/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  AssignmentRepository,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from './assignment-repository';

const memoryAssignments: ResidentAssignment[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    bedId: '20000000-0000-0000-0000-000000000101',
    checkInDate: '2026-01-01',
    checkOutDate: null,
    status: AssignmentStatus.ACTIVE,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    residentId: '30000000-0000-0000-0000-000000000003',
    bedId: '20000000-0000-0000-0000-000000000103',
    checkInDate: '2026-01-15',
    checkOutDate: null,
    status: AssignmentStatus.ACTIVE,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SupabaseAssignmentRepository implements AssignmentRepository {
  async getById(id: string): Promise<ResidentAssignment | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('resident_assignments').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById assignment failed, falling back to memory store');
    }
    return memoryAssignments.find((a) => a.id === id) ?? null;
  }

  async getAll(): Promise<ResidentAssignment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('resident_assignments').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll assignments failed, falling back to memory store');
    }
    return [...memoryAssignments];
  }

  async getActiveByResidentId(residentId: string): Promise<ResidentAssignment | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('resident_assignments')
        .select('*')
        .eq('resident_id', residentId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getActiveByResidentId assignment failed, falling back to memory store');
    }
    return memoryAssignments.find((a) => a.residentId === residentId && a.status === AssignmentStatus.ACTIVE) ?? null;
  }

  async getActiveByBedId(bedId: string): Promise<ResidentAssignment | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('resident_assignments')
        .select('*')
        .eq('bed_id', bedId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getActiveByBedId assignment failed, falling back to memory store');
    }
    return memoryAssignments.find((a) => a.bedId === bedId && a.status === AssignmentStatus.ACTIVE) ?? null;
  }

  async getHistoryByResidentId(residentId: string): Promise<ResidentAssignment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('resident_assignments')
        .select('*')
        .eq('resident_id', residentId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getHistoryByResidentId assignments failed, falling back to memory store');
    }
    return memoryAssignments.filter((a) => a.residentId === residentId);
  }

  async create(input: CreateAssignmentInput): Promise<ResidentAssignment> {
    const newAssignment: ResidentAssignment = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `asg-${Date.now()}`,
      residentId: input.residentId,
      bedId: input.bedId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate ?? null,
      status: input.status,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newAssignment.id,
        resident_id: input.residentId,
        bed_id: input.bedId,
        check_in_date: input.checkInDate,
        check_out_date: input.checkOutDate ?? null,
        status: input.status,
        created_by: null,
      };

      const { data, error } = await getTable(supabase, 'resident_assignments')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryAssignments.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create resident assignment failed, persisting in memory store');
    }

    memoryAssignments.unshift(newAssignment);
    return newAssignment;
  }

  async update(id: string, input: UpdateAssignmentInput): Promise<ResidentAssignment> {
    const index = memoryAssignments.findIndex((a) => a.id === id);
    const existing = index !== -1 ? memoryAssignments[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.checkOutDate !== undefined) payload['check_out_date'] = input.checkOutDate;
      if (input.status !== undefined) payload['status'] = input.status;

      const { data, error } = await getTable(supabase, 'resident_assignments')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryAssignments[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update resident assignment failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Assignment with ID ${id} not found`);
    }

    const updatedAssignment: ResidentAssignment = {
      ...existing,
      checkOutDate: input.checkOutDate !== undefined ? input.checkOutDate : existing.checkOutDate,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    memoryAssignments[index] = updatedAssignment;
    return updatedAssignment;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('resident_assignments').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete resident assignment failed, removing from memory store');
    }
    const index = memoryAssignments.findIndex((a) => a.id === id);
    if (index !== -1) {
      memoryAssignments.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): ResidentAssignment {
    return {
      id: String(row['id']),
      residentId: String(row['resident_id']),
      bedId: String(row['bed_id']),
      checkInDate: String(row['check_in_date']),
      checkOutDate: row['check_out_date'] ? String(row['check_out_date']) : null,
      status: (row['status'] as AssignmentStatus) ?? AssignmentStatus.ACTIVE,
      createdBy: row['created_by'] ? String(row['created_by']) : null,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

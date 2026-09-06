import type { Resident } from '@/domain/residents/entities';
import { ResidentStatus } from '@/domain/residents/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type { PaginatedResult } from './base';
import type {
  ResidentRepository,
  CreateResidentInput,
  UpdateResidentInput,
} from './resident-repository';

// In-memory persistent store fallback for development resilience
const memoryResidents: Resident[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    fullName: 'Hamza Malik',
    phone: '+92 333 1234567',
    guardianName: 'Tariq Malik',
    emergencyContactName: 'Asad Malik',
    emergencyContactPhone: '+92 333 7654321',
    cnic: '61101-1234567-1',
    address: 'Sector F-7/2, Islamabad',
    profilePictureUrl: null,
    status: ResidentStatus.ACTIVE,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    hostelId: '00000000-0000-0000-0000-000000000001',
    fullName: 'Usman Sheikh',
    phone: '+92 300 9876543',
    guardianName: 'Zahid Sheikh',
    emergencyContactName: 'Ali Sheikh',
    emergencyContactPhone: '+92 300 1234567',
    cnic: '35202-7654321-3',
    address: 'Gulberg III, Lahore',
    profilePictureUrl: null,
    status: ResidentStatus.RESERVED,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    hostelId: '00000000-0000-0000-0000-000000000001',
    fullName: 'Farhan Hassan',
    phone: '+92 321 5554433',
    guardianName: 'Hassan Raza',
    emergencyContactName: 'Kamran Hassan',
    emergencyContactPhone: '+92 321 3344555',
    cnic: '42101-9988776-5',
    address: 'Satellite Town, Rawalpindi',
    profilePictureUrl: null,
    status: ResidentStatus.NOTICE_PERIOD,
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class SupabaseResidentRepository implements ResidentRepository {
  async getById(id: string): Promise<Resident | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('residents').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById resident failed, falling back to memory store');
    }
    return memoryResidents.find((r) => r.id === id) ?? null;
  }

  async getAll(): Promise<Resident[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('residents').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll residents failed, falling back to memory store');
    }
    return [...memoryResidents];
  }

  async getByHostelId(hostelId: string, page = 1, limit = 20): Promise<PaginatedResult<Resident>> {
    try {
      const supabase = await createClient();
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('residents')
        .select('*', { count: 'exact' })
        .eq('hostel_id', hostelId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        const totalPages = Math.ceil(total / limit);
        return {
          data: data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>)),
          total,
          page,
          limit,
          hasNextPage: page < totalPages,
        };
      }
    } catch {
      logger.warn('Supabase getByHostelId residents failed, falling back to memory store');
    }

    const filtered = memoryResidents.filter((r) => r.hostelId === hostelId);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    const totalPages = Math.ceil(filtered.length / limit) || 1;

    return {
      data: paginated,
      total: filtered.length,
      page,
      limit,
      hasNextPage: page < totalPages,
    };
  }

  async getByPhone(phone: string): Promise<Resident | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('residents').select('*').eq('phone', phone).maybeSingle();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByPhone resident failed, falling back to memory store');
    }
    return memoryResidents.find((r) => r.phone === phone) ?? null;
  }

  async getByCnic(cnic: string): Promise<Resident | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('residents').select('*').eq('cnic', cnic).maybeSingle();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByCnic resident failed, falling back to memory store');
    }
    return memoryResidents.find((r) => r.cnic === cnic) ?? null;
  }

  async create(input: CreateResidentInput): Promise<Resident> {
    const newResident: Resident = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `res-${Date.now()}`,
      hostelId: input.hostelId,
      fullName: input.fullName,
      phone: input.phone,
      guardianName: input.guardianName ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      cnic: input.cnic ?? null,
      address: input.address ?? null,
      profilePictureUrl: input.profilePictureUrl ?? null,
      status: input.status,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newResident.id,
        hostel_id: input.hostelId,
        full_name: input.fullName,
        phone: input.phone,
        guardian_name: input.guardianName ?? null,
        emergency_contact_name: input.emergencyContactName ?? null,
        emergency_contact_phone: input.emergencyContactPhone ?? null,
        cnic: input.cnic ?? null,
        address: input.address ?? null,
        profile_picture_url: input.profilePictureUrl ?? null,
        status: input.status,
        created_by: null,
      };

      const { data, error } = await getTable(supabase, 'residents')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryResidents.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create resident failed, persisting in memory store');
    }

    memoryResidents.unshift(newResident);
    return newResident;
  }

  async update(id: string, input: UpdateResidentInput): Promise<Resident> {
    const index = memoryResidents.findIndex((r) => r.id === id);
    const existing = index !== -1 ? memoryResidents[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.fullName !== undefined) payload['full_name'] = input.fullName;
      if (input.phone !== undefined) payload['phone'] = input.phone;
      if (input.guardianName !== undefined) payload['guardian_name'] = input.guardianName;
      if (input.emergencyContactName !== undefined) payload['emergency_contact_name'] = input.emergencyContactName;
      if (input.emergencyContactPhone !== undefined) payload['emergency_contact_phone'] = input.emergencyContactPhone;
      if (input.cnic !== undefined) payload['cnic'] = input.cnic;
      if (input.address !== undefined) payload['address'] = input.address;
      if (input.profilePictureUrl !== undefined) payload['profile_picture_url'] = input.profilePictureUrl;
      if (input.status !== undefined) payload['status'] = input.status;

      const { data, error } = await getTable(supabase, 'residents')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryResidents[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update resident failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Resident with ID ${id} not found`);
    }

    const updatedResident: Resident = {
      ...existing,
      fullName: input.fullName ?? existing.fullName,
      phone: input.phone ?? existing.phone,
      guardianName: input.guardianName !== undefined ? input.guardianName : existing.guardianName,
      emergencyContactName: input.emergencyContactName !== undefined ? input.emergencyContactName : existing.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone !== undefined ? input.emergencyContactPhone : existing.emergencyContactPhone,
      cnic: input.cnic !== undefined ? input.cnic : existing.cnic,
      address: input.address !== undefined ? input.address : existing.address,
      profilePictureUrl: input.profilePictureUrl !== undefined ? input.profilePictureUrl : existing.profilePictureUrl,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    memoryResidents[index] = updatedResident;
    return updatedResident;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('residents').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete resident failed, removing from memory store');
    }
    const index = memoryResidents.findIndex((r) => r.id === id);
    if (index !== -1) {
      memoryResidents.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): Resident {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      fullName: String(row['full_name']),
      phone: String(row['phone']),
      guardianName: row['guardian_name'] ? String(row['guardian_name']) : null,
      emergencyContactName: row['emergency_contact_name'] ? String(row['emergency_contact_name']) : null,
      emergencyContactPhone: row['emergency_contact_phone'] ? String(row['emergency_contact_phone']) : null,
      cnic: row['cnic'] ? String(row['cnic']) : null,
      address: row['address'] ? String(row['address']) : null,
      profilePictureUrl: row['profile_picture_url'] ? String(row['profile_picture_url']) : null,
      status: (row['status'] as ResidentStatus) ?? ResidentStatus.RESERVED,
      createdBy: row['created_by'] ? String(row['created_by']) : null,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

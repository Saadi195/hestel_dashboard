import type { Hostel } from '@/domain/hostels/entities';
import { HostelStatus } from '@/domain/hostels/entities';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type { HostelRepository, CreateHostelInput, UpdateHostelInput } from './hostel-repository';

export class SupabaseHostelRepository implements HostelRepository {
  async getById(id: string): Promise<Hostel | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('hostels').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToDomain(data as unknown as Record<string, unknown>);
  }

  async getAll(): Promise<Hostel[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('hostels').select('*').order('name');
    if (error || !data) return [];
    return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
  }

  async getByName(name: string): Promise<Hostel | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('hostels').select('*').eq('name', name).maybeSingle();
    if (error || !data) return null;
    return this.mapToDomain(data as unknown as Record<string, unknown>);
  }

  async create(input: CreateHostelInput): Promise<Hostel> {
    const supabase = await createClient();
    const insertPayload = {
      name: input.name,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      status: input.status,
    };

    const { data, error } = await getTable(supabase, 'hostels')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      const err = error as { message?: string } | null;
      throw new Error(`Failed to create hostel: ${err?.message}`);
    }
    return this.mapToDomain(data as Record<string, unknown>);
  }

  async update(id: string, input: UpdateHostelInput): Promise<Hostel> {
    const supabase = await createClient();
    const { data, error } = await getTable(supabase, 'hostels')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      const err = error as { message?: string } | null;
      throw new Error(`Failed to update hostel: ${err?.message}`);
    }
    return this.mapToDomain(data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('hostels').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete hostel: ${error.message}`);
    }
  }

  private mapToDomain(row: Record<string, unknown>): Hostel {
    return {
      id: String(row['id']),
      name: String(row['name']),
      address: row['address'] ? String(row['address']) : null,
      phone: row['phone'] ? String(row['phone']) : null,
      email: row['email'] ? String(row['email']) : null,
      status: (row['status'] as HostelStatus) ?? HostelStatus.ACTIVE,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

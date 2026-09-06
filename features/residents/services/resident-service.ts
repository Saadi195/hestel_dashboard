import { ResidentStatus, type Resident } from '@/domain/residents/entities';
import { isValidStatusTransition } from '@/domain/residents/rules';
import { SupabaseResidentRepository } from '@/infrastructure/repositories/supabase-resident-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createResidentSchema,
  updateResidentSchema,
  suspendResidentSchema,
  type CreateResidentSchemaInput,
  type UpdateResidentSchemaInput,
  type SuspendResidentSchemaInput,
} from '../schemas/resident-schemas';

export class ResidentService {
  private repository = new SupabaseResidentRepository();

  async getResidents(hostelId: string, page = 1, limit = 20) {
    await requirePermission('residents.view');
    return this.repository.getByHostelId(hostelId, page, limit);
  }

  async getResidentById(id: string): Promise<Resident | null> {
    await requirePermission('residents.view');
    return this.repository.getById(id);
  }

  async createResident(input: CreateResidentSchemaInput): Promise<Resident> {
    const user = await requirePermission('residents.create');
    const validated = createResidentSchema.parse(input);

    const resident = await this.repository.create({
      hostelId: validated.hostelId,
      fullName: validated.fullName,
      phone: validated.phone,
      guardianName: validated.guardianName ?? null,
      emergencyContactName: validated.emergencyContactName ?? null,
      emergencyContactPhone: validated.emergencyContactPhone ?? null,
      cnic: validated.cnic ?? null,
      address: validated.address ?? null,
      profilePictureUrl: null,
      status: validated.status as ResidentStatus,
      createdBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'RESIDENT_CREATED',
      entity_type: 'resident',
      entity_id: resident.id,
      metadata: { fullName: resident.fullName, status: resident.status },
    });

    return resident;
  }

  async updateResident(input: UpdateResidentSchemaInput): Promise<Resident> {
    const user = await requirePermission('residents.update');
    const validated = updateResidentSchema.parse(input);

    const existing = await this.repository.getById(validated.id);
    if (!existing) {
      throw new Error('Resident not found');
    }

    if (validated.status && validated.status !== existing.status) {
      if (!isValidStatusTransition(existing.status, validated.status as ResidentStatus)) {
        throw new BusinessRuleError(
          `Cannot transition resident status from ${existing.status} to ${validated.status}`,
          'INVALID_STATUS_TRANSITION',
        );
      }
    }

    const updatePayload: Partial<Resident> = {};
    if (validated.fullName !== undefined) updatePayload.fullName = validated.fullName;
    if (validated.phone !== undefined) updatePayload.phone = validated.phone;
    if (validated.guardianName !== undefined) updatePayload.guardianName = validated.guardianName;
    if (validated.emergencyContactName !== undefined) updatePayload.emergencyContactName = validated.emergencyContactName;
    if (validated.emergencyContactPhone !== undefined) updatePayload.emergencyContactPhone = validated.emergencyContactPhone;
    if (validated.cnic !== undefined) updatePayload.cnic = validated.cnic;
    if (validated.address !== undefined) updatePayload.address = validated.address;
    if (validated.status !== undefined) updatePayload.status = validated.status as ResidentStatus;

    const updated = await this.repository.update(validated.id, updatePayload);

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'RESIDENT_UPDATED',
      entity_type: 'resident',
      entity_id: updated.id,
      metadata: { changes: JSON.parse(JSON.stringify(validated)) },
    });

    return updated;
  }

  async suspendResident(input: SuspendResidentSchemaInput) {
    const user = await requirePermission('residents.update');
    const validated = suspendResidentSchema.parse(input);

    const existing = await this.repository.getById(validated.residentId);
    if (!existing) {
      throw new Error('Resident not found');
    }

    const supabase = await createClient();

    await getTable(supabase, 'resident_suspensions').insert({
      resident_id: validated.residentId,
      hostel_id: existing.hostelId,
      reason: validated.reason,
      suspended_by: user.id,
      start_date: validated.startDate,
      end_date: validated.endDate ?? null,
      notes: validated.notes ?? null,
    });

    const updated = await this.repository.update(validated.residentId, {
      status: ResidentStatus.SUSPENDED,
    });

    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'RESIDENT_SUSPENDED',
      entity_type: 'resident',
      entity_id: updated.id,
      metadata: { reason: validated.reason },
    });

    return updated;
  }
}

import type { Bed } from '@/domain/rooms/entities';
import { deriveBedOccupancy } from '@/domain/rooms/rules';
import { SupabaseBedRepository } from '@/infrastructure/repositories/supabase-bed-repository';
import { requirePermission } from '@/lib/auth/session';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createBedSchema,
  updateBedSchema,
  type CreateBedSchemaInput,
  type UpdateBedSchemaInput,
} from '../schemas/bed-schemas';

export interface BedWithOccupancy extends Bed {
  hasActiveAssignment: boolean;
  derivedOccupancy: string;
  assignedResidentName: string | null;
}

export class BedService {
  private repository = new SupabaseBedRepository();

  async getBedsByRoom(roomId: string): Promise<BedWithOccupancy[]> {
    await requirePermission('rooms.view');
    const beds = await this.repository.getByRoomId(roomId);
    const supabase = await createClient();

    const bedsWithOccupancy: BedWithOccupancy[] = await Promise.all(
      beds.map(async (bed) => {
        const { data: assignment } = await supabase
          .from('resident_assignments')
          .select('id, resident_id')
          .eq('bed_id', bed.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        let residentName: string | null = null;
        if (assignment) {
          const assignmentRow = assignment as Record<string, unknown>;
          if (assignmentRow['resident_id']) {
            const { data: resident } = await supabase
              .from('residents')
              .select('full_name')
              .eq('id', String(assignmentRow['resident_id']))
              .maybeSingle();
            if (resident) {
              residentName = String((resident as Record<string, unknown>)['full_name']);
            }
          }
        }
        const hasActive = !!assignment;
        const derived = deriveBedOccupancy(hasActive);

        return {
          ...bed,
          hasActiveAssignment: hasActive,
          derivedOccupancy: derived,
          assignedResidentName: residentName,
        };
      }),
    );

    return bedsWithOccupancy;
  }

  async createBed(input: CreateBedSchemaInput): Promise<Bed> {
    const user = await requirePermission('rooms.create');
    const validated = createBedSchema.parse(input);

    const bed = await this.repository.create({
      roomId: validated.roomId,
      bedNumber: validated.bedNumber,
      operationalStatus: validated.operationalStatus,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'BED_CREATED',
      entity_type: 'bed',
      entity_id: bed.id,
      metadata: { bedNumber: bed.bedNumber, roomId: bed.roomId },
    });

    return bed;
  }

  async updateBedStatus(input: UpdateBedSchemaInput): Promise<Bed> {
    const user = await requirePermission('rooms.update');
    const validated = updateBedSchema.parse(input);

    const updatePayload: Record<string, unknown> = {};
    if (validated.bedNumber !== undefined) updatePayload['bedNumber'] = validated.bedNumber;
    if (validated.operationalStatus !== undefined) updatePayload['operationalStatus'] = validated.operationalStatus;

    const bed = await this.repository.update(validated.id, updatePayload);

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'BED_UPDATED',
      entity_type: 'bed',
      entity_id: bed.id,
      metadata: { operationalStatus: bed.operationalStatus },
    });

    return bed;
  }
}

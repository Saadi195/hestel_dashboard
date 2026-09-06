import { AssignmentStatus } from '@/domain/assignments/entities';
import { assertNoActiveResidentAssignment } from '@/domain/assignments/rules';
import { ResidentStatus } from '@/domain/residents/entities';
import { canCheckIn } from '@/domain/residents/rules';
import { assertBedIsAssignable } from '@/domain/rooms/rules';
import { SupabaseAssignmentRepository } from '@/infrastructure/repositories/supabase-assignment-repository';
import { SupabaseBedRepository } from '@/infrastructure/repositories/supabase-bed-repository';
import { SupabaseResidentRepository } from '@/infrastructure/repositories/supabase-resident-repository';
import { SupabaseRoomRepository } from '@/infrastructure/repositories/supabase-room-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import { checkInSchema, type CheckInSchemaInput } from '../schemas/check-in-schemas';

export class CheckInService {
  private residentRepo = new SupabaseResidentRepository();
  private bedRepo = new SupabaseBedRepository();
  private roomRepo = new SupabaseRoomRepository();
  private assignmentRepo = new SupabaseAssignmentRepository();

  async checkInResident(input: CheckInSchemaInput) {
    const user = await requirePermission('residents.update');
    const validated = checkInSchema.parse(input);

    const resident = await this.residentRepo.getById(validated.residentId);
    if (!resident) {
      throw new BusinessRuleError('Resident not found.', 'RESIDENT_NOT_FOUND');
    }
    if (!canCheckIn(resident.status)) {
      throw new BusinessRuleError(
        `Resident in status '${resident.status}' is not eligible for check-in. Must be in 'RESERVED' status.`,
        'RESIDENT_NOT_ELIGIBLE_FOR_CHECKIN',
      );
    }

    const activeAssignment = await this.assignmentRepo.getActiveByResidentId(validated.residentId);
    assertNoActiveResidentAssignment(!!activeAssignment);

    const bed = await this.bedRepo.getById(validated.bedId);
    if (!bed) {
      throw new BusinessRuleError('Bed not found.', 'BED_NOT_FOUND');
    }

    const room = await this.roomRepo.getById(bed.roomId);
    if (!room) {
      throw new BusinessRuleError('Room not found.', 'ROOM_NOT_FOUND');
    }

    const activeBedAssignment = await this.assignmentRepo.getActiveByBedId(bed.id);
    assertBedIsAssignable(
      bed.operationalStatus,
      room.operationalStatus,
      !!activeBedAssignment,
    );

    const assignment = await this.assignmentRepo.create({
      residentId: resident.id,
      bedId: bed.id,
      checkInDate: validated.checkInDate,
      checkOutDate: null,
      status: AssignmentStatus.ACTIVE,
      createdBy: user.id,
    });

    await this.residentRepo.update(resident.id, {
      status: ResidentStatus.ACTIVE,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'CHECK_IN_COMPLETED',
      entity_type: 'resident_assignment',
      entity_id: assignment.id,
      metadata: {
        residentId: resident.id,
        bedId: bed.id,
        checkInDate: validated.checkInDate,
      },
    });

    return assignment;
  }
}

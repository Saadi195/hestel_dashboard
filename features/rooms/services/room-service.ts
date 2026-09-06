import type { Room } from '@/domain/rooms/entities';
import { deriveRoomOccupancy } from '@/domain/rooms/rules';
import { SupabaseRoomRepository } from '@/infrastructure/repositories/supabase-room-repository';
import { requirePermission } from '@/lib/auth/session';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomSchemaInput,
  type UpdateRoomSchemaInput,
} from '../schemas/room-schemas';

export interface RoomWithOccupancy extends Room {
  activeAssignmentsCount: number;
  derivedOccupancy: string;
}

export class RoomService {
  private repository = new SupabaseRoomRepository();

  async getRooms(hostelId: string): Promise<RoomWithOccupancy[]> {
    await requirePermission('rooms.view');
    const rooms = await this.repository.getByHostelId(hostelId);
    const supabase = await createClient();

    const roomsWithOccupancy: RoomWithOccupancy[] = await Promise.all(
      rooms.map(async (room) => {
        const { data: roomBeds } = await supabase
          .from('beds')
          .select('id')
          .eq('room_id', room.id);

        const bedIds = (roomBeds ?? []).map((b: Record<string, unknown>) => String(b['id']));

        let activeCount = 0;
        if (bedIds.length > 0) {
          const { count } = await supabase
            .from('resident_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ACTIVE')
            .in('bed_id', bedIds);

          activeCount = count ?? 0;
        }

        const derived = deriveRoomOccupancy(activeCount, room.capacity);

        return {
          ...room,
          activeAssignmentsCount: activeCount,
          derivedOccupancy: derived,
        };
      }),
    );

    return roomsWithOccupancy;
  }

  async createRoom(input: CreateRoomSchemaInput): Promise<Room> {
    const user = await requirePermission('rooms.create');
    const validated = createRoomSchema.parse(input);

    const room = await this.repository.create({
      hostelId: validated.hostelId,
      roomNumber: validated.roomNumber,
      floor: validated.floor ?? null,
      roomType: validated.roomType,
      capacity: validated.capacity,
      operationalStatus: validated.operationalStatus,
      monthlyRent: validated.monthlyRent,
      description: validated.description ?? null,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'ROOM_CREATED',
      entity_type: 'room',
      entity_id: room.id,
      metadata: { roomNumber: room.roomNumber, capacity: room.capacity },
    });

    return room;
  }

  async updateRoom(input: UpdateRoomSchemaInput): Promise<Room> {
    const user = await requirePermission('rooms.update');
    const validated = updateRoomSchema.parse(input);

    const updatePayload: Record<string, unknown> = {};
    if (validated.roomNumber !== undefined) updatePayload['roomNumber'] = validated.roomNumber;
    if (validated.floor !== undefined) updatePayload['floor'] = validated.floor;
    if (validated.roomType !== undefined) updatePayload['roomType'] = validated.roomType;
    if (validated.capacity !== undefined) updatePayload['capacity'] = validated.capacity;
    if (validated.operationalStatus !== undefined) updatePayload['operationalStatus'] = validated.operationalStatus;
    if (validated.monthlyRent !== undefined) updatePayload['monthlyRent'] = validated.monthlyRent;
    if (validated.description !== undefined) updatePayload['description'] = validated.description;

    const room = await this.repository.update(validated.id, updatePayload);

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'ROOM_UPDATED',
      entity_type: 'room',
      entity_id: room.id,
      metadata: { changes: validated },
    });

    return room;
  }
}

'use server';

import { revalidatePath } from 'next/cache';

import type { Room } from '@/domain/rooms/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { CreateRoomSchemaInput, UpdateRoomSchemaInput } from '../schemas/room-schemas';
import { RoomService } from '../services/room-service';

const roomService = new RoomService();

export const createRoomAction = withErrorHandling(
  async (input: CreateRoomSchemaInput): Promise<ActionResult<Room>> => {
    const room = await roomService.createRoom(input);
    revalidatePath('/rooms');
    return { success: true, data: room };
  },
);

export const updateRoomAction = withErrorHandling(
  async (input: UpdateRoomSchemaInput): Promise<ActionResult<Room>> => {
    const room = await roomService.updateRoom(input);
    revalidatePath('/rooms');
    return { success: true, data: room };
  },
);

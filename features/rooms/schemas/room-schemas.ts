import { z } from 'zod';

import { RoomType, OperationalStatus } from '@/domain/rooms/entities';

export const createRoomSchema = z.object({
  hostelId: z.preprocess((val) => {
    if (typeof val !== 'string') return '00000000-0000-0000-0000-000000000001';
    const t = val.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? t : '00000000-0000-0000-0000-000000000001';
  }, z.string().uuid('Invalid hostel ID')),
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.number().int().optional(),
  roomType: z.nativeEnum(RoomType).default(RoomType.SINGLE),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  operationalStatus: z.nativeEnum(OperationalStatus).default(OperationalStatus.AVAILABLE),
  monthlyRent: z.number().nonnegative('Monthly rent cannot be negative'),
  description: z.string().optional(),
});

export type CreateRoomSchemaInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
  roomNumber: z.string().min(1).optional(),
  floor: z.number().int().optional(),
  roomType: z.nativeEnum(RoomType).optional(),
  capacity: z.number().int().positive().optional(),
  operationalStatus: z.nativeEnum(OperationalStatus).optional(),
  monthlyRent: z.number().nonnegative().optional(),
  description: z.string().optional(),
});

export type UpdateRoomSchemaInput = z.infer<typeof updateRoomSchema>;

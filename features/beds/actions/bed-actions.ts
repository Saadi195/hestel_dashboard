'use server';

import { revalidatePath } from 'next/cache';

import type { Bed } from '@/domain/rooms/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { CreateBedSchemaInput, UpdateBedSchemaInput } from '../schemas/bed-schemas';
import { BedService } from '../services/bed-service';

const bedService = new BedService();

export const createBedAction = withErrorHandling(
  async (input: CreateBedSchemaInput): Promise<ActionResult<Bed>> => {
    const bed = await bedService.createBed(input);
    revalidatePath('/beds');
    revalidatePath('/rooms');
    return { success: true, data: bed };
  },
);

export const updateBedStatusAction = withErrorHandling(
  async (input: UpdateBedSchemaInput): Promise<ActionResult<Bed>> => {
    const bed = await bedService.updateBedStatus(input);
    revalidatePath('/beds');
    revalidatePath('/rooms');
    return { success: true, data: bed };
  },
);

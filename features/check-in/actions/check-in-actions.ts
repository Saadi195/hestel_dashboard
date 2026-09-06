'use server';

import { revalidatePath } from 'next/cache';

import type { ResidentAssignment } from '@/domain/assignments/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { CheckInSchemaInput } from '../schemas/check-in-schemas';
import { CheckInService } from '../services/check-in-service';

const checkInService = new CheckInService();

export const checkInResidentAction = withErrorHandling(
  async (input: CheckInSchemaInput): Promise<ActionResult<ResidentAssignment>> => {
    const assignment = await checkInService.checkInResident(input);
    revalidatePath('/residents');
    revalidatePath('/check-in');
    revalidatePath('/rooms');
    revalidatePath('/beds');
    return { success: true, data: assignment };
  },
);

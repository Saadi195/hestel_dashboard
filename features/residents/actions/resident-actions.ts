'use server';

import { revalidatePath } from 'next/cache';

import type { Resident } from '@/domain/residents/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type {
  CreateResidentSchemaInput,
  UpdateResidentSchemaInput,
  SuspendResidentSchemaInput,
} from '../schemas/resident-schemas';
import { ResidentService } from '../services/resident-service';

const residentService = new ResidentService();

export const createResidentAction = withErrorHandling(
  async (input: CreateResidentSchemaInput): Promise<ActionResult<Resident>> => {
    const resident = await residentService.createResident(input);
    revalidatePath('/residents');
    return { success: true, data: resident };
  },
);

export const updateResidentAction = withErrorHandling(
  async (input: UpdateResidentSchemaInput): Promise<ActionResult<Resident>> => {
    const resident = await residentService.updateResident(input);
    revalidatePath('/residents');
    revalidatePath(`/residents/${input.id}`);
    return { success: true, data: resident };
  },
);

export const suspendResidentAction = withErrorHandling(
  async (input: SuspendResidentSchemaInput): Promise<ActionResult<Resident>> => {
    const resident = await residentService.suspendResident(input);
    revalidatePath('/residents');
    revalidatePath(`/residents/${input.residentId}`);
    return { success: true, data: resident };
  },
);

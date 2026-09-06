'use server';

import { revalidatePath } from 'next/cache';

import type { Fine, FinePayment } from '@/domain/fines/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type {
  CreateFineSchemaInput,
  RecordFinePaymentSchemaInput,
  WaiveFineSchemaInput,
} from '../schemas/fine-schemas';
import { FineService } from '../services/fine-service';

const fineService = new FineService();

export const createFineAction = withErrorHandling(
  async (input: CreateFineSchemaInput): Promise<ActionResult<Fine>> => {
    const fine = await fineService.createFine(input);
    revalidatePath('/fines');
    return { success: true, data: fine };
  },
);

export const recordFinePaymentAction = withErrorHandling(
  async (input: RecordFinePaymentSchemaInput): Promise<ActionResult<FinePayment>> => {
    const payment = await fineService.recordFinePayment(input);
    revalidatePath('/fines');
    revalidatePath('/dashboard');
    return { success: true, data: payment };
  },
);

export const waiveFineAction = withErrorHandling(
  async (input: WaiveFineSchemaInput): Promise<ActionResult<Fine>> => {
    const fine = await fineService.waiveFine(input);
    revalidatePath('/fines');
    revalidatePath('/dashboard');
    return { success: true, data: fine };
  },
);

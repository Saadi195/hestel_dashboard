'use server';

import { revalidatePath } from 'next/cache';

import type { RentCharge, RentPayment } from '@/domain/payments/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { CreateRentChargeSchemaInput, RecordRentPaymentSchemaInput } from '../schemas/payment-schemas';
import { RentService } from '../services/rent-service';

const rentService = new RentService();

export const createRentChargeAction = withErrorHandling(
  async (input: CreateRentChargeSchemaInput): Promise<ActionResult<RentCharge>> => {
    const charge = await rentService.createRentCharge(input);
    revalidatePath('/payments');
    return { success: true, data: charge };
  },
);

export const recordRentPaymentAction = withErrorHandling(
  async (input: RecordRentPaymentSchemaInput): Promise<ActionResult<RentPayment>> => {
    const payment = await rentService.recordRentPayment(input);
    revalidatePath('/payments');
    revalidatePath('/dashboard');
    return { success: true, data: payment };
  },
);

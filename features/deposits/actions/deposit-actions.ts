'use server';

import { revalidatePath } from 'next/cache';

import type {
  SecurityDeposit,
  SecurityDepositPayment,
  SecurityDepositDeduction,
} from '@/domain/deposits/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type {
  CreateDepositSchemaInput,
  RecordDepositPaymentSchemaInput,
  RecordDepositDeductionSchemaInput,
} from '../schemas/deposit-schemas';
import { DepositService } from '../services/deposit-service';

const depositService = new DepositService();

export const createDepositAction = withErrorHandling(
  async (input: CreateDepositSchemaInput): Promise<ActionResult<SecurityDeposit>> => {
    const deposit = await depositService.createDeposit(input);
    revalidatePath('/deposits');
    return { success: true, data: deposit };
  },
);

export const recordDepositPaymentAction = withErrorHandling(
  async (input: RecordDepositPaymentSchemaInput): Promise<ActionResult<SecurityDepositPayment>> => {
    const payment = await depositService.recordDepositPayment(input);
    revalidatePath('/deposits');
    return { success: true, data: payment };
  },
);

export const recordDepositDeductionAction = withErrorHandling(
  async (input: RecordDepositDeductionSchemaInput): Promise<ActionResult<SecurityDepositDeduction>> => {
    const deduction = await depositService.recordDepositDeduction(input);
    revalidatePath('/deposits');
    return { success: true, data: deduction };
  },
);

'use server';

import { revalidatePath } from 'next/cache';

import type { CheckoutSettlementSnapshot } from '@/domain/checkout/entities';
import { withErrorHandling, type ActionResult } from '@/lib/errors/error-handler';

import type { ApproveCheckoutSchemaInput } from '../schemas/checkout-schemas';
import { CheckoutService } from '../services/checkout-service';

const checkoutService = new CheckoutService();

export const approveCheckoutAction = withErrorHandling(
  async (input: ApproveCheckoutSchemaInput): Promise<ActionResult<CheckoutSettlementSnapshot>> => {
    const settlement = await checkoutService.approveCheckout(input);
    revalidatePath('/check-out');
    revalidatePath('/residents');
    revalidatePath('/rooms');
    revalidatePath('/beds');
    revalidatePath('/dashboard');
    return { success: true, data: settlement };
  },
);

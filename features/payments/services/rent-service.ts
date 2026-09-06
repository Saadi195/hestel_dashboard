import type { RentCharge, RentPayment } from '@/domain/payments/entities';
import { deriveRentStatus, calculateOutstandingRent } from '@/domain/rent/rules';
import { SupabaseRentRepository } from '@/infrastructure/repositories/supabase-rent-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createRentChargeSchema,
  recordRentPaymentSchema,
  type CreateRentChargeSchemaInput,
  type RecordRentPaymentSchemaInput,
} from '../schemas/payment-schemas';

export interface RentChargeWithStatus extends RentCharge {
  residentName: string;
  totalPaid: number;
  outstandingBalance: number;
  derivedStatus: string;
  payments: RentPayment[];
}

export class RentService {
  private repository = new SupabaseRentRepository();

  async getRentCharges(_hostelId: string): Promise<RentChargeWithStatus[]> {
    await requirePermission('payments.view');
    const charges = await this.repository.getAll();
    const supabase = await createClient();

    const chargesWithStatus: RentChargeWithStatus[] = await Promise.all(
      charges.map(async (charge) => {
        const { data: resident } = await supabase
          .from('residents')
          .select('full_name')
          .eq('id', charge.residentId)
          .maybeSingle();

        const payments = await this.repository.getPaymentsByChargeId(charge.id);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const outstanding = calculateOutstandingRent(charge.amount, totalPaid);
        const derived = deriveRentStatus(charge.amount, totalPaid, charge.dueDate);

        return {
          ...charge,
          residentName: (resident as { full_name: string } | null)?.full_name ?? 'Unknown Resident',
          totalPaid,
          outstandingBalance: outstanding,
          derivedStatus: derived,
          payments,
        };
      }),
    );

    return chargesWithStatus;
  }

  async createRentCharge(input: CreateRentChargeSchemaInput): Promise<RentCharge> {
    const user = await requirePermission('payments.create');
    const validated = createRentChargeSchema.parse(input);

    const charge = await this.repository.create({
      hostelId: validated.hostelId,
      residentId: validated.residentId,
      billingPeriod: validated.billingPeriod,
      amount: validated.amount,
      dueDate: validated.dueDate,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'RENT_CHARGE_CREATED',
      entity_type: 'rent_charge',
      entity_id: charge.id,
      metadata: { billingPeriod: charge.billingPeriod, amount: charge.amount },
    });

    return charge;
  }

  async recordRentPayment(input: RecordRentPaymentSchemaInput): Promise<RentPayment> {
    const user = await requirePermission('payments.create');
    const validated = recordRentPaymentSchema.parse(input);

    const charge = await this.repository.getById(validated.rentChargeId);
    if (!charge) {
      throw new BusinessRuleError('Rent charge record not found.', 'RENT_CHARGE_NOT_FOUND');
    }

    const existingPayments = await this.repository.getPaymentsByChargeId(charge.id);
    const totalPaid = existingPayments.reduce((acc, p) => acc + p.amount, 0);
    const outstanding = calculateOutstandingRent(charge.amount, totalPaid);

    if (validated.amount > outstanding) {
      throw new BusinessRuleError(
        `Payment amount (PKR ${validated.amount}) exceeds outstanding balance (PKR ${outstanding}).`,
        'PAYMENT_EXCEEDS_OUTSTANDING',
      );
    }

    const payment = await this.repository.recordPayment({
      rentChargeId: charge.id,
      residentId: validated.residentId,
      amount: validated.amount,
      paymentDate: validated.paymentDate,
      paymentMethod: validated.paymentMethod,
      referenceNumber: validated.referenceNumber ?? null,
      notes: validated.notes ?? null,
      recordedBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'PAYMENT_RECORDED',
      entity_type: 'rent_payment',
      entity_id: payment.id,
      metadata: { amount: payment.amount, method: payment.paymentMethod },
    });

    return payment;
  }
}

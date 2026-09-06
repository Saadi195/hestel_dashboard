import type { Fine, FinePayment } from '@/domain/fines/entities';
import {
  deriveFineBalance,
  deriveFineStatus,
  assertCanWaiveFine,
  assertValidFinePayment,
} from '@/domain/fines/rules';
import { SupabaseFineRepository } from '@/infrastructure/repositories/supabase-fine-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createFineSchema,
  recordFinePaymentSchema,
  waiveFineSchema,
  type CreateFineSchemaInput,
  type RecordFinePaymentSchemaInput,
  type WaiveFineSchemaInput,
} from '../schemas/fine-schemas';

export interface FineWithSummary extends Fine {
  residentName: string;
  totalPaid: number;
  remainingBalance: number;
  derivedStatus: string;
  payments: FinePayment[];
}

export class FineService {
  private repository = new SupabaseFineRepository();

  async getFines(_hostelId: string): Promise<FineWithSummary[]> {
    await requirePermission('fines.view');
    const fines = await this.repository.getAll();
    const supabase = await createClient();

    const finesWithSummary: FineWithSummary[] = await Promise.all(
      fines.map(async (fine) => {
        const { data: resident } = await supabase
          .from('residents')
          .select('full_name')
          .eq('id', fine.residentId)
          .maybeSingle();

        const payments = await this.repository.getPaymentsByFineId(fine.id);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const remaining = deriveFineBalance(fine.amount, totalPaid);
        const derived = deriveFineStatus(fine.amount, totalPaid, fine.isWaived);

        return {
          ...fine,
          residentName: (resident as { full_name: string } | null)?.full_name ?? 'Unknown Resident',
          totalPaid,
          remainingBalance: remaining,
          derivedStatus: derived,
          payments,
        };
      }),
    );

    return finesWithSummary;
  }

  async createFine(input: CreateFineSchemaInput): Promise<Fine> {
    const user = await requirePermission('fines.create');
    const validated = createFineSchema.parse(input);

    const fine = await this.repository.create({
      hostelId: validated.hostelId,
      residentId: validated.residentId,
      title: 'Disciplinary Fine',
      reason: validated.reason,
      amount: validated.amount,
      isWaived: false,
      waivedBy: null,
      waivedAt: null,
      waiverReason: null,
      issuedBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'FINE_CREATED',
      entity_type: 'fine',
      entity_id: fine.id,
      metadata: { amount: fine.amount, reason: fine.reason },
    });

    return fine;
  }

  async recordFinePayment(input: RecordFinePaymentSchemaInput): Promise<FinePayment> {
    const user = await requirePermission('fines.create');
    const validated = recordFinePaymentSchema.parse(input);

    const fine = await this.repository.getById(validated.fineId);
    if (!fine) {
      throw new BusinessRuleError('Fine record not found.', 'FINE_NOT_FOUND');
    }

    const payments = await this.repository.getPaymentsByFineId(fine.id);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = deriveFineBalance(fine.amount, totalPaid);

    assertValidFinePayment(validated.amount, remaining);

    const payment = await this.repository.recordPayment({
      fineId: fine.id,
      amount: validated.amount,
      paymentDate: validated.paymentDate,
      paymentMethod: validated.paymentMethod,
      referenceNumber: validated.referenceNumber ?? null,
      recordedBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'FINE_PAYMENT_RECORDED',
      entity_type: 'fine_payment',
      entity_id: payment.id,
      metadata: { amount: payment.amount, method: payment.paymentMethod },
    });

    return payment;
  }

  async waiveFine(input: WaiveFineSchemaInput): Promise<Fine> {
    const user = await requirePermission('fines.waive');
    const validated = waiveFineSchema.parse(input);

    const fine = await this.repository.getById(validated.fineId);
    if (!fine) {
      throw new BusinessRuleError('Fine record not found.', 'FINE_NOT_FOUND');
    }

    const payments = await this.repository.getPaymentsByFineId(fine.id);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const derivedStatus = deriveFineStatus(fine.amount, totalPaid, fine.isWaived);

    assertCanWaiveFine(fine.isWaived, derivedStatus);

    const waivedFine = await this.repository.waiveFine(fine.id, user.id, validated.waiverReason);

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'FINE_WAIVED',
      entity_type: 'fine',
      entity_id: waivedFine.id,
      metadata: { waiverReason: validated.waiverReason },
    });

    return waivedFine;
  }
}

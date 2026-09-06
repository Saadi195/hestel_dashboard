import type {
  SecurityDeposit,
  SecurityDepositPayment,
  SecurityDepositDeduction,
} from '@/domain/deposits/entities';
import {
  deriveDepositPaidTotal,
  deriveNetDepositBalance,
  assertValidDepositDeduction,
} from '@/domain/deposits/rules';
import { SupabaseDepositRepository } from '@/infrastructure/repositories/supabase-deposit-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import {
  createDepositSchema,
  recordDepositPaymentSchema,
  recordDepositDeductionSchema,
  type CreateDepositSchemaInput,
  type RecordDepositPaymentSchemaInput,
  type RecordDepositDeductionSchemaInput,
} from '../schemas/deposit-schemas';

export interface SecurityDepositWithSummary extends SecurityDeposit {
  residentName: string;
  totalPaid: number;
  totalDeductions: number;
  netAvailableBalance: number;
  remainingRequired: number;
  payments: SecurityDepositPayment[];
  deductions: SecurityDepositDeduction[];
}

export class DepositService {
  private repository = new SupabaseDepositRepository();

  async getDeposits(_hostelId: string): Promise<SecurityDepositWithSummary[]> {
    await requirePermission('deposits.view');
    const deposits = await this.repository.getAll();
    const supabase = await createClient();

    const depositsWithSummary: SecurityDepositWithSummary[] = await Promise.all(
      deposits.map(async (dep) => {
        const { data: resident } = await supabase
          .from('residents')
          .select('full_name')
          .eq('id', dep.residentId)
          .maybeSingle();

        const residentRow = resident as Record<string, unknown> | null;
        const residentName = residentRow ? String(residentRow['full_name']) : 'Unknown Resident';

        const payments = await this.repository.getPaymentsByDepositId(dep.id);
        const deductions = await this.repository.getDeductionsByDepositId(dep.id);

        const totalPaymentsSum = payments.reduce((acc, p) => acc + p.amount, 0);
        const totalDeductionsSum = deductions.reduce((acc, d) => acc + d.amount, 0);

        const totalPaid = deriveDepositPaidTotal(totalPaymentsSum);
        const netAvailable = deriveNetDepositBalance(totalPaymentsSum, totalDeductionsSum);
        const remainingRequired = Math.max(0, dep.requiredAmount - totalPaid);

        return {
          ...dep,
          residentName,
          totalPaid,
          totalDeductions: totalDeductionsSum,
          netAvailableBalance: netAvailable,
          remainingRequired,
          payments,
          deductions,
        };
      }),
    );

    return depositsWithSummary;
  }

  async createDeposit(input: CreateDepositSchemaInput): Promise<SecurityDeposit> {
    const user = await requirePermission('deposits.create');
    const validated = createDepositSchema.parse(input);

    const existing = await this.repository.getByResidentId(validated.residentId);
    if (existing) {
      throw new BusinessRuleError(
        'Security deposit record already exists for this resident.',
        'DEPOSIT_ALREADY_EXISTS',
      );
    }

    const deposit = await this.repository.create({
      hostelId: validated.hostelId,
      residentId: validated.residentId,
      requiredAmount: validated.requiredAmount,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'DEPOSIT_CREATED',
      entity_type: 'security_deposit',
      entity_id: deposit.id,
      metadata: { requiredAmount: deposit.requiredAmount },
    });

    return deposit;
  }

  async recordDepositPayment(input: RecordDepositPaymentSchemaInput): Promise<SecurityDepositPayment> {
    const user = await requirePermission('deposits.create');
    const validated = recordDepositPaymentSchema.parse(input);

    const payment = await this.repository.recordPayment({
      depositId: validated.securityDepositId,
      amount: validated.amount,
      paymentDate: validated.paymentDate,
      paymentMethod: validated.paymentMethod,
      referenceNumber: validated.referenceNumber ?? null,
      recordedBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'DEPOSIT_PAYMENT_RECORDED',
      entity_type: 'security_deposit_payment',
      entity_id: payment.id,
      metadata: { amount: payment.amount, method: payment.paymentMethod },
    });

    return payment;
  }

  async recordDepositDeduction(input: RecordDepositDeductionSchemaInput): Promise<SecurityDepositDeduction> {
    const user = await requirePermission('deposits.deduct');
    const validated = recordDepositDeductionSchema.parse(input);

    const deposit = await this.repository.getById(validated.securityDepositId);
    if (!deposit) {
      throw new BusinessRuleError('Deposit record not found.', 'DEPOSIT_NOT_FOUND');
    }

    const payments = await this.repository.getPaymentsByDepositId(deposit.id);
    const deductions = await this.repository.getDeductionsByDepositId(deposit.id);

    const totalPaymentsSum = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalDeductionsSum = deductions.reduce((acc, d) => acc + d.amount, 0);
    const netAvailable = deriveNetDepositBalance(totalPaymentsSum, totalDeductionsSum);

    assertValidDepositDeduction(validated.amount, netAvailable);

    const deduction = await this.repository.recordDeduction({
      depositId: deposit.id,
      amount: validated.amount,
      reason: validated.reason,
      approvedBy: user.id,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'DEPOSIT_DEDUCTION_CREATED',
      entity_type: 'security_deposit_deduction',
      entity_id: deduction.id,
      metadata: { amount: deduction.amount, reason: deduction.reason },
    });

    return deduction;
  }
}

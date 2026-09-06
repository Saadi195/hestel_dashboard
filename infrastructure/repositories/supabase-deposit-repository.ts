import type {
  SecurityDeposit,
  SecurityDepositPayment,
  SecurityDepositDeduction,
} from '@/domain/deposits/entities';
import { PaymentMethod } from '@/domain/payments/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  DepositRepository,
  CreateDepositInput,
  CreateDepositPaymentInput,
  CreateDepositDeductionInput,
} from './deposit-repository';

const memoryDeposits: SecurityDeposit[] = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    requiredAmount: 25000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const memoryDepositPayments: SecurityDepositPayment[] = [
  {
    id: '80000000-0000-0000-0000-000000000001',
    depositId: '70000000-0000-0000-0000-000000000001',
    amount: 25000,
    paymentDate: '2026-01-01',
    paymentMethod: PaymentMethod.CASH,
    referenceNumber: 'REC-001',
    recordedBy: '00000000-0000-0000-0000-000000000000',
    createdAt: new Date().toISOString(),
  },
];

const memoryDepositDeductions: SecurityDepositDeduction[] = [];

export class SupabaseDepositRepository implements DepositRepository {
  async getById(id: string): Promise<SecurityDeposit | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('security_deposits').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapDepositToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById deposit failed, falling back to memory store');
    }
    return memoryDeposits.find((d) => d.id === id) ?? null;
  }

  async getAll(): Promise<SecurityDeposit[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('security_deposits').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapDepositToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll deposits failed, falling back to memory store');
    }
    return [...memoryDeposits];
  }

  async getByResidentId(residentId: string): Promise<SecurityDeposit | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('security_deposits')
        .select('*')
        .eq('resident_id', residentId)
        .maybeSingle();

      if (!error && data) {
        return this.mapDepositToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByResidentId deposit failed, falling back to memory store');
    }
    return memoryDeposits.find((d) => d.residentId === residentId) ?? null;
  }

  async getPaymentsByDepositId(depositId: string): Promise<SecurityDepositPayment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('security_deposit_payments')
        .select('*')
        .eq('deposit_id', depositId)
        .order('payment_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapPaymentToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getPaymentsByDepositId failed, falling back to memory store');
    }
    return memoryDepositPayments.filter((p) => p.depositId === depositId);
  }

  async getDeductionsByDepositId(depositId: string): Promise<SecurityDepositDeduction[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('security_deposit_deductions')
        .select('*')
        .eq('deposit_id', depositId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapDeductionToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getDeductionsByDepositId failed, falling back to memory store');
    }
    return memoryDepositDeductions.filter((d) => d.depositId === depositId);
  }

  async create(input: CreateDepositInput): Promise<SecurityDeposit> {
    const newDeposit: SecurityDeposit = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `dep-${Date.now()}`,
      hostelId: input.hostelId,
      residentId: input.residentId,
      requiredAmount: input.requiredAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newDeposit.id,
        hostel_id: input.hostelId,
        resident_id: input.residentId,
        required_amount: input.requiredAmount,
      };

      const { data, error } = await getTable(supabase, 'security_deposits')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapDepositToDomain(data as Record<string, unknown>);
        memoryDeposits.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create deposit failed, persisting in memory store');
    }

    memoryDeposits.unshift(newDeposit);
    return newDeposit;
  }

  async update(id: string, input: Partial<CreateDepositInput>): Promise<SecurityDeposit> {
    const index = memoryDeposits.findIndex((d) => d.id === id);
    const existing = index !== -1 ? memoryDeposits[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.requiredAmount !== undefined) payload['required_amount'] = input.requiredAmount;

      const { data, error } = await getTable(supabase, 'security_deposits')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapDepositToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryDeposits[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update deposit failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    const updatedDeposit: SecurityDeposit = {
      ...existing,
      requiredAmount: input.requiredAmount ?? existing.requiredAmount,
      updatedAt: new Date().toISOString(),
    };

    memoryDeposits[index] = updatedDeposit;
    return updatedDeposit;
  }

  async recordPayment(input: CreateDepositPaymentInput): Promise<SecurityDepositPayment> {
    const newPayment: SecurityDepositPayment = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `deppay-${Date.now()}`,
      depositId: input.depositId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber ?? null,
      recordedBy: input.recordedBy,
      createdAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newPayment.id,
        deposit_id: input.depositId,
        amount: input.amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber ?? null,
        recorded_by: null,
      };

      const { data, error } = await getTable(supabase, 'security_deposit_payments')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapPaymentToDomain(data as Record<string, unknown>);
        memoryDepositPayments.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase record deposit payment failed, persisting in memory store');
    }

    memoryDepositPayments.unshift(newPayment);
    return newPayment;
  }

  async recordDeduction(input: CreateDepositDeductionInput): Promise<SecurityDepositDeduction> {
    const newDeduction: SecurityDepositDeduction = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `ded-${Date.now()}`,
      depositId: input.depositId,
      amount: input.amount,
      reason: input.reason,
      approvedBy: input.approvedBy,
      createdAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newDeduction.id,
        deposit_id: input.depositId,
        amount: input.amount,
        reason: input.reason,
        approved_by: null,
      };

      const { data, error } = await getTable(supabase, 'security_deposit_deductions')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapDeductionToDomain(data as Record<string, unknown>);
        memoryDepositDeductions.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase record deposit deduction failed, persisting in memory store');
    }

    memoryDepositDeductions.unshift(newDeduction);
    return newDeduction;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('security_deposits').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete deposit failed, removing from memory store');
    }
    const index = memoryDeposits.findIndex((d) => d.id === id);
    if (index !== -1) {
      memoryDeposits.splice(index, 1);
    }
  }

  private mapDepositToDomain(row: Record<string, unknown>): SecurityDeposit {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      residentId: String(row['resident_id']),
      requiredAmount: Number(row['required_amount']),
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }

  private mapPaymentToDomain(row: Record<string, unknown>): SecurityDepositPayment {
    return {
      id: String(row['id']),
      depositId: String(row['deposit_id']),
      amount: Number(row['amount']),
      paymentDate: String(row['payment_date']),
      paymentMethod: (row['payment_method'] as PaymentMethod) ?? PaymentMethod.CASH,
      referenceNumber: row['reference_number'] ? String(row['reference_number']) : null,
      recordedBy: String(row['recorded_by']),
      createdAt: String(row['created_at']),
    };
  }

  private mapDeductionToDomain(row: Record<string, unknown>): SecurityDepositDeduction {
    return {
      id: String(row['id']),
      depositId: String(row['deposit_id']),
      amount: Number(row['amount']),
      reason: String(row['reason']),
      approvedBy: String(row['approved_by']),
      createdAt: String(row['created_at']),
    };
  }
}

import type { Fine, FinePayment } from '@/domain/fines/entities';
import { PaymentMethod } from '@/domain/payments/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  FineRepository,
  CreateFineInput,
  CreateFinePaymentInput,
} from './fine-repository';

const memoryFines: Fine[] = [];
const memoryFinePayments: FinePayment[] = [];

export class SupabaseFineRepository implements FineRepository {
  async getById(id: string): Promise<Fine | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('fines').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapFineToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById fine failed, falling back to memory store');
    }
    return memoryFines.find((f) => f.id === id) ?? null;
  }

  async getAll(): Promise<Fine[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('fines').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapFineToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll fines failed, falling back to memory store');
    }
    return [...memoryFines];
  }

  async getByResidentId(residentId: string): Promise<Fine[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('fines')
        .select('*')
        .eq('resident_id', residentId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapFineToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getByResidentId fines failed, falling back to memory store');
    }
    return memoryFines.filter((f) => f.residentId === residentId);
  }

  async getPaymentsByFineId(fineId: string): Promise<FinePayment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('fine_payments')
        .select('*')
        .eq('fine_id', fineId)
        .order('payment_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapPaymentToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getPaymentsByFineId failed, falling back to memory store');
    }
    return memoryFinePayments.filter((p) => p.fineId === fineId);
  }

  async create(input: CreateFineInput): Promise<Fine> {
    const newFine: Fine = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `fine-${Date.now()}`,
      hostelId: input.hostelId,
      residentId: input.residentId,
      title: input.title ?? 'Disciplinary Fine',
      reason: input.reason,
      amount: input.amount,
      issuedBy: input.issuedBy,
      isWaived: false,
      waiverReason: null,
      waivedBy: null,
      waivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newFine.id,
        hostel_id: input.hostelId,
        resident_id: input.residentId,
        title: input.title ?? 'Disciplinary Fine',
        reason: input.reason,
        amount: input.amount,
        issued_by: null,
      };

      const { data, error } = await getTable(supabase, 'fines')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapFineToDomain(data as Record<string, unknown>);
        memoryFines.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create fine failed, persisting in memory store');
    }

    memoryFines.unshift(newFine);
    return newFine;
  }

  async update(id: string, input: Partial<CreateFineInput>): Promise<Fine> {
    const index = memoryFines.findIndex((f) => f.id === id);
    const existing = index !== -1 ? memoryFines[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.amount !== undefined) payload['amount'] = input.amount;
      if (input.reason !== undefined) payload['reason'] = input.reason;

      const { data, error } = await getTable(supabase, 'fines')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapFineToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryFines[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update fine failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Fine with ID ${id} not found`);
    }

    const updatedFine: Fine = {
      ...existing,
      amount: input.amount ?? existing.amount,
      reason: input.reason ?? existing.reason,
      updatedAt: new Date().toISOString(),
    };

    memoryFines[index] = updatedFine;
    return updatedFine;
  }

  async recordPayment(input: CreateFinePaymentInput): Promise<FinePayment> {
    const newPayment: FinePayment = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `finepay-${Date.now()}`,
      fineId: input.fineId,
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
        fine_id: input.fineId,
        amount: input.amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber ?? null,
        recorded_by: null,
      };

      const { data, error } = await getTable(supabase, 'fine_payments')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapPaymentToDomain(data as Record<string, unknown>);
        memoryFinePayments.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase record fine payment failed, persisting in memory store');
    }

    memoryFinePayments.unshift(newPayment);
    return newPayment;
  }

  async waiveFine(fineId: string, waivedBy: string, reason: string): Promise<Fine> {
    const index = memoryFines.findIndex((f) => f.id === fineId);
    const existing = index !== -1 ? memoryFines[index] : null;

    try {
      const supabase = await createClient();
      const { data, error } = await getTable(supabase, 'fines')
        .update({
          is_waived: true,
          waiver_reason: reason,
          waived_by: null,
          waived_at: new Date().toISOString(),
        })
        .eq('id', fineId)
        .select('*')
        .single();

      if (!error && data) {
        const waived = this.mapFineToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryFines[index] = waived;
        return waived;
      }
    } catch {
      logger.warn('Supabase waive fine failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Fine with ID ${fineId} not found`);
    }

    const waivedFine: Fine = {
      ...existing,
      isWaived: true,
      waiverReason: reason,
      waivedBy,
      waivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryFines[index] = waivedFine;
    return waivedFine;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('fines').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete fine failed, removing from memory store');
    }
    const index = memoryFines.findIndex((f) => f.id === id);
    if (index !== -1) {
      memoryFines.splice(index, 1);
    }
  }

  private mapFineToDomain(row: Record<string, unknown>): Fine {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      residentId: String(row['resident_id']),
      title: row['title'] ? String(row['title']) : 'Fine',
      reason: String(row['reason']),
      amount: Number(row['amount']),
      issuedBy: String(row['issued_by']),
      isWaived: Boolean(row['is_waived']),
      waiverReason: row['waiver_reason'] ? String(row['waiver_reason']) : null,
      waivedBy: row['waived_by'] ? String(row['waived_by']) : null,
      waivedAt: row['waived_at'] ? String(row['waived_at']) : null,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }

  private mapPaymentToDomain(row: Record<string, unknown>): FinePayment {
    return {
      id: String(row['id']),
      fineId: String(row['fine_id']),
      amount: Number(row['amount']),
      paymentDate: String(row['payment_date']),
      paymentMethod: (row['payment_method'] as PaymentMethod) ?? PaymentMethod.CASH,
      referenceNumber: row['reference_number'] ? String(row['reference_number']) : null,
      recordedBy: String(row['recorded_by']),
      createdAt: String(row['created_at']),
    };
  }
}

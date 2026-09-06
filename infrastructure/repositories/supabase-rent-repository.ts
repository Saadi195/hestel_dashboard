import type { RentCharge, RentPayment } from '@/domain/payments/entities';
import { PaymentMethod } from '@/domain/payments/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  RentRepository,
  CreateRentChargeInput,
  CreateRentPaymentInput,
} from './rent-repository';

const memoryCharges: RentCharge[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    billingPeriod: '2026-01',
    amount: 25000,
    dueDate: '2026-01-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    hostelId: '00000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    billingPeriod: '2026-02',
    amount: 25000,
    dueDate: '2026-02-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const memoryPayments: RentPayment[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    rentChargeId: '50000000-0000-0000-0000-000000000001',
    residentId: '30000000-0000-0000-0000-000000000001',
    amount: 25000,
    paymentDate: '2026-01-05',
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    referenceNumber: 'TRX-100293',
    notes: 'Full payment received via HBL',
    recordedBy: '00000000-0000-0000-0000-000000000000',
    createdAt: new Date().toISOString(),
  },
];

export class SupabaseRentRepository implements RentRepository {
  async getById(id: string): Promise<RentCharge | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('rent_charges').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapChargeToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById rent charge failed, falling back to memory store');
    }
    return memoryCharges.find((c) => c.id === id) ?? null;
  }

  async getAll(): Promise<RentCharge[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('rent_charges').select('*').order('due_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapChargeToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll rent charges failed, falling back to memory store');
    }
    return [...memoryCharges];
  }

  async getChargeByResidentAndPeriod(residentId: string, period: string): Promise<RentCharge | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('rent_charges')
        .select('*')
        .eq('resident_id', residentId)
        .eq('billing_period', period)
        .maybeSingle();

      if (!error && data) {
        return this.mapChargeToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getChargeByResidentAndPeriod failed, falling back to memory store');
    }
    return memoryCharges.find((c) => c.residentId === residentId && c.billingPeriod === period) ?? null;
  }

  async getPaymentsByChargeId(rentChargeId: string): Promise<RentPayment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('rent_charge_id', rentChargeId)
        .order('payment_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapPaymentToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getPaymentsByChargeId failed, falling back to memory store');
    }
    return memoryPayments.filter((p) => p.rentChargeId === rentChargeId);
  }

  async create(input: CreateRentChargeInput): Promise<RentCharge> {
    const newCharge: RentCharge = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `rent-${Date.now()}`,
      hostelId: input.hostelId,
      residentId: input.residentId,
      billingPeriod: input.billingPeriod,
      amount: input.amount,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newCharge.id,
        hostel_id: input.hostelId,
        resident_id: input.residentId,
        billing_period: input.billingPeriod,
        amount: input.amount,
        due_date: input.dueDate,
      };

      const { data, error } = await getTable(supabase, 'rent_charges')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapChargeToDomain(data as Record<string, unknown>);
        memoryCharges.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create rent charge failed, persisting in memory store');
    }

    memoryCharges.unshift(newCharge);
    return newCharge;
  }

  async update(id: string, input: Partial<CreateRentChargeInput>): Promise<RentCharge> {
    const index = memoryCharges.findIndex((c) => c.id === id);
    const existing = index !== -1 ? memoryCharges[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.amount !== undefined) payload['amount'] = input.amount;
      if (input.dueDate !== undefined) payload['due_date'] = input.dueDate;

      const { data, error } = await getTable(supabase, 'rent_charges')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapChargeToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryCharges[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update rent charge failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Rent charge with ID ${id} not found`);
    }

    const updatedCharge: RentCharge = {
      ...existing,
      amount: input.amount ?? existing.amount,
      dueDate: input.dueDate ?? existing.dueDate,
      updatedAt: new Date().toISOString(),
    };

    memoryCharges[index] = updatedCharge;
    return updatedCharge;
  }

  async recordPayment(input: CreateRentPaymentInput): Promise<RentPayment> {
    const newPayment: RentPayment = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `pay-${Date.now()}`,
      rentChargeId: input.rentChargeId,
      residentId: input.residentId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber ?? null,
      notes: input.notes ?? null,
      recordedBy: input.recordedBy,
      createdAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newPayment.id,
        rent_charge_id: input.rentChargeId,
        resident_id: input.residentId,
        amount: input.amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber ?? null,
        notes: input.notes ?? null,
        recorded_by: null,
      };

      const { data, error } = await getTable(supabase, 'rent_payments')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapPaymentToDomain(data as Record<string, unknown>);
        memoryPayments.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase record rent payment failed, persisting in memory store');
    }

    memoryPayments.unshift(newPayment);
    return newPayment;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('rent_charges').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete rent charge failed, removing from memory store');
    }
    const index = memoryCharges.findIndex((c) => c.id === id);
    if (index !== -1) {
      memoryCharges.splice(index, 1);
    }
  }

  private mapChargeToDomain(row: Record<string, unknown>): RentCharge {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      residentId: String(row['resident_id']),
      billingPeriod: String(row['billing_period']),
      amount: Number(row['amount']),
      dueDate: String(row['due_date']),
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }

  private mapPaymentToDomain(row: Record<string, unknown>): RentPayment {
    return {
      id: String(row['id']),
      rentChargeId: String(row['rent_charge_id']),
      residentId: String(row['resident_id']),
      amount: Number(row['amount']),
      paymentDate: String(row['payment_date']),
      paymentMethod: (row['payment_method'] as PaymentMethod) ?? PaymentMethod.CASH,
      referenceNumber: row['reference_number'] ? String(row['reference_number']) : null,
      notes: row['notes'] ? String(row['notes']) : null,
      recordedBy: String(row['recorded_by']),
      createdAt: String(row['created_at']),
    };
  }
}

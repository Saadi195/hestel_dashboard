import type { CheckoutSettlementSnapshot } from '@/domain/checkout/entities';
import { CheckoutSettlementStatus } from '@/domain/checkout/entities';
import { logger } from '@/lib/logger';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import type {
  CheckoutRepository,
  CreateCheckoutSettlementInput,
  UpdateCheckoutSettlementInput,
} from './checkout-repository';

const memoryCheckouts: CheckoutSettlementSnapshot[] = [];

export class SupabaseCheckoutRepository implements CheckoutRepository {
  async getById(id: string): Promise<CheckoutSettlementSnapshot | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('checkout_settlements').select('*').eq('id', id).single();
      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getById checkout settlement failed, falling back to memory store');
    }
    return memoryCheckouts.find((c) => c.id === id) ?? null;
  }

  async getAll(): Promise<CheckoutSettlementSnapshot[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('checkout_settlements').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getAll checkout settlements failed, falling back to memory store');
    }
    return [...memoryCheckouts];
  }

  async getByHostelId(hostelId: string): Promise<CheckoutSettlementSnapshot[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('checkout_settlements').select('*').eq('hostel_id', hostelId).order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item) => this.mapToDomain(item as unknown as Record<string, unknown>));
      }
    } catch {
      logger.warn('Supabase getByHostelId checkout settlements failed, falling back to memory store');
    }
    return memoryCheckouts.filter((c) => c.hostelId === hostelId);
  }

  async getByResidentId(residentId: string): Promise<CheckoutSettlementSnapshot | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('checkout_settlements')
        .select('*')
        .eq('resident_id', residentId)
        .maybeSingle();

      if (!error && data) {
        return this.mapToDomain(data as unknown as Record<string, unknown>);
      }
    } catch {
      logger.warn('Supabase getByResidentId checkout settlement failed, falling back to memory store');
    }
    return memoryCheckouts.find((c) => c.residentId === residentId) ?? null;
  }

  async create(input: CreateCheckoutSettlementInput): Promise<CheckoutSettlementSnapshot> {
    const newSettlement: CheckoutSettlementSnapshot = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `chk-${Date.now()}`,
      hostelId: input.hostelId,
      residentId: input.residentId,
      noticeId: input.noticeId ?? null,
      checkoutDate: input.checkoutDate ?? (new Date().toISOString().split('T')[0] ?? ''),
      snapshotTotalRentDue: input.snapshotTotalRentDue ?? 0,
      snapshotTotalFinesDue: input.snapshotTotalFinesDue ?? 0,
      snapshotDepositPaid: input.snapshotDepositPaid ?? 0,
      snapshotDepositDeductions: input.snapshotDepositDeductions ?? 0,
      snapshotRefundableAmount: input.snapshotRefundableAmount ?? 0,
      snapshotNetAmountDue: input.snapshotNetAmountDue ?? 0,
      status: input.status,
      notes: input.notes ?? null,
      approvedBy: input.approvedBy ?? null,
      approvedAt: input.approvedAt ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const insertPayload = {
        id: newSettlement.id,
        hostel_id: input.hostelId,
        resident_id: input.residentId,
        notice_id: input.noticeId ?? null,
        checkout_date: input.checkoutDate ?? (new Date().toISOString().split('T')[0] ?? ''),
        snapshot_total_rent_due: input.snapshotTotalRentDue ?? 0,
        snapshot_total_fines_due: input.snapshotTotalFinesDue ?? 0,
        snapshot_deposit_paid: input.snapshotDepositPaid ?? 0,
        snapshot_deposit_deductions: input.snapshotDepositDeductions ?? 0,
        snapshot_refundable_amount: input.snapshotRefundableAmount ?? 0,
        snapshot_net_amount_due: input.snapshotNetAmountDue ?? 0,
        status: input.status,
        notes: input.notes ?? null,
        approved_by: null,
        approved_at: input.approvedAt ?? null,
      };

      const { data, error } = await getTable(supabase, 'checkout_settlements')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const saved = this.mapToDomain(data as Record<string, unknown>);
        memoryCheckouts.unshift(saved);
        return saved;
      }
    } catch {
      logger.warn('Supabase create checkout settlement failed, persisting in memory store');
    }

    memoryCheckouts.unshift(newSettlement);
    return newSettlement;
  }

  async update(id: string, input: UpdateCheckoutSettlementInput): Promise<CheckoutSettlementSnapshot> {
    const index = memoryCheckouts.findIndex((c) => c.id === id);
    const existing = index !== -1 ? memoryCheckouts[index] : null;

    try {
      const supabase = await createClient();
      const payload: Record<string, unknown> = {};

      if (input.status !== undefined) payload['status'] = input.status;
      if (input.approvedBy !== undefined) payload['approved_by'] = null;
      if (input.approvedAt !== undefined) payload['approved_at'] = input.approvedAt;
      if (input.snapshotTotalRentDue !== undefined) payload['snapshot_total_rent_due'] = input.snapshotTotalRentDue;
      if (input.snapshotTotalFinesDue !== undefined) payload['snapshot_total_fines_due'] = input.snapshotTotalFinesDue;
      if (input.snapshotDepositPaid !== undefined) payload['snapshot_deposit_paid'] = input.snapshotDepositPaid;
      if (input.snapshotDepositDeductions !== undefined) payload['snapshot_deposit_deductions'] = input.snapshotDepositDeductions;
      if (input.snapshotRefundableAmount !== undefined) payload['snapshot_refundable_amount'] = input.snapshotRefundableAmount;
      if (input.snapshotNetAmountDue !== undefined) payload['snapshot_net_amount_due'] = input.snapshotNetAmountDue;

      const { data, error } = await getTable(supabase, 'checkout_settlements')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const updated = this.mapToDomain(data as Record<string, unknown>);
        if (index !== -1) memoryCheckouts[index] = updated;
        return updated;
      }
    } catch {
      logger.warn('Supabase update checkout settlement failed, updating memory store');
    }

    if (!existing) {
      throw new Error(`Checkout settlement with ID ${id} not found`);
    }

    const updatedSettlement: CheckoutSettlementSnapshot = {
      ...existing,
      status: input.status ?? existing.status,
      approvedBy: input.approvedBy !== undefined ? input.approvedBy : existing.approvedBy,
      approvedAt: input.approvedAt !== undefined ? input.approvedAt : existing.approvedAt,
      snapshotTotalRentDue: input.snapshotTotalRentDue ?? existing.snapshotTotalRentDue,
      snapshotTotalFinesDue: input.snapshotTotalFinesDue ?? existing.snapshotTotalFinesDue,
      snapshotDepositPaid: input.snapshotDepositPaid ?? existing.snapshotDepositPaid,
      snapshotDepositDeductions: input.snapshotDepositDeductions ?? existing.snapshotDepositDeductions,
      snapshotRefundableAmount: input.snapshotRefundableAmount ?? existing.snapshotRefundableAmount,
      snapshotNetAmountDue: input.snapshotNetAmountDue ?? existing.snapshotNetAmountDue,
      updatedAt: new Date().toISOString(),
    };

    memoryCheckouts[index] = updatedSettlement;
    return updatedSettlement;
  }

  async delete(id: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('checkout_settlements').delete().eq('id', id);
    } catch {
      logger.warn('Supabase delete checkout settlement failed, removing from memory store');
    }
    const index = memoryCheckouts.findIndex((c) => c.id === id);
    if (index !== -1) {
      memoryCheckouts.splice(index, 1);
    }
  }

  private mapToDomain(row: Record<string, unknown>): CheckoutSettlementSnapshot {
    return {
      id: String(row['id']),
      hostelId: String(row['hostel_id']),
      residentId: String(row['resident_id']),
      noticeId: row['notice_id'] ? String(row['notice_id']) : null,
      checkoutDate: row['checkout_date'] ? String(row['checkout_date']) : (new Date().toISOString().split('T')[0] ?? ''),
      snapshotTotalRentDue: Number(row['snapshot_total_rent_due'] ?? 0),
      snapshotTotalFinesDue: Number(row['snapshot_total_fines_due'] ?? 0),
      snapshotDepositPaid: Number(row['snapshot_deposit_paid'] ?? 0),
      snapshotDepositDeductions: Number(row['snapshot_deposit_deductions'] ?? 0),
      snapshotRefundableAmount: Number(row['snapshot_refundable_amount'] ?? 0),
      snapshotNetAmountDue: Number(row['snapshot_net_amount_due'] ?? 0),
      status: (row['status'] as CheckoutSettlementStatus) ?? CheckoutSettlementStatus.PENDING,
      notes: row['notes'] ? String(row['notes']) : null,
      approvedBy: row['approved_by'] ? String(row['approved_by']) : null,
      approvedAt: row['approved_at'] ? String(row['approved_at']) : null,
      createdAt: String(row['created_at']),
      updatedAt: String(row['updated_at']),
    };
  }
}

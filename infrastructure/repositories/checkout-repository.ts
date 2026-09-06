import type { CheckoutSettlementSnapshot } from '@/domain/checkout/entities';

import type { BaseRepository } from './base';

export type CreateCheckoutSettlementInput = Omit<CheckoutSettlementSnapshot, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCheckoutSettlementInput = Partial<Omit<CheckoutSettlementSnapshot, 'id' | 'createdAt' | 'updatedAt'>>;

export interface CheckoutRepository extends BaseRepository<CheckoutSettlementSnapshot, CreateCheckoutSettlementInput, UpdateCheckoutSettlementInput> {
  getByResidentId(residentId: string): Promise<CheckoutSettlementSnapshot | null>;
  getByHostelId(hostelId: string): Promise<CheckoutSettlementSnapshot[]>;
}

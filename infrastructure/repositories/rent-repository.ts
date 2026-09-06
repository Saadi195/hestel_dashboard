import type { RentCharge, RentPayment } from '@/domain/payments/entities';

import type { BaseRepository } from './base';

export type CreateRentChargeInput = Omit<RentCharge, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateRentPaymentInput = Omit<RentPayment, 'id' | 'createdAt'>;

export interface RentRepository extends BaseRepository<RentCharge, CreateRentChargeInput, Partial<CreateRentChargeInput>> {
  getChargeByResidentAndPeriod(residentId: string, period: string): Promise<RentCharge | null>;
  getPaymentsByChargeId(rentChargeId: string): Promise<RentPayment[]>;
  recordPayment(input: CreateRentPaymentInput): Promise<RentPayment>;
}

import type { Fine, FinePayment } from '@/domain/fines/entities';

import type { BaseRepository } from './base';

export type CreateFineInput = Omit<Fine, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateFinePaymentInput = Omit<FinePayment, 'id' | 'createdAt'>;

export interface FineRepository extends BaseRepository<Fine, CreateFineInput, Partial<CreateFineInput>> {
  getByResidentId(residentId: string): Promise<Fine[]>;
  getPaymentsByFineId(fineId: string): Promise<FinePayment[]>;
  recordPayment(input: CreateFinePaymentInput): Promise<FinePayment>;
  waiveFine(fineId: string, waivedBy: string, reason: string): Promise<Fine>;
}

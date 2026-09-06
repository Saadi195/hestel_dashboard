import type {
  SecurityDeposit,
  SecurityDepositPayment,
  SecurityDepositDeduction,
} from '@/domain/deposits/entities';

import type { BaseRepository } from './base';

export type CreateDepositInput = Omit<SecurityDeposit, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateDepositPaymentInput = Omit<SecurityDepositPayment, 'id' | 'createdAt'>;
export type CreateDepositDeductionInput = Omit<SecurityDepositDeduction, 'id' | 'createdAt'>;

export interface DepositRepository extends BaseRepository<SecurityDeposit, CreateDepositInput, Partial<CreateDepositInput>> {
  getByResidentId(residentId: string): Promise<SecurityDeposit | null>;
  getPaymentsByDepositId(depositId: string): Promise<SecurityDepositPayment[]>;
  getDeductionsByDepositId(depositId: string): Promise<SecurityDepositDeduction[]>;
  recordPayment(input: CreateDepositPaymentInput): Promise<SecurityDepositPayment>;
  recordDeduction(input: CreateDepositDeductionInput): Promise<SecurityDepositDeduction>;
}

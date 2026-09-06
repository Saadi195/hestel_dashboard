import type { ResidentAssignment } from '@/domain/assignments/entities';

import type { BaseRepository } from './base';

export type CreateAssignmentInput = Omit<ResidentAssignment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAssignmentInput = Partial<Omit<ResidentAssignment, 'id' | 'createdAt' | 'updatedAt'>>;

export interface AssignmentRepository extends BaseRepository<ResidentAssignment, CreateAssignmentInput, UpdateAssignmentInput> {
  getActiveByResidentId(residentId: string): Promise<ResidentAssignment | null>;
  getActiveByBedId(bedId: string): Promise<ResidentAssignment | null>;
  getHistoryByResidentId(residentId: string): Promise<ResidentAssignment[]>;
}

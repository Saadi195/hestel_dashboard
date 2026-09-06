import { AssignmentStatus } from '@/domain/assignments/entities';
import type { CheckoutSettlementSnapshot, DynamicSettlementCalculation } from '@/domain/checkout/entities';
import { CheckoutSettlementStatus } from '@/domain/checkout/entities';
import { calculateDynamicSettlement } from '@/domain/checkout/rules';
import { NoticeStatus } from '@/domain/notices/entities';
import { ResidentStatus } from '@/domain/residents/entities';
import { SupabaseAssignmentRepository } from '@/infrastructure/repositories/supabase-assignment-repository';
import { SupabaseCheckoutRepository } from '@/infrastructure/repositories/supabase-checkout-repository';
import { SupabaseNoticeRepository } from '@/infrastructure/repositories/supabase-notice-repository';
import { SupabaseResidentRepository } from '@/infrastructure/repositories/supabase-resident-repository';
import { requirePermission } from '@/lib/auth/session';
import { BusinessRuleError } from '@/lib/errors/app-error';
import { getTable } from '@/lib/supabase/db-helper';
import { createClient } from '@/lib/supabase/server';

import { approveCheckoutSchema, type ApproveCheckoutSchemaInput } from '../schemas/checkout-schemas';

export interface ResidentCheckoutReview {
  residentId: string;
  residentName: string;
  roomNumber: string;
  bedNumber: string;
  noticeDate: string;
  expectedCheckoutDate: string;
  calculation: DynamicSettlementCalculation;
  settlement: CheckoutSettlementSnapshot | null;
}

export class CheckoutService {
  private repository = new SupabaseCheckoutRepository();
  private residentRepo = new SupabaseResidentRepository();
  private assignmentRepo = new SupabaseAssignmentRepository();
  private noticeRepo = new SupabaseNoticeRepository();

  async getPendingCheckouts(hostelId: string): Promise<ResidentCheckoutReview[]> {
    await requirePermission('checkout.view');
    const supabase = await createClient();

    const { data: noticeResidents } = await supabase
      .from('residents')
      .select('*')
      .eq('hostel_id', hostelId)
      .in('status', ['NOTICE_PERIOD', 'CHECKOUT_PENDING']);

    if (!noticeResidents || noticeResidents.length === 0) return [];

    const reviews: ResidentCheckoutReview[] = await Promise.all(
      noticeResidents.map(async (item) => {
        const res = item as Record<string, unknown>;
        const residentId = String(res['id']);
        const residentName = String(res['full_name']);

        const assignment = await this.assignmentRepo.getActiveByResidentId(residentId);
        let roomNumber = '—';
        let bedNumber = '—';

        if (assignment) {
          const { data: bed } = await supabase
            .from('beds')
            .select('bed_number, room_id, rooms(room_number)')
            .eq('id', assignment.bedId)
            .single();

          if (bed) {
            const bedRow = bed as Record<string, unknown>;
            const roomsObj = bedRow['rooms'] as Record<string, unknown> | null;
            bedNumber = String(bedRow['bed_number']);
            roomNumber = roomsObj ? String(roomsObj['room_number']) : '—';
          }
        }

        const notice = await this.noticeRepo.getActiveByResidentId(residentId);
        const noticeDate = notice ? notice.noticeDate : '—';
        const expectedCheckoutDate = notice ? notice.expectedCheckoutDate : '—';

        const { data: rentCharges } = await supabase.from('rent_charges').select('amount').eq('resident_id', residentId);
        const { data: rentPayments } = await supabase.from('rent_payments').select('amount').eq('resident_id', residentId);
        const totalRentCharged = (rentCharges ?? []).reduce((acc: number, r: Record<string, unknown>) => acc + Number(r['amount']), 0);
        const totalRentPaid = (rentPayments ?? []).reduce((acc: number, p: Record<string, unknown>) => acc + Number(p['amount']), 0);
        const outstandingRent = Math.max(0, totalRentCharged - totalRentPaid);

        const { data: fines } = await supabase.from('fines').select('id, amount').eq('resident_id', residentId).eq('is_waived', false);
        const fineIds = (fines ?? []).map((f: Record<string, unknown>) => String(f['id']));
        let totalFinesPaid = 0;
        if (fineIds.length > 0) {
          const { data: finePayments } = await supabase.from('fine_payments').select('amount').in('fine_id', fineIds);
          totalFinesPaid = (finePayments ?? []).reduce((acc: number, fp: Record<string, unknown>) => acc + Number(fp['amount']), 0);
        }
        const totalFinesIssued = (fines ?? []).reduce((acc: number, f: Record<string, unknown>) => acc + Number(f['amount']), 0);
        const outstandingFines = Math.max(0, totalFinesIssued - totalFinesPaid);

        const { data: deposit } = await supabase.from('security_deposits').select('id').eq('resident_id', residentId).maybeSingle();
        let totalDepositPaid = 0;
        let totalDepositDeductions = 0;
        if (deposit) {
          const depositRow = deposit as Record<string, unknown>;
          const depositId = String(depositRow['id']);
          const { data: depositPayments } = await supabase.from('security_deposit_payments').select('amount').eq('deposit_id', depositId);
          const { data: depositDeductions } = await supabase.from('security_deposit_deductions').select('amount').eq('deposit_id', depositId);
          totalDepositPaid = (depositPayments ?? []).reduce((acc: number, dp: Record<string, unknown>) => acc + Number(dp['amount']), 0);
          totalDepositDeductions = (depositDeductions ?? []).reduce((acc: number, dd: Record<string, unknown>) => acc + Number(dd['amount']), 0);
        }

        const calculation = calculateDynamicSettlement(
          residentId,
          outstandingRent,
          outstandingFines,
          totalDepositPaid,
          totalDepositDeductions,
        );

        const settlement = await this.repository.getByResidentId(residentId);

        return {
          residentId,
          residentName,
          roomNumber,
          bedNumber,
          noticeDate,
          expectedCheckoutDate,
          calculation,
          settlement,
        };
      }),
    );

    return reviews;
  }

  async approveCheckout(input: ApproveCheckoutSchemaInput): Promise<CheckoutSettlementSnapshot> {
    const user = await requirePermission('checkout.approve');
    const validated = approveCheckoutSchema.parse(input);

    const resident = await this.residentRepo.getById(validated.residentId);
    if (!resident) {
      throw new BusinessRuleError('Resident not found.', 'RESIDENT_NOT_FOUND');
    }

    const reviews = await this.getPendingCheckouts(resident.hostelId);
    const review = reviews.find((r) => r.residentId === resident.id);

    if (!review) {
      throw new BusinessRuleError('No checkout pending for this resident.', 'CHECKOUT_NOT_PENDING');
    }

    let settlement = review.settlement;
    const notice = await this.noticeRepo.getActiveByResidentId(resident.id);

    if (!settlement) {
      settlement = await this.repository.create({
        hostelId: resident.hostelId,
        residentId: resident.id,
        noticeId: notice?.id ?? null,
        checkoutDate: new Date().toISOString().split('T')[0] ?? '',
        snapshotTotalRentDue: review.calculation.totalRentDue,
        snapshotTotalFinesDue: review.calculation.totalFinesDue,
        snapshotDepositPaid: review.calculation.depositPaid,
        snapshotDepositDeductions: review.calculation.depositDeductions,
        snapshotRefundableAmount: review.calculation.refundableDeposit,
        snapshotNetAmountDue: review.calculation.netAmountDue,
        status: CheckoutSettlementStatus.APPROVED,
        notes: 'Checkout approved',
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      });
    } else {
      settlement = await this.repository.update(settlement.id, {
        status: CheckoutSettlementStatus.APPROVED,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
        snapshotTotalRentDue: review.calculation.totalRentDue,
        snapshotTotalFinesDue: review.calculation.totalFinesDue,
        snapshotDepositPaid: review.calculation.depositPaid,
        snapshotDepositDeductions: review.calculation.depositDeductions,
        snapshotRefundableAmount: review.calculation.refundableDeposit,
        snapshotNetAmountDue: review.calculation.netAmountDue,
      });
    }

    const activeAssignment = await this.assignmentRepo.getActiveByResidentId(resident.id);
    if (activeAssignment) {
      await this.assignmentRepo.update(activeAssignment.id, {
        status: AssignmentStatus.COMPLETED,
        checkOutDate: new Date().toISOString().split('T')[0] ?? '',
      });
    }

    if (notice) {
      await this.noticeRepo.update(notice.id, {
        status: NoticeStatus.COMPLETED,
      });
    }

    await this.residentRepo.update(resident.id, {
      status: ResidentStatus.CHECKED_OUT,
    });

    const supabase = await createClient();
    await getTable(supabase, 'activity_logs').insert({
      user_id: user.id,
      action: 'CHECKOUT_APPROVED',
      entity_type: 'checkout_settlement',
      entity_id: settlement.id,
      metadata: {
        residentId: resident.id,
        refundableAmount: settlement.snapshotRefundableAmount,
        netAmountDue: settlement.snapshotNetAmountDue,
      },
    });

    return settlement;
  }
}

import { describe, it, expect } from 'vitest';

interface TenantRecord {
  id: string;
  hostelId: string;
  name: string;
}

function filterRecordsForHostel<T extends TenantRecord>(
  records: T[],
  activeHostelId: string,
): T[] {
  return records.filter((rec) => rec.hostelId === activeHostelId);
}

function assertTenantOwnership<T extends TenantRecord>(
  record: T,
  activeHostelId: string,
): void {
  if (record.hostelId !== activeHostelId) {
    throw new Error('Access denied: Record belongs to another hostel.');
  }
}

describe('Multi-Hostel Isolation Integration', () => {
  const hostelA_ID = 'hostel-a-1111';
  const hostelB_ID = 'hostel-b-2222';

  const mockResidents: TenantRecord[] = [
    { id: 'res-1', hostelId: hostelA_ID, name: 'Ali Khan' },
    { id: 'res-2', hostelId: hostelA_ID, name: 'Usman Ahmed' },
    { id: 'res-3', hostelId: hostelB_ID, name: 'Bilal Hassan' },
  ];

  it('filters listing queries strictly by active hostelId', () => {
    const hostelAResidents = filterRecordsForHostel(mockResidents, hostelA_ID);
    expect(hostelAResidents).toHaveLength(2);
    expect(hostelAResidents.every((r) => r.hostelId === hostelA_ID)).toBe(true);

    const hostelBResidents = filterRecordsForHostel(mockResidents, hostelB_ID);
    expect(hostelBResidents).toHaveLength(1);
    expect(hostelBResidents[0]?.name).toBe('Bilal Hassan');
  });

  it('blocks single record access when hostelId mismatch occurs', () => {
    const residentA = mockResidents[0];
    expect(residentA).toBeDefined();
    if (residentA) {
      expect(() => assertTenantOwnership(residentA, hostelA_ID)).not.toThrow();
      expect(() => assertTenantOwnership(residentA, hostelB_ID)).toThrowError(
        /belongs to another hostel/i,
      );
    }
  });
});

/**
 * Expense domain entities.
 */

export enum ExpenseCategory {
  UTILITIES = 'UTILITIES',
  MAINTENANCE = 'MAINTENANCE',
  SALARIES = 'SALARIES',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER',
}

export interface Expense {
  id: string;
  hostelId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

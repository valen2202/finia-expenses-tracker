import { Expense, ExpenseFormData } from '@/types/expense';

// D — Dependency Inversion: los contextos dependen de esta abstracción,
// no de la implementación concreta de Supabase.
export interface IExpenseRepository {
  insert(expense: Expense, userId: string): Promise<void>;
  update(id: string, data: ExpenseFormData, updatedAt: string, userId: string): Promise<void>;
  remove(id: string, userId: string): Promise<void>;
  upsertMany(expenses: Expense[], userId: string): Promise<void>;
  fetchAll(userId: string): Promise<Expense[]>;
}

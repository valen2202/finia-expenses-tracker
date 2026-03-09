import type { SupabaseClient } from '@supabase/supabase-js';
import { Expense, ExpenseFormData, Category } from '@/types/expense';
import { IExpenseRepository } from './IExpenseRepository';

// S — Single Responsibility: esta clase es la única responsable de
// las operaciones de base de datos para gastos.
// L — Liskov Substitution: implementa IExpenseRepository y puede
// ser reemplazada por cualquier otra implementación (ej: offline mock).
export class SupabaseExpenseRepository implements IExpenseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(expense: Expense, userId: string): Promise<void> {
    const { error } = await this.supabase.from('expenses').insert({
      id: expense.id,
      user_id: userId,
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      created_at: expense.createdAt,
    });
    if (error) console.error('insert:', error.message);
  }

  async update(id: string, data: ExpenseFormData, updatedAt: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .update({ date: data.date, amount: data.amount, category: data.category, description: data.description, updated_at: updatedAt })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) console.error('update:', error.message);
  }

  async remove(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) console.error('delete:', error.message);
  }

  async upsertMany(expenses: Expense[], userId: string): Promise<void> {
    const { error } = await this.supabase.from('expenses').upsert(
      expenses.map((e) => ({
        id: e.id, user_id: userId, date: e.date, amount: e.amount,
        category: e.category, description: e.description,
        created_at: e.createdAt, updated_at: e.updatedAt ?? null,
      })),
      { onConflict: 'id' },
    );
    if (error) console.error('upsertMany:', error.message);
  }

  async fetchAll(userId: string): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      date: row.date,
      amount: Number(row.amount),
      category: row.category as Category,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
    }));
  }
}

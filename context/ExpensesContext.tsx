'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Expense, ExpenseFormData, ExpenseFilter, Category } from '@/types/expense';
import { persistExpenses } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { IExpenseRepository } from '@/services/IExpenseRepository';

// S — Single Responsibility: este contexto solo maneja estado y
// operaciones de gastos. No sabe nada de chat, auth, ni UI.
// D — Dependency Inversion: depende de IExpenseRepository,
// nunca de Supabase directamente.
export interface ExpensesContextType {
  expenses: Expense[];
  isLoaded: boolean;
  setExpenses: (expenses: Expense[]) => void;
  setIsLoaded: (loaded: boolean) => void;
  addExpense: (data: ExpenseFormData) => Expense;
  updateExpense: (id: string, data: ExpenseFormData) => void;
  deleteExpense: (id: string) => void;
  getFilteredExpenses: (filter: ExpenseFilter) => Expense[];
  getTotalAmount: () => number;
  getCurrentMonthTotal: () => number;
  getMonthlyAverage: () => number;
  getCategoryTotals: () => Record<string, number>;
  getTopCategory: () => Category | null;
  getMonthlyData: () => { month: string; total: number }[];
  loadSampleData: () => void;
}

const ExpensesContext = createContext<ExpensesContextType | null>(null);

export function useExpenses(): ExpensesContextType {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}

function buildSampleExpenses(): Expense[] {
  const now = new Date();
  const samples = [
    { description: 'Supermercado Día', category: 'Supermercado', amount: 8500, days: 1 },
    { description: 'Netflix', category: 'Entretenimiento', amount: 2199, days: 3 },
    { description: 'Carga SUBE', category: 'Transporte', amount: 3000, days: 3 },
    { description: 'Zapatillas Nike', category: 'Compras', amount: 45000, days: 5 },
    { description: 'Servicio eléctrico', category: 'Facturas', amount: 14200, days: 7 },
    { description: 'Almuerzo', category: 'Salidas', amount: 5800, days: 8 },
    { description: 'Carga nafta', category: 'Transporte', amount: 21000, days: 10 },
    { description: 'Cine', category: 'Entretenimiento', amount: 7200, days: 12 },
    { description: 'Internet', category: 'Facturas', amount: 8900, days: 14 },
    { description: 'Ropa invierno', category: 'Compras', amount: 32000, days: 16 },
    { description: 'Delivery', category: 'Salidas', amount: 4100, days: 18 },
    { description: 'Gas natural', category: 'Facturas', amount: 9500, days: 20 },
    { description: 'Mercado Libre', category: 'Compras', amount: 18500, days: 22 },
    { description: 'Uber', category: 'Transporte', amount: 3800, days: 23 },
    { description: 'Spotify', category: 'Entretenimiento', amount: 1599, days: 25 },
    { description: 'Farmacia', category: 'Otro', amount: 7800, days: 28 },
    { description: 'Teléfono Claro', category: 'Facturas', amount: 12000, days: 32 },
    { description: 'Verdulería', category: 'Supermercado', amount: 3200, days: 35 },
    { description: 'Colectivo', category: 'Transporte', amount: 2400, days: 40 },
    { description: 'Heladería', category: 'Salidas', amount: 1800, days: 42 },
  ];
  return samples
    .map((s, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - s.days);
      return {
        id: generateId() + i,
        date: d.toISOString().split('T')[0],
        amount: s.amount,
        category: s.category as Category,
        description: s.description,
        createdAt: d.toISOString(),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

interface ExpensesProviderProps {
  children: ReactNode;
  repository: IExpenseRepository;
  getUserId: () => string | null;
}

export function ExpensesProvider({ children, repository, getUserId }: ExpensesProviderProps) {
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const sortAndSave = (list: Expense[]): Expense[] => {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    persistExpenses(sorted);
    return sorted;
  };

  const setExpenses = useCallback((exps: Expense[]) => {
    setExpensesState(sortAndSave(exps));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExpense = useCallback((data: ExpenseFormData): Expense => {
    const newExpense: Expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setExpensesState((prev) => sortAndSave([...prev, newExpense]));
    const uid = getUserId(); if (uid) repository.insert(newExpense, uid);
    return newExpense;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  const updateExpense = useCallback((id: string, data: ExpenseFormData) => {
    const updatedAt = new Date().toISOString();
    setExpensesState((prev) => sortAndSave(prev.map((e) => (e.id === id ? { ...e, ...data, updatedAt } : e))));
    const uid = getUserId(); if (uid) repository.update(id, data, updatedAt, uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  const deleteExpense = useCallback((id: string) => {
    setExpensesState((prev) => { const u = prev.filter((e) => e.id !== id); persistExpenses(u); return u; });
    const uid = getUserId(); if (uid) repository.remove(id, uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  const getFilteredExpenses = useCallback(
    (filter: ExpenseFilter): Expense[] =>
      expenses.filter((e) => {
        if (filter.dateFrom && e.date < filter.dateFrom) return false;
        if (filter.dateTo && e.date > filter.dateTo) return false;
        if (filter.category !== 'Todas' && e.category !== filter.category) return false;
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase();
          if (!e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [expenses],
  );

  const getTotalAmount = useCallback(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const getCurrentMonthTotal = useCallback(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const getMonthlyAverage = useCallback(() => {
    if (expenses.length === 0) return 0;
    const map: Record<string, number> = {};
    expenses.forEach((e) => { const k = e.date.substring(0, 7); map[k] = (map[k] || 0) + e.amount; });
    const vals = Object.values(map);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [expenses]);

  const getCategoryTotals = useCallback(
    (): Record<string, number> =>
      expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>),
    [expenses],
  );

  const getTopCategory = useCallback((): Category | null => {
    const totals = getCategoryTotals();
    const entries = Object.entries(totals);
    if (!entries.length) return null;
    return entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0] as Category;
  }, [getCategoryTotals]);

  const getMonthlyData = useCallback((): { month: string; total: number }[] => {
    const now = new Date();
    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const total = expenses
        .filter((e) => { const ed = new Date(e.date + 'T00:00:00'); return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth(); })
        .reduce((s, e) => s + e.amount, 0);
      return { month: MONTHS[d.getMonth()], total };
    });
  }, [expenses]);

  const loadSampleData = useCallback(() => {
    const samples = buildSampleExpenses();
    setExpensesState(samples);
    persistExpenses(samples);
    const uid = getUserId(); if (uid) repository.upsertMany(samples, uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  return (
    <ExpensesContext.Provider value={{
      expenses, isLoaded, setExpenses, setIsLoaded,
      addExpense, updateExpense, deleteExpense,
      getFilteredExpenses, getTotalAmount, getCurrentMonthTotal,
      getMonthlyAverage, getCategoryTotals, getTopCategory,
      getMonthlyData, loadSampleData,
    }}>
      {children}
    </ExpensesContext.Provider>
  );
}

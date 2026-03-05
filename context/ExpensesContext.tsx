'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Expense, ExpenseFormData, ExpenseFilter, Category } from '@/types/expense';
import { loadExpenses, persistExpenses } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface ExpensesContextType {
  expenses: Expense[];
  isLoaded: boolean;
  addExpense: (data: ExpenseFormData) => void;
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

export function useExpensesContext() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpensesContext must be used within ExpensesProvider');
  return ctx;
}

function buildSampleExpenses(): Expense[] {
  const now = new Date();
  const samples = [
    { description: 'Supermercado Día', category: 'Comida', amount: 8500, daysAgo: 1 },
    { description: 'Netflix', category: 'Entretenimiento', amount: 2199, daysAgo: 3 },
    { description: 'Carga SUBE', category: 'Transporte', amount: 3000, daysAgo: 3 },
    { description: 'Zapatillas deportivas', category: 'Compras', amount: 45000, daysAgo: 5 },
    { description: 'Servicio eléctrico', category: 'Facturas', amount: 14200, daysAgo: 7 },
    { description: 'Almuerzo con colegas', category: 'Comida', amount: 5800, daysAgo: 8 },
    { description: 'Carga de nafta', category: 'Transporte', amount: 21000, daysAgo: 10 },
    { description: 'Cine con familia', category: 'Entretenimiento', amount: 7200, daysAgo: 12 },
    { description: 'Internet Fibertel', category: 'Facturas', amount: 8900, daysAgo: 14 },
    { description: 'Ropa invierno', category: 'Compras', amount: 32000, daysAgo: 16 },
    { description: 'Delivery Rappi', category: 'Comida', amount: 4100, daysAgo: 18 },
    { description: 'Gas natural', category: 'Facturas', amount: 9500, daysAgo: 20 },
    { description: 'Mercado Libre', category: 'Compras', amount: 18500, daysAgo: 22 },
    { description: 'Uber', category: 'Transporte', amount: 3800, daysAgo: 23 },
    { description: 'Spotify Premium', category: 'Entretenimiento', amount: 1599, daysAgo: 25 },
    { description: 'Farmacia', category: 'Otro', amount: 7800, daysAgo: 28 },
    { description: 'Teléfono Claro', category: 'Facturas', amount: 12000, daysAgo: 32 },
    { description: 'Verdulería', category: 'Comida', amount: 3200, daysAgo: 35 },
    { description: 'Colectivo + subte', category: 'Transporte', amount: 2400, daysAgo: 40 },
    { description: 'Heladería', category: 'Comida', amount: 1800, daysAgo: 42 },
    { description: 'Librería papelería', category: 'Compras', amount: 4500, daysAgo: 50 },
    { description: 'Luz del mes anterior', category: 'Facturas', amount: 11000, daysAgo: 55 },
    { description: 'Parrilla familiar', category: 'Comida', amount: 9800, daysAgo: 60 },
    { description: 'Disney+', category: 'Entretenimiento', amount: 1999, daysAgo: 62 },
    { description: 'Peluquería', category: 'Otro', amount: 4500, daysAgo: 65 },
    { description: 'Zapatería', category: 'Compras', amount: 28000, daysAgo: 70 },
    { description: 'Supermercado Coto', category: 'Comida', amount: 11200, daysAgo: 72 },
    { description: 'Taxi aeropuerto', category: 'Transporte', amount: 15000, daysAgo: 80 },
  ];

  return samples.map((s, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - s.daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    return {
      id: generateId() + i,
      date: dateStr,
      amount: s.amount,
      category: s.category as Category,
      description: s.description,
      createdAt: date.toISOString(),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoaded(true);
  }, []);

  const sortedUpdate = (updated: Expense[]) => {
    const sorted = [...updated].sort((a, b) => b.date.localeCompare(a.date));
    persistExpenses(sorted);
    return sorted;
  };

  const addExpense = useCallback((data: ExpenseFormData) => {
    setExpenses((prev) =>
      sortedUpdate([...prev, { ...data, id: generateId(), createdAt: new Date().toISOString() }])
    );
  }, []);

  const updateExpense = useCallback((id: string, data: ExpenseFormData) => {
    setExpenses((prev) =>
      sortedUpdate(
        prev.map((exp) =>
          exp.id === id ? { ...exp, ...data, updatedAt: new Date().toISOString() } : exp
        )
      )
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((exp) => exp.id !== id);
      persistExpenses(updated);
      return updated;
    });
  }, []);

  const getFilteredExpenses = useCallback(
    (filter: ExpenseFilter): Expense[] =>
      expenses.filter((exp) => {
        if (filter.dateFrom && exp.date < filter.dateFrom) return false;
        if (filter.dateTo && exp.date > filter.dateTo) return false;
        if (filter.category !== 'Todas' && exp.category !== filter.category) return false;
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase();
          if (!exp.description.toLowerCase().includes(q) && !exp.category.toLowerCase().includes(q))
            return false;
        }
        return true;
      }),
    [expenses]
  );

  const getTotalAmount = useCallback(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const getCurrentMonthTotal = useCallback(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getMonthlyAverage = useCallback(() => {
    if (expenses.length === 0) return 0;
    const monthlyMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const key = e.date.substring(0, 7);
      monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
    });
    const vals = Object.values(monthlyMap);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [expenses]);

  const getCategoryTotals = useCallback((): Record<string, number> => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const getTopCategory = useCallback((): Category | null => {
    const totals = getCategoryTotals();
    const entries = Object.entries(totals);
    if (entries.length === 0) return null;
    return entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0] as Category;
  }, [getCategoryTotals]);

  const getMonthlyData = useCallback((): { month: string; total: number }[] => {
    const now = new Date();
    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date + 'T00:00:00');
          return ed.getFullYear() === y && ed.getMonth() === m;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      return { month: MONTHS[m], total };
    });
  }, [expenses]);

  const loadSampleData = useCallback(() => {
    const samples = buildSampleExpenses();
    setExpenses(samples);
    persistExpenses(samples);
  }, []);

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        isLoaded,
        addExpense,
        updateExpense,
        deleteExpense,
        getFilteredExpenses,
        getTotalAmount,
        getCurrentMonthTotal,
        getMonthlyAverage,
        getCategoryTotals,
        getTopCategory,
        getMonthlyData,
        loadSampleData,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

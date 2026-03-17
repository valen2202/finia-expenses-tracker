'use client';

// AppContext es un thin composition shell (Facade pattern).
// Compone los 4 contextos especializados y re-exporta useAppContext()
// para mantener compatibilidad con los componentes existentes.
//
// I — Interface Segregation: nuevo código debe usar los hooks específicos:
//   useExpenses() → operaciones de gastos
//   useChat()     → chat y NLP
//   useAuth()     → autenticación
//   useUI()       → estado de UI cross-cutting

import React, { useMemo, useRef, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Expense, ExpenseFormData, ExpenseFilter, Category } from '@/types/expense';
import { ChatMessage } from '@/types/chat';
import { createClient } from '@/lib/supabase';
import { SupabaseExpenseRepository } from '@/services/SupabaseExpenseRepository';

import { UIProvider, useUI } from './UIContext';
import { AuthProvider, useAuth } from './AuthContext';
import { ExpensesProvider, useExpenses } from './ExpensesContext';
import { ChatProvider, useChat } from './ChatContext';

// Re-export focused hooks for new code
export { useUI } from './UIContext';
export { useAuth } from './AuthContext';
export { useExpenses } from './ExpensesContext';
export { useChat } from './ChatContext';

// Combined type for backward compatibility
export interface AppContextType {
  expenses: Expense[];
  isLoaded: boolean;
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
  messages: ChatMessage[];
  isTyping: boolean;
  handleUserInput: (text: string) => Promise<void>;
  clearChat: () => void;
  isCloudHubOpen: boolean;
  openCloudHub: () => void;
  closeCloudHub: () => void;
  isDark: boolean;
  toggleDark: () => void;
  user: User | null;
  signOut: () => Promise<void>;
  pendingImport: boolean;
  importLocalData: () => Promise<void>;
  dismissImport: () => void;
}

// Facade hook — mantiene compatibilidad con los 13 componentes existentes.
// Nuevo código debe usar useExpenses(), useChat(), useAuth(), useUI() directamente.
export function useAppContext(): AppContextType {
  const expenses = useExpenses();
  const chat = useChat();
  const auth = useAuth();
  const ui = useUI();
  return { ...expenses, ...chat, ...auth, ...ui };
}

// InnerProviders tiene acceso a ExpensesContext para inyectar callbacks en ChatProvider.
function InnerProviders({ children }: { children: ReactNode }) {
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const expensesRef = useRef<Expense[]>(expenses);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);

  return (
    <ChatProvider
      onAddExpense={addExpense}
      onDeleteLastExpense={() => {
        const last = expensesRef.current[0];
        if (last) deleteExpense(last.id);
        return last;
      }}
      getExpenses={() => expensesRef.current}
    >
      {children}
    </ChatProvider>
  );
}

// AuthExpensesWiring sincroniza los gastos cargados desde Supabase con ExpensesContext
// y actualiza el userIdRef para que ExpensesProvider tenga el userId en las operaciones CRUD.
function AuthExpensesWiring({ children, supabase, repository, userIdRef }: {
  children: ReactNode;
  supabase: ReturnType<typeof createClient>;
  repository: SupabaseExpenseRepository;
  userIdRef: React.MutableRefObject<string | null>;
}) {
  const { setExpenses, setIsLoaded } = useExpenses();

  return (
    <AuthProvider
      supabase={supabase}
      repository={repository}
      onExpensesLoaded={(expenses, userId) => {
        userIdRef.current = userId;
        setExpenses(expenses);
      }}
      onAuthReady={() => setIsLoaded(true)}
    >
      {children}
    </AuthProvider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const repository = useMemo(() => new SupabaseExpenseRepository(supabase), [supabase]);
  // userIdRef bridges AuthProvider → ExpensesProvider sin crear dependencia circular
  const userIdRef = useRef<string | null>(null);

  return (
    <UIProvider>
      <ExpensesProvider repository={repository} getUserId={() => userIdRef.current}>
        <AuthExpensesWiring supabase={supabase} repository={repository} userIdRef={userIdRef}>
          <InnerProviders>
            {children}
          </InnerProviders>
        </AuthExpensesWiring>
      </ExpensesProvider>
    </UIProvider>
  );
}

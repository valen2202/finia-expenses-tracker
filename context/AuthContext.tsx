'use client';

import { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { Expense } from '@/types/expense';
import { loadExpenses, persistExpenses } from '@/lib/storage';
import { IExpenseRepository } from '@/services/IExpenseRepository';

// S — Single Responsibility: este contexto solo maneja autenticación
// y el flujo de importación de datos locales.
export interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  pendingImport: boolean;
  importLocalData: () => Promise<void>;
  dismissImport: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
  supabase: SupabaseClient;
  repository: IExpenseRepository;
  // userId se pasa junto con los gastos para que AppProvider actualice el userIdRef
  onExpensesLoaded: (expenses: Expense[], userId: string | null) => void;
  onAuthReady: () => void;
}

export function AuthProvider({ children, supabase, repository, onExpensesLoaded, onAuthReady }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingImport, setPendingImport] = useState(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const expenses = await repository.fetchAll(currentUser.id);
          onExpensesLoaded(expenses, currentUser.id);
          persistExpenses(expenses);

          if (event === 'SIGNED_IN' && expenses.length === 0) {
            const localData = loadExpenses();
            if (localData.length > 0) setPendingImport(true);
          }
        } else {
          onExpensesLoaded(loadExpenses(), null);
        }

        onAuthReady();
      },
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPendingImport(false);
    onExpensesLoaded([], null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const importLocalData = useCallback(async () => {
    const cu = userRef.current;
    if (!cu) return;
    const localData = loadExpenses();
    if (!localData.length) { setPendingImport(false); return; }
    await repository.upsertMany(localData, cu.id);
    onExpensesLoaded(localData, cu.id);
    setPendingImport(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  const dismissImport = useCallback(() => setPendingImport(false), []);

  return (
    <AuthContext.Provider value={{ user, signOut, pendingImport, importLocalData, dismissImport }}>
      {children}
    </AuthContext.Provider>
  );
}

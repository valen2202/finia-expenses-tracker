'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { Expense, ExpenseFormData, ExpenseFilter, Category } from '@/types/expense';
import { ChatMessage } from '@/types/chat';
import { loadExpenses, persistExpenses } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { parse } from '@/lib/nlp';
import { generateBotResponse, WELCOME_MESSAGE, getMotivationalGreeting } from '@/lib/bot';
import { exportToCSV } from '@/lib/export';
import { createClient } from '@/lib/supabase';

// ─── Chat persistence ─────────────────────────────────────────────────────────

const CHAT_KEY = 'gastos_chat_v1';

function loadChat(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistChat(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-80)));
  } catch {}
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

function buildSampleExpenses(): Expense[] {
  const now = new Date();
  const samples = [
    { description: 'Supermercado Día', category: 'Comida', amount: 8500, days: 1 },
    { description: 'Netflix', category: 'Entretenimiento', amount: 2199, days: 3 },
    { description: 'Carga SUBE', category: 'Transporte', amount: 3000, days: 3 },
    { description: 'Zapatillas Nike', category: 'Compras', amount: 45000, days: 5 },
    { description: 'Servicio eléctrico', category: 'Facturas', amount: 14200, days: 7 },
    { description: 'Almuerzo', category: 'Comida', amount: 5800, days: 8 },
    { description: 'Carga nafta', category: 'Transporte', amount: 21000, days: 10 },
    { description: 'Cine', category: 'Entretenimiento', amount: 7200, days: 12 },
    { description: 'Internet', category: 'Facturas', amount: 8900, days: 14 },
    { description: 'Ropa invierno', category: 'Compras', amount: 32000, days: 16 },
    { description: 'Delivery', category: 'Comida', amount: 4100, days: 18 },
    { description: 'Gas natural', category: 'Facturas', amount: 9500, days: 20 },
    { description: 'Mercado Libre', category: 'Compras', amount: 18500, days: 22 },
    { description: 'Uber', category: 'Transporte', amount: 3800, days: 23 },
    { description: 'Spotify', category: 'Entretenimiento', amount: 1599, days: 25 },
    { description: 'Farmacia', category: 'Otro', amount: 7800, days: 28 },
    { description: 'Teléfono Claro', category: 'Facturas', amount: 12000, days: 32 },
    { description: 'Verdulería', category: 'Comida', amount: 3200, days: 35 },
    { description: 'Colectivo', category: 'Transporte', amount: 2400, days: 40 },
    { description: 'Heladería', category: 'Comida', amount: 1800, days: 42 },
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

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AppContextType {
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
  user: User | null;
  signOut: () => Promise<void>;
  pendingImport: boolean;
  importLocalData: () => Promise<void>;
  dismissImport: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isCloudHubOpen, setIsCloudHubOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingImport, setPendingImport] = useState(false);

  const openCloudHub = useCallback(() => setIsCloudHubOpen(true), []);
  const closeCloudHub = useCallback(() => setIsCloudHubOpen(false), []);

  const supabase = useMemo(() => createClient(), []);

  const expensesRef = useRef<Expense[]>([]);
  const userRef = useRef<User | null>(null);

  useEffect(() => { expensesRef.current = expenses; }, [expenses]);
  useEffect(() => { userRef.current = user; }, [user]);

  // ─── Auth + initial load ────────────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

          if (!error && data) {
            const mapped: Expense[] = data.map((row) => ({
              id: row.id,
              date: row.date,
              amount: Number(row.amount),
              category: row.category as Category,
              description: row.description,
              createdAt: row.created_at,
              updatedAt: row.updated_at ?? undefined,
            }));
            setExpenses(mapped);
            persistExpenses(mapped);

            if (event === 'SIGNED_IN' && mapped.length === 0) {
              const localData = loadExpenses();
              if (localData.length > 0) setPendingImport(true);
            }
          }
        } else {
          setExpenses(loadExpenses());
        }

        const storedChat = loadChat();
        if (storedChat.length > 0) {
          setMessages([
            ...storedChat,
            {
              id: generateId(),
              role: 'bot',
              content: getMotivationalGreeting(loadExpenses()),
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages([{
            id: generateId(),
            role: 'bot',
            content: WELCOME_MESSAGE,
            timestamp: new Date().toISOString(),
          }]);
        }

        setIsLoaded(true);
      },
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Expense helpers ────────────────────────────────────────────────────────

  const sortAndSave = (list: Expense[]) => {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    persistExpenses(sorted);
    return sorted;
  };

  const addExpense = useCallback((data: ExpenseFormData): Expense => {
    const newExpense: Expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setExpenses((prev) => sortAndSave([...prev, newExpense]));

    const cu = userRef.current;
    if (cu) {
      supabase.from('expenses').insert({
        id: newExpense.id, user_id: cu.id, date: newExpense.date,
        amount: newExpense.amount, category: newExpense.category,
        description: newExpense.description, created_at: newExpense.createdAt,
      }).then(({ error }) => { if (error) console.error('insert:', error.message); });
    }
    return newExpense;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateExpense = useCallback((id: string, data: ExpenseFormData) => {
    const updatedAt = new Date().toISOString();
    setExpenses((prev) => sortAndSave(prev.map((e) => (e.id === id ? { ...e, ...data, updatedAt } : e))));

    const cu = userRef.current;
    if (cu) {
      supabase.from('expenses').update({
        date: data.date, amount: data.amount, category: data.category,
        description: data.description, updated_at: updatedAt,
      }).eq('id', id).eq('user_id', cu.id)
        .then(({ error }) => { if (error) console.error('update:', error.message); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => { const u = prev.filter((e) => e.id !== id); persistExpenses(u); return u; });

    const cu = userRef.current;
    if (cu) {
      supabase.from('expenses').delete().eq('id', id).eq('user_id', cu.id)
        .then(({ error }) => { if (error) console.error('delete:', error.message); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredExpenses = useCallback(
    (filter: ExpenseFilter): Expense[] =>
      expenses.filter((e) => {
        if (filter.dateFrom && e.date < filter.dateFrom) return false;
        if (filter.dateTo && e.date > filter.dateTo) return false;
        if (filter.category !== 'Todas' && e.category !== filter.category) return false;
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase();
          if (!e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q))
            return false;
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
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
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
    setExpenses(samples);
    persistExpenses(samples);
    const cu = userRef.current;
    if (cu) {
      supabase.from('expenses').upsert(
        samples.map((e) => ({ id: e.id, user_id: cu.id, date: e.date, amount: e.amount, category: e.category, description: e.description, created_at: e.createdAt })),
        { onConflict: 'id' },
      ).then(({ error }) => { if (error) console.error('sample upsert:', error.message); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auth ───────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setExpenses([]);
    setPendingImport(false);
  }, [supabase]);

  const importLocalData = useCallback(async () => {
    const cu = userRef.current;
    if (!cu) return;
    const localData = loadExpenses();
    if (!localData.length) { setPendingImport(false); return; }
    const { error } = await supabase.from('expenses').upsert(
      localData.map((e) => ({ id: e.id, user_id: cu.id, date: e.date, amount: e.amount, category: e.category, description: e.description, created_at: e.createdAt, updated_at: e.updatedAt ?? null })),
      { onConflict: 'id' },
    );
    if (!error) { setExpenses(localData); setPendingImport(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissImport = useCallback(() => setPendingImport(false), []);

  // ─── Chat ───────────────────────────────────────────────────────────────────

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => { const updated = [...prev, msg]; persistChat(updated); return updated; });
  };

  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    pushMessage({ id: generateId(), role: 'user', content: text.trim(), timestamp: new Date().toISOString() });
    setIsTyping(true);

    const command = parse(text);
    let addedExpense: Expense | undefined;
    let deletedExpense: Expense | undefined;

    switch (command.type) {
      case 'expense':
        if (command.expense) {
          addedExpense = { ...command.expense, id: generateId(), createdAt: new Date().toISOString() };
          setExpenses((prev) => sortAndSave([...prev, addedExpense!]));
          const cu = userRef.current;
          if (cu) {
            supabase.from('expenses').insert({
              id: addedExpense.id, user_id: cu.id, date: addedExpense.date,
              amount: addedExpense.amount, category: addedExpense.category,
              description: addedExpense.description, created_at: addedExpense.createdAt,
            }).then(({ error }) => { if (error) console.error('chat insert:', error.message); });
          }
        }
        break;

      case 'delete-last':
        deletedExpense = expensesRef.current[0];
        if (deletedExpense) {
          const id = deletedExpense.id;
          setExpenses((prev) => { const u = prev.filter((e) => e.id !== id); persistExpenses(u); return u; });
          const cu = userRef.current;
          if (cu) {
            supabase.from('expenses').delete().eq('id', id).eq('user_id', cu.id)
              .then(({ error }) => { if (error) console.error('chat delete:', error.message); });
          }
        }
        break;

      case 'export':
        exportToCSV(expensesRef.current);
        break;
    }

    await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));

    pushMessage({
      id: generateId(), role: 'bot',
      content: generateBotResponse(command, addedExpense ? [...expensesRef.current, addedExpense] : expensesRef.current, addedExpense, deletedExpense),
      timestamp: new Date().toISOString(),
    });
    setIsTyping(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping]);

  const clearChat = useCallback(() => {
    const welcome: ChatMessage = { id: generateId(), role: 'bot', content: WELCOME_MESSAGE, timestamp: new Date().toISOString() };
    setMessages([welcome]);
    persistChat([welcome]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        expenses, isLoaded,
        addExpense, updateExpense, deleteExpense,
        getFilteredExpenses, getTotalAmount, getCurrentMonthTotal,
        getMonthlyAverage, getCategoryTotals, getTopCategory,
        getMonthlyData, loadSampleData,
        messages, isTyping, handleUserInput, clearChat,
        isCloudHubOpen, openCloudHub, closeCloudHub,
        user, signOut, pendingImport, importLocalData, dismissImport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

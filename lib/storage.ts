import { Expense } from '@/types/expense';
import { ChatMessage } from '@/types/chat';

const STORAGE_KEY = 'gastos_tracker_v1';
const CHAT_KEY = 'gastos_chat_v1';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

export function persistExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    console.error('No se pudo guardar en localStorage');
  }
}

export function loadChat(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistChat(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-80)));
  } catch {}
}

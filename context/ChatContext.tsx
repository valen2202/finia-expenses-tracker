'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Expense, ExpenseFormData } from '@/types/expense';
import { ChatMessage } from '@/types/chat';
import { loadChat, persistChat } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { parse } from '@/lib/nlp';
import { generateBotResponse, WELCOME_MESSAGE, getMotivationalGreeting } from '@/lib/bot';
import { exportToCSV } from '@/lib/export';

// S — Single Responsibility: este contexto solo maneja el chat y
// el dispatch de comandos NLP. No sabe nada de gastos ni de auth.
// I — Interface Segregation: los callbacks inyectados permiten que
// ChatContext no dependa directamente de ExpensesContext.
export interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  handleUserInput: (text: string) => Promise<void>;
  clearChat: () => void;
  initChat: (expenses: Expense[]) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

interface ChatProviderProps {
  children: ReactNode;
  // Callbacks inyectados por AppProvider para cruzar el límite con ExpensesContext
  onAddExpense: (data: ExpenseFormData) => Expense;
  onDeleteLastExpense: () => Expense | undefined;
  getExpenses: () => Expense[];
}

export function ChatProvider({ children, onAddExpense, onDeleteLastExpense, getExpenses }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: generateId(),
    role: 'bot',
    content: WELCOME_MESSAGE,
    timestamp: new Date().toISOString(),
  }]);
  const [isTyping, setIsTyping] = useState(false);

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => { const updated = [...prev, msg]; persistChat(updated); return updated; });
  };

  const initChat = useCallback((expenses: Expense[]) => {
    const stored = loadChat();
    if (stored.length > 0) {
      setMessages([
        ...stored,
        { id: generateId(), role: 'bot', content: getMotivationalGreeting(expenses), timestamp: new Date().toISOString() },
      ]);
    } else {
      setMessages([{ id: generateId(), role: 'bot', content: WELCOME_MESSAGE, timestamp: new Date().toISOString() }]);
    }
  }, []);

  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    pushMessage({ id: generateId(), role: 'user', content: text.trim(), timestamp: new Date().toISOString() });
    setIsTyping(true);

    const command = parse(text);
    let addedExpense: Expense | undefined;
    let deletedExpense: Expense | undefined;

    switch (command.type) {
      case 'expense':
        if (command.expense) addedExpense = onAddExpense(command.expense);
        break;
      case 'delete-last':
        deletedExpense = onDeleteLastExpense();
        break;
      case 'export':
        exportToCSV(getExpenses());
        break;
    }

    await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));

    const currentExpenses = getExpenses();
    pushMessage({
      id: generateId(),
      role: 'bot',
      content: generateBotResponse(
        command,
        addedExpense ? [...currentExpenses, addedExpense] : currentExpenses,
        addedExpense,
        deletedExpense,
      ),
      timestamp: new Date().toISOString(),
    });
    setIsTyping(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping, onAddExpense, onDeleteLastExpense, getExpenses]);

  const clearChat = useCallback(() => {
    const welcome: ChatMessage = { id: generateId(), role: 'bot', content: WELCOME_MESSAGE, timestamp: new Date().toISOString() };
    setMessages([welcome]);
    persistChat([welcome]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isTyping, handleUserInput, clearChat, initChat }}>
      {children}
    </ChatContext.Provider>
  );
}

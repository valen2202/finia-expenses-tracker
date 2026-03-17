'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ChatWindow() {
  const { messages, isTyping, handleUserInput, clearChat, expenses, getCurrentMonthTotal } =
    useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const monthTotal = getCurrentMonthTotal();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden md:rounded-2xl md:shadow-md md:border md:border-gray-100 dark:md:border-gray-800">
      {/* Header — gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white text-xs font-bold tracking-wide">IA</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">FinIA</p>
            <p className="text-indigo-200 text-xs font-medium">
              {isTyping ? '· escribiendo...' : '· asistente financiero'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-indigo-200 text-xs">mes actual</p>
            <p className="text-white font-bold text-sm tabular-nums">
              {formatCurrency(monthTotal)}
            </p>
          </div>
          <div className="w-px h-8 bg-white/20 hidden sm:block" />
          <div className="text-right sm:hidden">
            <p className="text-indigo-200 text-xs tabular-nums">{formatCurrency(monthTotal)}</p>
          </div>
          <button
            onClick={clearChat}
            title="Limpiar chat"
            className="p-2 hover:bg-white/15 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth bg-slate-50/70 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
        <QuickActions onSelect={handleUserInput} disabled={isTyping} />
        <ChatInput onSend={handleUserInput} disabled={isTyping} />
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-0.5">
          {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado
          {expenses.length !== 1 ? 's' : ''} · datos en la nube
        </p>
      </div>
    </div>
  );
}

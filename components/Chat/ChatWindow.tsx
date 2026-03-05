'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';
import { Trash2 } from 'lucide-react';

export default function ChatWindow() {
  const { messages, isTyping, handleUserInput, clearChat, expenses } = useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">IA</span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">FinIA</p>
            <p className="text-xs text-emerald-500 font-medium">
              {isTyping ? 'Escribiendo...' : 'En línea'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearChat}
            title="Limpiar chat"
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-2.5">
        <QuickActions onSelect={handleUserInput} disabled={isTyping} />
        <ChatInput onSend={handleUserInput} disabled={isTyping} />
        <p className="text-center text-xs text-gray-400">
          Escribí en lenguaje natural · los datos se guardan localmente
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mic } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const PLACEHOLDERS = [
  'Escibí un gasto... ej: pizza $800',
  'Ej: taxi 1500 ayer',
  'Ej: netflix 2100',
  'Ej: super 8.500 el lunes',
  'Ej: ¿cuánto gasté este mes?',
  'Ej: resumen del mes',
];

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [phIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <button
        type="button"
        className="p-1.5 text-gray-300 hover:text-indigo-400 transition-colors flex-shrink-0"
        title="Voz (próximamente)"
        tabIndex={-1}
      >
        <Mic className="w-4 h-4" />
      </button>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={PLACEHOLDERS[phIdx]}
        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
        autoComplete="off"
        autoFocus
      />

      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-xl transition-all flex-shrink-0 active:scale-95"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

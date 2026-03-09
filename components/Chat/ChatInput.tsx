'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const PLACEHOLDERS = [
  'Ej: pizza $800 ayer',
  'Ej: taxi 1500',
  'Ej: netflix 2100',
  'Ej: super 8500 el lunes',
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
    <div className="flex items-center gap-2.5 bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-200">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={PLACEHOLDERS[phIdx]}
        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed min-w-0"
        autoComplete="off"
        autoFocus
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-gray-200 disabled:to-gray-200 text-white rounded-xl transition-all flex-shrink-0 active:scale-95 shadow-sm disabled:shadow-none"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { calcStreak, formatCurrency } from '@/lib/utils';
import { Send, Flame, Sun, Moon, ChevronDown, Sparkles, Trash2 } from 'lucide-react';

// ─── Rich Text Renderer ───────────────────────────────────────────────────────

function RichText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part === '\n') return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator({ dateStr }: { dateStr: string }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let label = dateStr;
  if (dateStr === fmt(today)) label = 'Hoy';
  else if (dateStr === fmt(yesterday)) label = 'Ayer';

  return (
    <div className="flex items-center gap-3 my-3 px-2">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';
  const isConfirmation = message.content.startsWith('✅');
  const time = new Date(message.timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5 px-4">
        <div className="max-w-[82%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2.5 rounded-[20px] rounded-tr-[6px] text-sm leading-relaxed shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/30">
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 pr-1">{time}</span>
      </div>
    );
  }

  if (isConfirmation) {
    return (
      <div className="flex items-end gap-2 px-4">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-4 shadow-sm">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="flex flex-col gap-0.5 max-w-[82%]">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 px-4 py-3 rounded-[20px] rounded-tl-[6px] text-sm shadow-sm">
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
              <RichText content={message.content} />
            </p>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-600 pl-1">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-4 shadow-sm">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex flex-col gap-0.5 max-w-[82%]">
        <div className="bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 px-4 py-2.5 rounded-[20px] rounded-tl-[6px] text-sm text-gray-800 dark:text-gray-100 leading-relaxed shadow-sm">
          <RichText content={message.content} />
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 pl-1">{time}</span>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 px-4 py-3 rounded-[20px] rounded-tl-[6px] shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Strip ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { emoji: '📊', label: 'Resumen', command: 'resumen del mes' },
  { emoji: '📋', label: 'Últimos', command: 'últimos gastos' },
  { emoji: '💰', label: 'Total', command: '¿cuánto gasté?' },
  { emoji: '🛒', label: 'Super', command: '¿cuánto en supermercado?' },
  { emoji: '🍽️', label: 'Salidas', command: '¿cuánto en salidas?' },
  { emoji: '❓', label: 'Ayuda', command: 'ayuda' },
];

function QuickStrip({ onSelect, disabled }: { onSelect: (c: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.command}
          onClick={() => onSelect(a.command)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap active:scale-95 disabled:opacity-40 transition-all shadow-sm hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <span>{a.emoji}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileChatView() {
  const {
    messages, isTyping, handleUserInput, clearChat,
    expenses, getCurrentMonthTotal, isDark, toggleDark,
  } = useAppContext();

  const [text, setText] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const monthTotal = getCurrentMonthTotal();
  const streak = calcStreak(expenses);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  // Group messages by date for separators
  const grouped: { date: string; msgs: ChatMessageType[] }[] = [];
  messages.forEach((msg) => {
    const d = msg.timestamp.slice(0, 10);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    handleUserInput(trimmed);
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
    <div className="flex flex-col h-full bg-[#F4F6FB] dark:bg-gray-950 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-700 px-5 pt-4 pb-5 flex-shrink-0 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex items-center justify-between">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/25 backdrop-blur-sm shadow-inner">
                <span className="text-white text-xs font-bold tracking-wide">IA</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">FinIA</p>
              <p className="text-indigo-200 text-[11px] mt-0.5 font-medium">
                {isTyping ? '· escribiendo...' : '· asistente financiero'}
              </p>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={clearChat}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative mt-4 flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm border border-white/10">
            <p className="text-indigo-200 text-[10px] font-medium uppercase tracking-wider leading-none">
              Mes actual
            </p>
            <p className="text-white font-bold text-lg leading-tight tabular-nums mt-0.5">
              {formatCurrency(monthTotal)}
            </p>
          </div>

          {streak > 0 && (
            <div className="bg-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <Flame className={`w-4 h-4 ${streak >= 7 ? 'text-orange-300' : 'text-emerald-300'}`} />
              <div>
                <p className="text-indigo-200 text-[10px] font-medium uppercase tracking-wider leading-none">
                  Racha
                </p>
                <p className="text-white font-bold text-lg leading-tight tabular-nums mt-0.5">
                  {streak}d
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-2 scroll-smooth"
      >
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <DateSeparator dateStr={date} />
            <div className="space-y-2">
              {msgs.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        ))}
        {isTyping && <TypingBubble />}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-36 right-5 w-9 h-9 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 active:scale-95 transition-all z-10"
        >
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#F4F6FB] dark:bg-gray-950 border-t border-gray-200/60 dark:border-gray-800/60 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        {/* Quick actions */}
        <QuickStrip onSelect={handleUserInput} disabled={isTyping} />

        {/* Input row */}
        <div className="flex items-center gap-2.5 px-4 pb-1">
          <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-[24px] px-4 py-2.5 shadow-sm focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              disabled={isTyping}
              placeholder="Ej: pizza $800, super $5000…"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none disabled:cursor-not-allowed min-w-0"
              autoComplete="off"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!text.trim() || isTyping}
            className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white rounded-full shadow-md shadow-indigo-300/40 dark:shadow-indigo-900/40 disabled:shadow-none transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-700 pb-1 pt-0.5">
          {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} · FinIA v2
        </p>
      </div>
    </div>
  );
}

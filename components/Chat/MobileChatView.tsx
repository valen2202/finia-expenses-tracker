'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { calcStreak, formatCurrency } from '@/lib/utils';
import { Send, Sun, Moon, ChevronDown, Sparkles, Trash2, Zap, Flame } from 'lucide-react';

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
    <div className="flex items-center gap-3 my-2 px-4">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

// ─── Client-only time ─────────────────────────────────────────────────────────

function ClientTime({ timestamp }: { timestamp: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
  }, [timestamp]);
  return <>{time}</>;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';
  const isConfirmation = message.content.startsWith('✅');

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5 px-3">
        <div className="max-w-[78%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2.5 rounded-[20px] rounded-tr-[5px] text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 pr-1">
          <ClientTime timestamp={message.timestamp} />
        </span>
      </div>
    );
  }

  if (isConfirmation) {
    return (
      <div className="flex items-end gap-2 px-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex flex-col gap-0.5 max-w-[78%]">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-4 py-2.5 rounded-[20px] rounded-tl-[5px] text-sm shadow-sm">
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
              <RichText content={message.content} />
            </p>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
            <ClientTime timestamp={message.timestamp} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 px-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-4 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col gap-0.5 max-w-[78%]">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 px-4 py-2.5 rounded-[20px] rounded-tl-[5px] text-sm text-gray-800 dark:text-gray-100 leading-relaxed shadow-sm">
          <RichText content={message.content} />
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
          <ClientTime timestamp={message.timestamp} />
        </span>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 px-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 px-4 py-3 rounded-[20px] rounded-tl-[5px] shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Popup ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { emoji: '📊', label: 'Resumen del mes', command: 'resumen del mes' },
  { emoji: '📋', label: 'Últimos gastos', command: 'últimos gastos' },
  { emoji: '💰', label: '¿Cuánto gasté?', command: '¿cuánto gasté?' },
  { emoji: '🛒', label: 'Supermercado', command: '¿cuánto en supermercado?' },
  { emoji: '🍽️', label: 'Salidas', command: '¿cuánto en salidas?' },
  { emoji: '❓', label: 'Ayuda', command: 'ayuda' },
];

function QuickActionsPopup({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (c: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 px-3 z-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
          Comandos rápidos
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.command}
              disabled={disabled}
              onClick={() => { onSelect(a.command); onClose(); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-sm font-medium active:scale-95 disabled:opacity-40 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 text-left"
            >
              <span className="text-base leading-none">{a.emoji}</span>
              <span className="truncate text-xs">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const monthTotal = getCurrentMonthTotal();
  const streak = calcStreak(expenses);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  // Group messages by date
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
    setShowQuickActions(false);
    handleUserInput(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setShowQuickActions(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#EFEAE4] dark:bg-gray-950 overflow-hidden">

      {/* ── Header (slim, WhatsApp style) ───────────────────────────────── */}
      <div className="flex-shrink-0 bg-indigo-600 dark:bg-indigo-900 px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/25">
              <span className="text-white text-[11px] font-bold">IA</span>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 dark:border-indigo-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-semibold text-sm leading-none">FinIA</p>
              {streak > 0 && (
                <div className="flex items-center gap-0.5 bg-white/15 rounded-full px-1.5 py-0.5">
                  <Flame className={`w-2.5 h-2.5 ${streak >= 7 ? 'text-orange-300' : 'text-emerald-300'}`} />
                  <span className="text-white/90 text-[9px] font-bold">{streak}</span>
                </div>
              )}
            </div>
            <p className="text-indigo-200 dark:text-indigo-300 text-[11px] mt-0.5 leading-none truncate">
              {isTyping ? 'escribiendo...' : formatCurrency(monthTotal) + ' este mes'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 active:scale-90 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={clearChat}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 active:scale-90 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-3 space-y-1.5"
        onClick={() => setShowQuickActions(false)}
      >
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <DateSeparator dateStr={date} />
            <div className="space-y-1.5">
              {msgs.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        ))}
        {isTyping && <TypingBubble />}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-20 right-4 w-8 h-8 bg-white dark:bg-gray-800 shadow-md rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 active:scale-95 z-10"
        >
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 relative bg-[#F0EBE3] dark:bg-gray-900 px-3 pt-2 pb-3">
        {/* Quick actions popup */}
        {showQuickActions && (
          <QuickActionsPopup
            onSelect={handleUserInput}
            onClose={() => setShowQuickActions(false)}
            disabled={isTyping}
          />
        )}

        {/* Input row */}
        <div className="flex items-center gap-2">
          {/* Quick actions trigger */}
          <button
            onClick={() => setShowQuickActions((v) => !v)}
            className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90 ${
              showQuickActions
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-white dark:bg-gray-800 rounded-[22px] px-4 py-2.5 shadow-sm border border-gray-200/60 dark:border-gray-700 focus-within:border-indigo-300 dark:focus-within:border-indigo-600 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setShowQuickActions(false)}
              disabled={isTyping}
              placeholder="Ej: pizza $800, super $5000…"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed min-w-0"
              autoComplete="off"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || isTyping}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white rounded-full shadow-md disabled:shadow-none transition-all active:scale-90 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spacer para el BottomNav fijo — solo en mobile (<sm) */}
      <div
        className="flex-shrink-0 sm:hidden bg-[#F0EBE3] dark:bg-gray-900"
        style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      />
    </div>
  );
}

'use client';

interface QuickAction {
  label: string;
  command: string;
  emoji: string;
}

const ACTIONS: QuickAction[] = [
  { emoji: '📊', label: 'Resumen', command: 'resumen del mes' },
  { emoji: '📋', label: 'Últimos', command: 'últimos gastos' },
  { emoji: '💰', label: 'Total', command: '¿cuánto gasté?' },
  { emoji: '❓', label: 'Ayuda', command: 'ayuda' },
];

interface Props {
  onSelect: (command: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onSelect, disabled }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      {ACTIONS.map((action) => (
        <button
          key={action.command}
          onClick={() => onSelect(action.command)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm active:scale-95"
        >
          <span className="text-sm">{action.emoji}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

'use client';

interface QuickAction {
  label: string;
  command: string;
  emoji: string;
}

const ACTIONS: QuickAction[] = [
  { emoji: '📊', label: 'Resumen', command: 'resumen del mes' },
  { emoji: '📋', label: 'Lista', command: 'últimos gastos' },
  { emoji: '💰', label: 'Total', command: '¿cuánto gasté?' },
  { emoji: '❓', label: 'Ayuda', command: 'ayuda' },
];

interface Props {
  onSelect: (command: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onSelect, disabled }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACTIONS.map((action) => (
        <button
          key={action.command}
          onClick={() => onSelect(action.command)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm active:scale-95"
        >
          <span>{action.emoji}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

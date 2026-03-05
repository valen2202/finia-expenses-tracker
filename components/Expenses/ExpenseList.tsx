'use client';

import { Expense, ExpenseFilter } from '@/types/expense';
import ExpenseItem from './ExpenseItem';
import EmptyState from '@/components/ui/EmptyState';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  filter: ExpenseFilter;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, filter, onEdit, onDelete }: ExpenseListProps) {
  const hasFilters =
    filter.searchQuery || filter.category !== 'Todas' || filter.dateFrom || filter.dateTo;

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-8 h-8" />}
        title={hasFilters ? 'Sin resultados' : 'Sin gastos registrados'}
        description={
          hasFilters
            ? 'Ningún gasto coincide con los filtros seleccionados.'
            : 'Todavía no cargaste ningún gasto. ¡Agregá el primero!'
        }
      />
    );
  }

  // Agrupar por fecha
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {sortedDates.map((date) => {
        const dayExpenses = grouped[date];
        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
        const [y, m, d] = date.split('-').map(Number);
        const displayDate = new Date(y, m - 1, d).toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        return (
          <div key={date} className="border-b border-gray-100 last:border-0">
            {/* Encabezado de fecha */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 capitalize">{displayDate}</span>
              <span className="text-xs font-semibold text-gray-500 tabular-nums">
                {formatCurrency(dayTotal)}
              </span>
            </div>
            {/* Gastos del día */}
            <div className="divide-y divide-gray-50">
              {dayExpenses.map((exp) => (
                <ExpenseItem key={exp.id} expense={exp} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

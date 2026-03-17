'use client';

import { Expense } from '@/types/expense';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  return (
    <div className="flex items-center gap-3 px-3 sm:px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
        <div className="mt-1">
          <Badge category={expense.category} />
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap tabular-nums">
        {formatCurrency(expense.amount)}
      </p>

      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(expense)}
          title="Editar"
          className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          title="Eliminar"
          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

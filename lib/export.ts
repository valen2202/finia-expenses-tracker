import { Expense } from '@/types/expense';
import { formatDate } from './utils';

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];

  const rows = expenses.map((expense) => [
    formatDate(expense.date),
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.category,
    expense.amount.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight, Receipt } from 'lucide-react';

export default function RecentExpenses() {
  const { expenses } = useAppContext();
  const recent = expenses.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Gastos recientes</h3>
        <Link
          href="/historial"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {recent.map((exp) => (
            <div key={exp.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{exp.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge category={exp.category} showEmoji={false} />
                  <span className="text-xs text-gray-400">{formatDate(exp.date)}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {formatCurrency(exp.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useAppContext } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_EMOJIS, CATEGORY_BADGE_CLASSES } from '@/lib/categories';
import { Category } from '@/types/expense';
import MonthlyChart from './MonthlyChart';
import { TrendingUp, Calendar, Tag, Sparkles } from 'lucide-react';

export default function LiveStats() {
  const {
    expenses,
    isLoaded,
    getTotalAmount,
    getCurrentMonthTotal,
    getTopCategory,
    getCategoryTotals,
    loadSampleData,
  } = useAppContext();

  const total = getTotalAmount();
  const monthTotal = getCurrentMonthTotal();
  const topCat = getTopCategory();
  const catTotals = getCategoryTotals();

  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) as [Category, number][];

  const recent = expenses.slice(0, 4);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-700 text-sm">Todavía sin datos</p>
          <p className="text-xs text-gray-500 mt-1">
            Registrá gastos en el chat o cargá datos de ejemplo
          </p>
        </div>
        <button
          onClick={loadSampleData}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Cargar datos de ejemplo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto px-1">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <p className="text-xs text-indigo-600 font-medium">Total</p>
          </div>
          <p className="text-base font-bold text-indigo-800 truncate">{formatCurrency(total)}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs text-blue-600 font-medium">Este mes</p>
          </div>
          <p className="text-base font-bold text-blue-800 truncate">{formatCurrency(monthTotal)}</p>
        </div>
      </div>

      {topCat && (
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-lg">
            {CATEGORY_EMOJIS[topCat]}
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" /> Categoría principal
            </p>
            <p className="text-sm font-bold text-emerald-800">{topCat}</p>
          </div>
        </div>
      )}

      {/* Mini chart */}
      <div>
        <MonthlyChart compact />
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Por categoría
          </p>
          <div className="space-y-2">
            {topCategories.map(([cat, amount]) => {
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_BADGE_CLASSES[cat]}`}
                    >
                      {CATEGORY_EMOJIS[cat]} {cat}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recientes
          </p>
          <div className="space-y-1.5">
            {recent.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{CATEGORY_EMOJIS[exp.category]}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{exp.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(exp.date)}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-700 whitespace-nowrap ml-2 tabular-nums">
                  {formatCurrency(exp.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

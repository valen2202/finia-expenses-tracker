'use client';

import { useAppContext } from '@/context/AppContext';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import MonthlyChart from '@/components/Dashboard/MonthlyChart';
import CategoryChart from '@/components/Dashboard/CategoryChart';
import RecentExpenses from '@/components/Dashboard/RecentExpenses';
import { LayoutDashboard, Sparkles, Cloud, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/categories';
import { Expense } from '@/types/expense';

function InsightsSummary({ expenses }: { expenses: Expense[] }) {
  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === now.getFullYear() && m === now.getMonth() + 1;
  });
  const prevMonth = expenses.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return y === prev.getFullYear() && m === prev.getMonth() + 1;
  });

  const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const prevTotal = prevMonth.reduce((s, e) => s + e.amount, 0);
  const pct = prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : null;
  const isUp = pct !== null && pct > 0;

  // Top 3 categories this month
  const catTotals: Record<string, number> = {};
  thisMonth.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxCat = sorted[0]?.[1] || 1;

  if (thisTotal === 0 && prevTotal === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 ring-2 ring-gray-50 dark:ring-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Tendencias</h3>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Month vs previous */}
        <div className="flex items-center gap-3 min-w-max">
          <div className={`rounded-xl p-2.5 ${isUp ? 'bg-red-50' : 'bg-emerald-50'}`}>
            {isUp
              ? <TrendingUp className="w-5 h-5 text-red-500" />
              : <TrendingDown className="w-5 h-5 text-emerald-600" />
            }
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Mes vs anterior</p>
            {pct !== null
              ? <p className={`text-lg font-bold ${isUp ? 'text-red-500' : 'text-emerald-600'}`}>
                  {isUp ? '+' : ''}{pct.toFixed(0)}%
                </p>
              : <p className="text-lg font-bold text-gray-400">Sin datos</p>
            }
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-gray-100" />

        {/* Top categories */}
        {sorted.length > 0 && (
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Top categorías este mes</p>
            {sorted.map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-base w-5 text-center">
                  {CATEGORY_EMOJIS[cat as keyof typeof CATEGORY_EMOJIS] ?? '📦'}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 w-24 truncate">{cat}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(amount / maxCat) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#6B7280',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-20 text-right">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { expenses, isLoaded, loadSampleData, getCurrentMonthTotal, getMonthlyAverage, openCloudHub } =
    useAppContext();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Todavía sin datos</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Registrá tus primeros gastos en el chat de FinIA o cargá datos de ejemplo para ver el dashboard.
          </p>
        </div>
        <button
          onClick={loadSampleData}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Cargar datos de ejemplo
        </button>
      </div>
    );
  }

  const monthTotal = getCurrentMonthTotal();
  const avg = getMonthlyAverage();
  const vsAvg = avg > 0 ? ((monthTotal - avg) / avg) * 100 : 0;
  const vsAvgLabel = vsAvg >= 0
    ? `+${vsAvg.toFixed(0)}% vs promedio`
    : `${vsAvg.toFixed(0)}% vs promedio`;
  const vsAvgColor = vsAvg <= 0 ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado{expenses.length !== 1 ? 's' : ''}
              {monthTotal > 0 && (
                <>
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span className="font-medium text-gray-700">{formatCurrency(monthTotal)} este mes</span>
                  {avg > 0 && (
                    <span className={`ml-2 text-xs font-semibold ${vsAvgColor}`}>{vsAvgLabel}</span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={openCloudHub}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium hover:from-indigo-100 hover:to-purple-100 transition-all shadow-sm"
        >
          <Cloud className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Summary cards */}
      <SummaryCards />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyChart />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart />
        </div>
      </div>

      {/* Insights */}
      <InsightsSummary expenses={expenses} />

      {/* Recent expenses */}
      <RecentExpenses />
    </div>
  );
}

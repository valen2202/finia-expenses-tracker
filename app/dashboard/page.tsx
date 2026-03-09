'use client';

import { useAppContext } from '@/context/AppContext';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import MonthlyChart from '@/components/Dashboard/MonthlyChart';
import CategoryChart from '@/components/Dashboard/CategoryChart';
import RecentExpenses from '@/components/Dashboard/RecentExpenses';
import { LayoutDashboard, Sparkles, Cloud } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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

      {/* Recent expenses */}
      <RecentExpenses />
    </div>
  );
}

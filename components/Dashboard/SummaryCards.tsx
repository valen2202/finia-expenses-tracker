'use client';

import { useAppContext } from '@/context/AppContext';
import { formatCurrency, calcStreak } from '@/lib/utils';
import { CATEGORY_EMOJIS } from '@/lib/categories';
import { TrendingUp, Calendar, BarChart2, Tag, Flame } from 'lucide-react';

export default function SummaryCards() {
  const { expenses, getTotalAmount, getCurrentMonthTotal, getMonthlyAverage, getTopCategory } =
    useAppContext();

  const total = getTotalAmount();
  const monthTotal = getCurrentMonthTotal();
  const average = getMonthlyAverage();
  const topCat = getTopCategory();
  const streak = calcStreak(expenses);

  const cards = [
    {
      label: 'Total acumulado',
      value: formatCurrency(total),
      icon: TrendingUp,
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      ring: 'ring-indigo-100',
    },
    {
      label: 'Mes actual',
      value: formatCurrency(monthTotal),
      icon: Calendar,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      ring: 'ring-blue-100',
    },
    {
      label: 'Promedio mensual',
      value: formatCurrency(average),
      icon: BarChart2,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      ring: 'ring-violet-100',
    },
    {
      label: 'Categoría principal',
      value: topCat ? `${CATEGORY_EMOJIS[topCat]} ${topCat}` : '—',
      icon: Tag,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      ring: 'ring-emerald-100',
    },
    {
      label: 'Racha',
      value: streak > 0 ? `${streak} día${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}` : 'Sin racha',
      icon: Flame,
      bg: streak >= 7 ? 'bg-orange-50' : 'bg-emerald-50',
      iconColor: streak >= 7 ? 'text-orange-500' : 'text-emerald-600',
      ring: streak >= 7 ? 'ring-orange-100' : 'ring-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, bg, iconColor, ring }) => (
        <div
          key={label}
          className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-5 flex items-start gap-3 ring-2 ${ring} hover:shadow-md transition-shadow`}
        >
          <div className={`${bg} rounded-xl p-2 sm:p-2.5 flex-shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-indigo-600">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

interface Props {
  compact?: boolean;
}

export default function MonthlyChart({ compact = false }: Props) {
  const { getMonthlyData } = useAppContext();
  const data = getMonthlyData();
  const hasData = data.some((d) => d.total > 0);
  const height = compact ? 130 : 220;

  const chart = hasData ? (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: compact ? 10 : 12, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        {!compact && (
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EEF2FF', radius: 4 }} />
        <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={compact ? 32 : 52} />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center" style={{ height }}>
      <p className="text-sm text-gray-400">Sin datos</p>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Últimos 6 meses
        </p>
        {chart}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Gastos mensuales</h3>
      <p className="text-xs text-gray-400 mb-6">Últimos 6 meses</p>
      {chart}
    </div>
  );
}

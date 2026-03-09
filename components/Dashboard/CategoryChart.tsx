'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { CATEGORY_COLORS } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';
import { Category } from '@/types/expense';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold mb-1" style={{ color: p.fill }}>
        {name}
      </p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(value)}</p>
      <p className="text-xs text-gray-400">{p.percent}%</p>
    </div>
  );
}

export default function CategoryChart() {
  const { getCategoryTotals } = useAppContext();
  const totals = getCategoryTotals();
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  const data = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([cat, value]) => ({
      name: cat,
      value,
      fill: CATEGORY_COLORS[cat as Category],
      percent: grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Por categoría</h3>
      <p className="text-xs text-gray-400 mb-4">Distribución del gasto</p>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-gray-400">Sin datos de categorías</p>
        </div>
      )}
    </div>
  );
}

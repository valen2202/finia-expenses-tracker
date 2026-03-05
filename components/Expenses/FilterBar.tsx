'use client';

import { ExpenseFilter, Category } from '@/types/expense';
import { CATEGORIES } from '@/lib/categories';
import { getCurrentDateString } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  filter: ExpenseFilter;
  onChange: (f: ExpenseFilter) => void;
  onReset: () => void;
}

export default function FilterBar({ filter, onChange, onReset }: FilterBarProps) {
  const hasActive =
    filter.searchQuery || filter.category !== 'Todas' || filter.dateFrom || filter.dateTo;

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por descripción o categoría..."
          value={filter.searchQuery}
          onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        />
      </div>

      {/* Fila de filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={filter.dateFrom}
            max={filter.dateTo || getCurrentDateString()}
            onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={filter.dateTo}
            min={filter.dateFrom}
            max={getCurrentDateString()}
            onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <select
            value={filter.category}
            onChange={(e) =>
              onChange({ ...filter, category: e.target.value as Category | 'Todas' })
            }
            className={inputClass}
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActive && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

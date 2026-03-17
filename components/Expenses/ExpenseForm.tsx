'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseFormData } from '@/types/expense';
import { CATEGORIES, CATEGORY_EMOJIS } from '@/lib/categories';
import { getCurrentDateString } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
}

interface FormErrors {
  description?: string;
  amount?: string;
  date?: string;
}

const BLANK: ExpenseFormData = {
  description: '',
  amount: 0,
  date: getCurrentDateString(),
  category: 'Salidas',
};

export default function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(BLANK);
  const [amountStr, setAmountStr] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (expense) {
      setForm({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      });
      setAmountStr(String(expense.amount));
    } else {
      setForm({ ...BLANK, date: getCurrentDateString() });
      setAmountStr('');
    }
    setErrors({});
  }, [expense]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.description.trim() || form.description.trim().length < 2)
      e.description = 'Mínimo 2 caracteres';
    const parsed = parseFloat(amountStr);
    if (!amountStr || isNaN(parsed) || parsed <= 0)
      e.amount = 'Ingresá un monto válido mayor a $0';
    if (!form.date) e.date = 'La fecha es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: parseFloat(amountStr) });
  };

  const fieldClass = (field: keyof FormErrors) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:ring-red-200'
        : 'border-gray-200 bg-white focus:ring-indigo-200 focus:border-indigo-400'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
        <input
          type="text"
          placeholder="Ej: Supermercado, Netflix, Taxi..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className={fieldClass('description')}
          maxLength={100}
          autoFocus
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto ($)</label>
        <input
          type="number"
          placeholder="0.00"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          className={fieldClass('amount')}
          min="0.01"
          step="0.01"
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.amount}
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className={fieldClass('date')}
          max={getCurrentDateString()}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.date}
          </p>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: cat }))}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                form.category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{CATEGORY_EMOJIS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
        >
          {expense ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </form>
  );
}

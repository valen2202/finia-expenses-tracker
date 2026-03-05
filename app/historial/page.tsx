'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Expense, ExpenseFormData, ExpenseFilter } from '@/types/expense';
import FilterBar from '@/components/Expenses/FilterBar';
import ExpenseList from '@/components/Expenses/ExpenseList';
import ExpenseForm from '@/components/Expenses/ExpenseForm';
import Modal from '@/components/ui/Modal';
import { ToastContainer, ToastData } from '@/components/ui/Toast';
import { exportToCSV } from '@/lib/export';
import { formatCurrency } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { Plus, Download, AlertTriangle, History } from 'lucide-react';

const DEFAULT_FILTER: ExpenseFilter = {
  dateFrom: '',
  dateTo: '',
  category: 'Todas',
  searchQuery: '',
};

export default function HistorialPage() {
  const { addExpense, updateExpense, deleteExpense, getFilteredExpenses, isLoaded, expenses } =
    useAppContext();

  const [filter, setFilter] = useState<ExpenseFilter>(DEFAULT_FILTER);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const filteredExpenses = getFilteredExpenses(filter);
  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleOpenAdd = () => {
    setEditingExpense(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
      showToast('Gasto actualizado correctamente');
    } else {
      addExpense(data);
      showToast('Gasto agregado correctamente');
    }
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  const handleDeleteRequest = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (exp) setDeleteTarget(exp);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteExpense(deleteTarget.id);
    showToast('Gasto eliminado');
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const toExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    exportToCSV(toExport);
    showToast(`Se exportaron ${toExport.length} gastos a CSV`);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredExpenses.length}{' '}
                {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
                {filteredTotal > 0 && (
                  <span className="font-medium text-gray-700">
                    {' '}· Total: {formatCurrency(filteredTotal)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {expenses.length > 0 && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo gasto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <FilterBar filter={filter} onChange={setFilter} onReset={() => setFilter(DEFAULT_FILTER)} />

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-[200px]">
          <ExpenseList
            expenses={filteredExpenses}
            filter={filter}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      {/* Modal agregar / editar */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
      >
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">¿Eliminar este gasto?</p>
              {deleteTarget && (
                <p className="text-sm text-red-600 mt-1">
                  <strong>{deleteTarget.description}</strong> —{' '}
                  {formatCurrency(deleteTarget.amount)}
                </p>
              )}
              <p className="text-xs text-red-500 mt-1">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Notificaciones */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </>
  );
}

export type Category =
  | 'Supermercado'
  | 'Salidas'
  | 'Transporte'
  | 'Entretenimiento'
  | 'Compras'
  | 'Facturas'
  | 'Otro';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface ExpenseFilter {
  dateFrom: string;
  dateTo: string;
  category: Category | 'Todas';
  searchQuery: string;
}

import { Category } from '@/types/expense';

export const CATEGORIES: Category[] = [
  'Supermercado',
  'Salidas',
  'Transporte',
  'Entretenimiento',
  'Compras',
  'Facturas',
  'Otro',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Supermercado: '#10B981',
  Salidas: '#F97316',
  Transporte: '#3B82F6',
  Entretenimiento: '#8B5CF6',
  Compras: '#EC4899',
  Facturas: '#EF4444',
  Otro: '#6B7280',
};

export const CATEGORY_BADGE_CLASSES: Record<Category, string> = {
  Supermercado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Salidas: 'bg-orange-100 text-orange-700 border-orange-200',
  Transporte: 'bg-blue-100 text-blue-700 border-blue-200',
  Entretenimiento: 'bg-purple-100 text-purple-700 border-purple-200',
  Compras: 'bg-pink-100 text-pink-700 border-pink-200',
  Facturas: 'bg-red-100 text-red-700 border-red-200',
  Otro: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  Supermercado: '🛒',
  Salidas: '🍽️',
  Transporte: '🚗',
  Entretenimiento: '🎬',
  Compras: '🛍️',
  Facturas: '📄',
  Otro: '📦',
};

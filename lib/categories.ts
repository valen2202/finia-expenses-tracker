import { Category } from '@/types/expense';

export const CATEGORIES: Category[] = [
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Compras',
  'Facturas',
  'Otro',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Comida: '#F97316',
  Transporte: '#3B82F6',
  Entretenimiento: '#8B5CF6',
  Compras: '#EC4899',
  Facturas: '#EF4444',
  Otro: '#6B7280',
};

export const CATEGORY_BADGE_CLASSES: Record<Category, string> = {
  Comida: 'bg-orange-100 text-orange-700 border-orange-200',
  Transporte: 'bg-blue-100 text-blue-700 border-blue-200',
  Entretenimiento: 'bg-purple-100 text-purple-700 border-purple-200',
  Compras: 'bg-pink-100 text-pink-700 border-pink-200',
  Facturas: 'bg-red-100 text-red-700 border-red-200',
  Otro: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  Comida: '🍽️',
  Transporte: '🚗',
  Entretenimiento: '🎬',
  Compras: '🛍️',
  Facturas: '📄',
  Otro: '📦',
};

import { Category } from '@/types/expense';
import { getCurrentDateString } from './utils';

// ─── Keyword Maps ────────────────────────────────────────────────────────────

const KEYWORDS: Record<Category, string[]> = {
  Comida: [
    'pizza', 'comida', 'almuerzo', 'cena', 'desayuno', 'super', 'supermercado',
    'mercado', 'restaurant', 'restau', 'mcdo', 'burger', 'delivery', 'rappi',
    'pedidos', 'kiosco', 'heladeria', 'panaderia', 'verduleria', 'sushi',
    'empanada', 'cafe', 'cafeteria', 'asado', 'parrilla', 'medialunas',
    'sandwi', 'choripan', 'milanesa', 'facturia', 'facturas', 'dia', 'coto',
    'carrefour', 'disco', 'jumbo', 'wallmart', 'cheto',
  ],
  Transporte: [
    'taxi', 'uber', 'nafta', 'sube', 'colectivo', 'subte', 'tren',
    'combustible', 'remis', 'cabify', 'peaje', 'estacionamiento', 'moto',
    'bicicleta', 'viaje', 'pasaje', 'boleto', 'transporte', 'micropista',
  ],
  Entretenimiento: [
    'netflix', 'spotify', 'cine', 'disney', 'youtube', 'prime', 'juego',
    'steam', 'teatro', 'concierto', 'evento', 'boliche', 'casino',
    'playstation', 'xbox', 'twitch', 'hbo', 'paramount', 'musica', 'show',
    'fiesta', 'pelicula',
  ],
  Compras: [
    'ropa', 'zapatillas', 'zapatos', 'vestido', 'pantalon', 'remera',
    'amazon', 'mercadolibre', 'zara', 'falabella', 'shopping', 'electro',
    'celular', 'notebook', 'computadora', 'tablet', 'auricular', 'libro',
    'perfume', 'maquillaje', 'shampoo', 'campera', 'medias', 'remerita',
  ],
  Facturas: [
    'luz', 'gas', 'internet', 'telefono', 'agua', 'seguro', 'alquiler',
    'expensas', 'cable', 'claro', 'personal', 'movistar', 'directv',
    'impuesto', 'cuota', 'abono', 'suscripcion', 'servicio', 'prepago',
  ],
  Otro: [],
};

const GREETING_WORDS = ['hola', 'buenas', 'hey', 'hi', 'buendia', 'saludos'];
const HELP_WORDS = ['ayuda', 'help', 'comandos', 'comofunciona', 'quepuedo', 'instrucciones'];
const DELETE_WORDS = ['borrar', 'eliminar', 'deshacer', 'borrarultimo', 'eliminarultimo'];
const LIST_WORDS = ['lista', 'ultimos', 'recientes', 'mostrargastos', 'vergastos', 'misgas'];
const TOTAL_WORDS = ['cuantogaste', 'total', 'cuantollevo', 'gastototal', 'gastosesta'];
const SUMMARY_WORDS = ['resumen', 'estadistica', 'reporte', 'informe', 'analisis', 'stats', 'resumendel'];
const EXPORT_WORDS = ['exportar', 'descargar', 'export', 'csv', 'excel', 'bajar'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function includes(input: string, words: string[]): boolean {
  const n = norm(input);
  return words.some((w) => n.includes(norm(w)));
}

export function detectCategory(text: string): Category {
  const n = norm(text);
  for (const [cat, keywords] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    if (cat === 'Otro') continue;
    if (keywords.some((kw) => n.includes(norm(kw)))) return cat;
  }
  return 'Otro';
}

function extractAmount(text: string): { amount: number; raw: string } | null {
  // Match: $1.500,50 | 1500,50 | 1.500 | $800 | 800 pesos | 800$
  const pattern =
    /(?:\$\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:pesos?|ars|\$)?/gi;

  let best: { amount: number; raw: string } | null = null;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    const raw = m[0].trim();
    let numStr = m[1];

    // Determine format: Argentine (1.500,50) or standard (1,500.50 or just 1500.50)
    if (numStr.includes('.') && numStr.includes(',')) {
      const dotPos = numStr.indexOf('.');
      const commaPos = numStr.indexOf(',');
      if (dotPos < commaPos) {
        // dot = thousands, comma = decimal → Argentine
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else {
        numStr = numStr.replace(/,/g, '').replace('.', '.');
      }
    } else if (numStr.includes('.')) {
      const afterDot = numStr.split('.').pop()!;
      if (afterDot.length === 3) numStr = numStr.replace(/\./g, ''); // thousands
    } else if (numStr.includes(',')) {
      const afterComma = numStr.split(',').pop()!;
      if (afterComma.length === 3) numStr = numStr.replace(/,/g, ''); // thousands
      else numStr = numStr.replace(',', '.');
    }

    const amount = parseFloat(numStr);
    if (!isNaN(amount) && amount > 0 && amount < 100_000_000) {
      if (!best || amount > best.amount) best = { amount, raw };
    }
  }

  return best;
}

function extractDate(text: string): string {
  const n = norm(text);
  const today = new Date();

  if (n.includes('ayer')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (n.includes('anteayer')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }

  const DAY_NAMES: [string, number][] = [
    ['lunes', 1], ['martes', 2], ['miercoles', 3], ['jueves', 4],
    ['viernes', 5], ['sabado', 6], ['domingo', 0],
  ];
  for (const [day, dayNum] of DAY_NAMES) {
    if (n.includes(norm(day))) {
      const d = new Date(today);
      const diff = ((today.getDay() - dayNum + 7) % 7) || 7;
      d.setDate(d.getDate() - diff);
      return d.toISOString().split('T')[0];
    }
  }

  return getCurrentDateString();
}

function buildDescription(text: string, amountRaw: string): string {
  const DATE_NOISE =
    /\b(hoy|ayer|anteayer|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi;
  const UNIT_NOISE = /\b(pesos?|ars)\b/gi;

  let desc = text
    .replace(amountRaw, '')
    .replace(DATE_NOISE, '')
    .replace(UNIT_NOISE, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!desc) desc = 'Gasto';
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

// ─── Command Types ────────────────────────────────────────────────────────────

export interface ParsedExpense {
  amount: number;
  description: string;
  category: Category;
  date: string;
}

export type CommandType =
  | 'expense'
  | 'query-total'
  | 'query-category'
  | 'query-summary'
  | 'delete-last'
  | 'list'
  | 'export'
  | 'help'
  | 'greeting'
  | 'unknown';

export interface ParsedCommand {
  type: CommandType;
  expense?: ParsedExpense;
  category?: Category;
  raw?: string;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export function parse(input: string): ParsedCommand {
  const text = input.trim();
  if (!text) return { type: 'unknown' };

  if (includes(text, GREETING_WORDS)) return { type: 'greeting' };
  if (includes(text, HELP_WORDS)) return { type: 'help' };
  if (includes(text, DELETE_WORDS)) return { type: 'delete-last' };
  if (includes(text, EXPORT_WORDS)) return { type: 'export' };
  if (includes(text, LIST_WORDS)) return { type: 'list' };
  if (includes(text, SUMMARY_WORDS)) return { type: 'query-summary' };

  if (includes(text, TOTAL_WORDS)) {
    for (const cat of Object.keys(KEYWORDS) as Category[]) {
      if (norm(text).includes(norm(cat))) return { type: 'query-category', category: cat };
    }
    return { type: 'query-total' };
  }

  // Try to parse as expense
  const amountResult = extractAmount(text);
  if (amountResult) {
    return {
      type: 'expense',
      expense: {
        amount: amountResult.amount,
        description: buildDescription(text, amountResult.raw),
        category: detectCategory(text),
        date: extractDate(text),
      },
    };
  }

  return { type: 'unknown', raw: text };
}

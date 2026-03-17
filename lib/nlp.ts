import { Category } from '@/types/expense';
import { getCurrentDateString } from './utils';

// ─── Keyword Maps ────────────────────────────────────────────────────────────

const KEYWORDS: Record<Category, string[]> = {
  Supermercado: [
    'super', 'supermercado', 'mercado', 'verduleria', 'panaderia',
    'almacen', 'kiosco', 'dia', 'coto', 'carrefour', 'disco', 'jumbo', 'wallmart',
  ],
  Salidas: [
    'pizza', 'comida', 'almuerzo', 'cena', 'desayuno', 'restaurant', 'restau',
    'mcdo', 'burger', 'delivery', 'rappi', 'pedidos', 'heladeria', 'sushi',
    'empanada', 'cafe', 'cafeteria', 'asado', 'parrilla', 'medialunas',
    'sandwi', 'choripan', 'milanesa', 'cheto', 'facturia', 'facturas',
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

// ─── Preprocessing ────────────────────────────────────────────────────────────

/**
 * "3 medialunas a $400" → returns text with "$1200" replacing the pattern
 * Returns { text, multiplied } where multiplied = true if substitution happened
 */
function preprocessQuantityPrice(text: string): { text: string; multiplied: boolean } {
  // Pattern: (number) (word) a $price  OR  (number) x $price
  const re = /(\d+)\s+(\w+)\s+a\s+\$?\s*([\d.,]+)/i;
  const m = text.match(re);
  if (!m) return { text, multiplied: false };

  const qty = parseInt(m[1], 10);
  const priceRaw = m[3];

  // Parse price
  let numStr = priceRaw;
  if (numStr.includes('.') && numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  } else if (numStr.includes('.')) {
    const afterDot = numStr.split('.').pop()!;
    if (afterDot.length === 3) numStr = numStr.replace(/\./g, '');
  } else if (numStr.includes(',')) {
    const afterComma = numStr.split(',').pop()!;
    if (afterComma.length === 3) numStr = numStr.replace(/,/g, '');
    else numStr = numStr.replace(',', '.');
  }
  const price = parseFloat(numStr);
  if (isNaN(price) || price <= 0) return { text, multiplied: false };

  const total = qty * price;
  const replaced = text.replace(m[0], `${m[2]} $${total}`);
  return { text: replaced, multiplied: true };
}

/**
 * "dividí la cena de $12000 con 2 personas" → { text without division clause, splitCount: 3 }
 * "compartí pizza $9000 entre 3" → splitCount: 3
 */
function preprocessSplit(text: string): { text: string; splitCount: number | null } {
  // "con N" → split between N+1 people
  const reCon = /(divid[ií]|compart[ií])[^$\d]*(?:\$[\d.,]+)?[^$\d]*con\s+(\d+)/i;
  const mCon = text.match(reCon);
  if (mCon) {
    const n = parseInt(mCon[2], 10);
    const cleaned = text.replace(mCon[1], '').replace(/con\s+\d+\s*\w*/i, '').trim();
    return { text: cleaned, splitCount: n + 1 };
  }

  // "entre N" → split between N people
  const reEntre = /(divid[ií]|compart[ií])[^$\d]*(?:\$[\d.,]+)?[^$\d]*entre\s+(\d+)/i;
  const mEntre = text.match(reEntre);
  if (mEntre) {
    const n = parseInt(mEntre[2], 10);
    const cleaned = text.replace(mEntre[1], '').replace(/entre\s+\d+\s*\w*/i, '').trim();
    return { text: cleaned, splitCount: n };
  }

  return { text, splitCount: null };
}

// ─── Date Extraction ──────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function extractDate(text: string): string {
  const n = norm(text);
  const today = new Date();

  if (n.includes('ayer')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return toDateString(d);
  }
  if (n.includes('anteayer')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return toDateString(d);
  }
  if (n.includes('semanapasada')) {
    // Monday of last week
    const d = new Date(today);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon..7=Sun
    d.setDate(d.getDate() - dayOfWeek - 6); // go to last Monday
    return toDateString(d);
  }
  if (n.includes('mespasado') || n.includes('elmes')) {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return toDateString(d);
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
      return toDateString(d);
    }
  }

  return getCurrentDateString();
}

function extractDateRange(text: string): { dateFrom: string; dateTo: string } | null {
  const n = norm(text);
  const today = new Date();

  if (n.includes('estasemana') || n.includes('estasem')) {
    const d = new Date(today);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek + 1);
    return { dateFrom: toDateString(monday), dateTo: toDateString(today) };
  }
  if (n.includes('semanapasada')) {
    const d = new Date(today);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
    const lastMonday = new Date(d);
    lastMonday.setDate(d.getDate() - dayOfWeek - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return { dateFrom: toDateString(lastMonday), dateTo: toDateString(lastSunday) };
  }
  if (n.includes('estemes') || n.includes('estemes')) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: toDateString(from), dateTo: toDateString(today) };
  }
  if (n.includes('mespasado')) {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return { dateFrom: toDateString(from), dateTo: toDateString(to) };
  }

  return null;
}

function buildDescription(text: string, amountRaw: string): string {
  const DATE_NOISE =
    /\b(hoy|ayer|anteayer|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|semana\s+pasada|esta\s+semana|el\s+mes\s+pasado)\b/gi;
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
  | 'query-category-range'
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
  dateFrom?: string;
  dateTo?: string;
  splitCount?: number;
  splitTotal?: number;
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
    const range = extractDateRange(text);
    for (const cat of Object.keys(KEYWORDS) as Category[]) {
      if (norm(text).includes(norm(cat))) {
        if (range) {
          return { type: 'query-category-range', category: cat, dateFrom: range.dateFrom, dateTo: range.dateTo };
        }
        return { type: 'query-category', category: cat };
      }
    }
    return { type: 'query-total' };
  }

  // Preprocessing: quantity × price
  const { text: qpText } = preprocessQuantityPrice(text);

  // Preprocessing: split expense
  const { text: processedText, splitCount } = preprocessSplit(qpText);

  // Try to parse as expense
  const amountResult = extractAmount(processedText);
  if (amountResult) {
    let finalAmount = amountResult.amount;
    let splitTotal: number | undefined;

    if (splitCount && splitCount > 1) {
      splitTotal = finalAmount;
      finalAmount = Math.round(finalAmount / splitCount);
    }

    return {
      type: 'expense',
      expense: {
        amount: finalAmount,
        description: buildDescription(processedText, amountResult.raw),
        category: detectCategory(text), // use original text for category detection
        date: extractDate(text),
      },
      ...(splitCount && splitCount > 1 ? { splitCount, splitTotal } : {}),
    };
  }

  return { type: 'unknown', raw: text };
}

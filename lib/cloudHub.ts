import { Expense } from '@/types/expense';
import { formatDate, formatCurrency } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportRecord {
  id: string;
  templateName: string;
  format: 'CSV' | 'JSON' | 'PDF';
  timestamp: string;
  recordCount: number;
  fileSizeKB: number;
}

export interface IntegrationStatus {
  googleSheets: boolean;
  dropbox: boolean;
  onedrive: boolean;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  destination: 'email' | 'googleSheets' | 'dropbox';
  email: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'CSV' | 'JSON' | 'PDF';
  icon: string;
  accent: string;
  filterFn: (expenses: Expense[]) => Expense[];
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATES: ExportTemplate[] = [
  {
    id: 'fiscal',
    name: 'Reporte Fiscal',
    description: 'Gastos del año agrupados por categoría. Ideal para AFIP.',
    format: 'CSV',
    icon: '🧾',
    accent: 'border-blue-200 bg-blue-50',
    filterFn: (expenses) => {
      const year = new Date().getFullYear();
      return expenses.filter((e) => e.date.startsWith(String(year)));
    },
  },
  {
    id: 'monthly',
    name: 'Resumen Mensual',
    description: 'Balance detallado del mes actual con todos los movimientos.',
    format: 'PDF',
    icon: '📊',
    accent: 'border-purple-200 bg-purple-50',
    filterFn: (expenses) => {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return expenses.filter((e) => e.date.startsWith(prefix));
    },
  },
  {
    id: 'categories',
    name: 'Análisis por Categoría',
    description: 'Desglose porcentual con totales acumulados y comparativas.',
    format: 'CSV',
    icon: '🏷️',
    accent: 'border-emerald-200 bg-emerald-50',
    filterFn: (expenses) =>
      [...expenses].sort((a, b) => a.category.localeCompare(b.category)),
  },
  {
    id: 'weekly',
    name: 'Control Semanal',
    description: 'Gastos de los últimos 7 días para control de presupuesto.',
    format: 'CSV',
    icon: '📅',
    accent: 'border-amber-200 bg-amber-50',
    filterFn: (expenses) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return expenses.filter((e) => e.date >= cutoffStr);
    },
  },
  {
    id: 'accounting',
    name: 'Reporte Contable',
    description: 'Formato JSON estructurado para software contable (Tango, Bejerman).',
    format: 'JSON',
    icon: '💼',
    accent: 'border-gray-200 bg-gray-50',
    filterFn: (expenses) => expenses,
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'finai_export_history_v1';
const INTEGRATIONS_KEY = 'finai_integrations_v1';
const SCHEDULE_KEY = 'finai_schedule_v1';

export function loadHistory(): ExportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(record: Omit<ExportRecord, 'id'>): void {
  const history = loadHistory();
  history.unshift({ ...record, id: Math.random().toString(36).slice(2) });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadIntegrations(): IntegrationStatus {
  const defaults: IntegrationStatus = { googleSheets: false, dropbox: false, onedrive: false };
  if (typeof window === 'undefined') return defaults;
  try {
    return JSON.parse(localStorage.getItem(INTEGRATIONS_KEY) || 'null') ?? defaults;
  } catch {
    return defaults;
  }
}

export function saveIntegrations(s: IntegrationStatus): void {
  localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(s));
}

export function loadSchedule(): ScheduleConfig {
  const defaults: ScheduleConfig = {
    enabled: false,
    frequency: 'weekly',
    time: '09:00',
    destination: 'email',
    email: '',
  };
  if (typeof window === 'undefined') return defaults;
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || 'null') ?? defaults;
  } catch {
    return defaults;
  }
}

export function saveSchedule(s: ScheduleConfig): void {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));
}

// ─── Export Engines ───────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function runTemplateExport(
  template: ExportTemplate,
  expenses: Expense[],
): { sizeKB: number } {
  const filtered = template.filterFn(expenses);
  const slug = template.id + '_' + new Date().toISOString().split('T')[0];

  if (template.format === 'CSV') {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];
    const rows = filtered.map((e) => [
      formatDate(e.date),
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount.toFixed(2),
    ]);
    const content = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${slug}.csv`);
    return { sizeKB: Math.max(1, Math.round(content.length / 1024)) };
  }

  if (template.format === 'JSON') {
    const data = {
      exportedAt: new Date().toISOString(),
      template: template.name,
      totalRecords: filtered.length,
      totalAmount: filtered.reduce((s, e) => s + e.amount, 0),
      expenses: filtered.map((e) => ({
        fecha: e.date,
        descripcion: e.description,
        categoria: e.category,
        monto: e.amount,
      })),
    };
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    triggerDownload(blob, `${slug}.json`);
    return { sizeKB: Math.max(1, Math.round(content.length / 1024)) };
  }

  // PDF via print window
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const rows = filtered
    .map(
      (e) => `<tr>
      <td>${formatDate(e.date)}</td><td>${e.description}</td>
      <td>${e.category}</td><td class="amt">${formatCurrency(e.amount)}</td>
    </tr>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${slug}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#111;font-size:12px}
.hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #4f46e5;padding-bottom:12px;margin-bottom:20px}
.logo{font-size:22px;font-weight:800;color:#4f46e5}.sub{font-size:11px;color:#888;text-align:right}
.tmpl{font-size:14px;font-weight:600;color:#374151;margin-bottom:14px}
table{width:100%;border-collapse:collapse}th{background:#4f46e5;color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
td{padding:8px 12px;border-bottom:1px solid #eee}.amt{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
th:last-child{text-align:right}tr:nth-child(even)td{background:#f8f8ff}
.ftr{display:flex;justify-content:space-between;padding-top:12px;margin-top:16px;border-top:2px solid #e5e7eb;font-size:13px}
.ftr-total{font-weight:700;color:#4f46e5;font-size:15px}</style></head>
<body><div class="hdr"><div class="logo">FinIA</div><div class="sub"><div>${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</div><div>${slug}</div></div></div>
<div class="tmpl">${template.name}</div>
<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th style="text-align:right">Monto</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="ftr"><span>${filtered.length} registros</span><span class="ftr-total">Total: ${formatCurrency(total)}</span></div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  return { sizeKB: Math.max(1, Math.round(html.length / 1024)) };
}

// ─── Share Link Generator ─────────────────────────────────────────────────────

export function generateShareLink(expenseCount: number, total: number): string {
  const payload = btoa(`${expenseCount}|${Math.round(total)}|${Date.now()}`).slice(0, 10);
  return `https://finia.app/s/${payload}`;
}

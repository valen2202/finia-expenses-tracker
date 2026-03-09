'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Category } from '@/types/expense';
import {
  TEMPLATES,
  loadHistory, addToHistory, clearHistory,
  loadIntegrations, saveIntegrations,
  loadSchedule, saveSchedule,
  runTemplateExport, generateShareLink,
  exportCSV, exportJSON, exportPDF,
  ExportRecord, IntegrationStatus, ScheduleConfig,
} from '@/lib/cloudHub';
import {
  X, Cloud, FileText, FileJson, Printer, Clock, Share2, Zap,
  Mail, CheckCircle2, RefreshCw, Copy, Check,
  Bell, Download, Trash2, Loader2,
  Table, HardDrive, Link, SlidersHorizontal,
  ExternalLink, ChevronDown,
} from 'lucide-react';

type Tab = 'templates' | 'custom' | 'integrations' | 'schedule' | 'history' | 'share';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'templates', label: 'Plantillas', icon: Zap },
  { id: 'custom', label: 'Personalizado', icon: SlidersHorizontal },
  { id: 'integrations', label: 'Integraciones', icon: Cloud },
  { id: 'schedule', label: 'Programar', icon: Bell },
  { id: 'history', label: 'Historial', icon: Clock },
  { id: 'share', label: 'Compartir', icon: Share2 },
];

const ALL_CATEGORIES: Category[] = [
  'Comida', 'Transporte', 'Entretenimiento', 'Compras', 'Facturas', 'Otro',
];

type ExportFormat = 'CSV' | 'JSON' | 'PDF';

const FORMAT_OPTIONS: { id: ExportFormat; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'CSV', label: 'CSV', icon: FileText, desc: 'Excel / Google Sheets' },
  { id: 'JSON', label: 'JSON', icon: FileJson, desc: 'Developers / APIs' },
  { id: 'PDF', label: 'PDF', icon: Printer, desc: 'Imprimir / Archivar' },
];

interface Props { onClose: () => void }

export default function CloudHubDrawer({ onClose }: Props) {
  const { expenses, getTotalAmount } = useAppContext();
  const [tab, setTab] = useState<Tab>('templates');
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus>({ googleSheets: false, dropbox: false, onedrive: false });
  const [schedule, setSchedule] = useState<ScheduleConfig>({ enabled: false, frequency: 'weekly', time: '09:00', destination: 'email', email: '' });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareExpiry, setShareExpiry] = useState<'1d' | '7d' | '30d' | 'never'>('7d');

  // ── Custom export state ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [customFormat, setCustomFormat] = useState<ExportFormat>('CSV');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState(today);
  const [customCats, setCustomCats] = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [customFilename, setCustomFilename] = useState(`gastos_${today}`);
  const [customExporting, setCustomExporting] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setIntegrations(loadIntegrations());
    setSchedule(loadSchedule());
  }, []);

  const customFiltered = useMemo(
    () =>
      expenses.filter((e) => {
        if (customDateFrom && e.date < customDateFrom) return false;
        if (customDateTo && e.date > customDateTo) return false;
        if (!customCats.has(e.category)) return false;
        return true;
      }),
    [expenses, customDateFrom, customDateTo, customCats],
  );

  const customTotal = customFiltered.reduce((s, e) => s + e.amount, 0);
  const customPreview = customFiltered.slice(0, 5);
  const customRemaining = customFiltered.length - customPreview.length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExportTemplate = async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template || exportingId) return;
    setExportingId(templateId);
    await new Promise((r) => setTimeout(r, 800));
    const filtered = template.filterFn(expenses);
    const { sizeKB } = runTemplateExport(template, expenses);
    addToHistory({
      templateName: template.name,
      format: template.format,
      timestamp: new Date().toISOString(),
      recordCount: filtered.length,
      fileSizeKB: sizeKB,
    });
    setHistory(loadHistory());
    setExportingId(null);
  };

  const handleCustomExport = async () => {
    if (customFiltered.length === 0 || customExporting) return;
    setCustomExporting(true);
    await new Promise((r) => setTimeout(r, 700));
    let sizeKB = 0;
    if (customFormat === 'CSV') ({ sizeKB } = exportCSV(customFiltered, customFilename));
    else if (customFormat === 'JSON') ({ sizeKB } = exportJSON(customFiltered, customFilename, 'Exportación personalizada'));
    else ({ sizeKB } = exportPDF(customFiltered, customFilename, 'Exportación personalizada'));
    addToHistory({
      templateName: 'Personalizado',
      format: customFormat,
      timestamp: new Date().toISOString(),
      recordCount: customFiltered.length,
      fileSizeKB: sizeKB,
    });
    setHistory(loadHistory());
    setCustomExporting(false);
  };

  const toggleCustomCat = (cat: Category) => {
    setCustomCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAllCats = () => {
    setCustomCats(
      customCats.size === ALL_CATEGORIES.length ? new Set() : new Set(ALL_CATEGORIES),
    );
  };

  const handleConnect = async (service: keyof IntegrationStatus) => {
    setConnecting(service);
    await new Promise((r) => setTimeout(r, 1800));
    const updated = { ...integrations, [service]: !integrations[service] };
    setIntegrations(updated);
    saveIntegrations(updated);
    setConnecting(null);
  };

  const handleScheduleChange = (patch: Partial<ScheduleConfig>) => {
    const updated = { ...schedule, ...patch };
    setSchedule(updated);
    saveSchedule(updated);
  };

  const shareUrl = generateShareLink(expenses.length, getTotalAmount());

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}&color=4f46e5&bgcolor=ffffff&margin=8`;

  // ── Render tabs ─────────────────────────────────────────────────────────────

  const renderTemplates = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Plantillas pre-configuradas listas para exportar con un click.
      </p>
      {TEMPLATES.map((tpl) => {
        const filtered = tpl.filterFn(expenses);
        const isExporting = exportingId === tpl.id;
        return (
          <div key={tpl.id} className={`border rounded-xl p-4 ${tpl.accent}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl leading-none mt-0.5">{tpl.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{tpl.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/60 text-gray-600 border border-gray-200">
                      {tpl.format}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{filtered.length} registros disponibles</p>
                </div>
              </div>
              <button
                onClick={() => handleExportTemplate(tpl.id)}
                disabled={!!exportingId || filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? 'Exportando…' : 'Exportar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCustom = () => (
    <div className="space-y-5">
      {/* Format selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Formato
        </p>
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setCustomFormat(id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                customFormat === id
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${customFormat === id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className={`text-xs font-bold ${customFormat === id ? 'text-indigo-700' : 'text-gray-700'}`}>
                {label}
              </p>
              <p className="text-[10px] text-gray-400 text-center leading-tight">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Rango de fechas
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Desde</label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Hasta</label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categorías</p>
          <button
            onClick={toggleAllCats}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {customCats.size === ALL_CATEGORIES.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCustomCat(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                customCats.has(cat)
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preview table */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Vista previa
          {customFiltered.length > 0 && (
            <span className="ml-2 normal-case font-normal text-gray-400">
              — {customPreview.length} de {customFiltered.length}
            </span>
          )}
        </p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Fecha</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Descripción</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">Monto</th>
              </tr>
            </thead>
            <tbody>
              {customPreview.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">
                    Ningún registro coincide con los filtros
                  </td>
                </tr>
              ) : (
                customPreview.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-[130px] truncate">{exp.description}</td>
                    <td className="px-3 py-2 text-gray-900 font-semibold text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {customRemaining > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <ChevronDown className="w-3 h-3" />
              {customRemaining} registro{customRemaining !== 1 ? 's' : ''} más
            </div>
          )}
        </div>
      </div>

      {/* Filename */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          Nombre del archivo
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            placeholder="nombre_archivo"
          />
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2.5 py-2 rounded-xl border border-gray-200 flex-shrink-0">
            .{customFormat.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Footer summary + export button */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span className="font-bold text-gray-900">{customFiltered.length}</span> registro{customFiltered.length !== 1 ? 's' : ''}
          {customFiltered.length > 0 && (
            <>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-bold text-gray-900">{formatCurrency(customTotal)}</span>
            </>
          )}
        </div>
        <button
          onClick={handleCustomExport}
          disabled={customFiltered.length === 0 || customExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {customExporting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exportando…</>
          ) : (
            <><Download className="w-3.5 h-3.5" />Exportar {customFormat}</>
          )}
        </button>
      </div>
    </div>
  );

  const renderIntegrations = () => {
    const services = [
      { key: 'googleSheets' as const, name: 'Google Sheets', icon: Table, desc: 'Sincronizá automáticamente con una hoja de cálculo en Drive.', color: 'text-green-600' },
      { key: 'dropbox' as const, name: 'Dropbox', icon: HardDrive, desc: 'Guardá backups automáticos en tu Dropbox personal.', color: 'text-blue-600' },
      { key: 'onedrive' as const, name: 'OneDrive', icon: Cloud, desc: 'Sincronizá con Microsoft OneDrive y accedé desde cualquier dispositivo.', color: 'text-sky-600' },
    ];
    return (
      <div className="space-y-4">
        {/* Email section */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <p className="text-xs text-gray-500">Recibí resúmenes directamente en tu correo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              value={schedule.email}
              onChange={(e) => handleScheduleChange({ email: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={() => alert('✉️ Resumen enviado a ' + (schedule.email || 'tu email'))}
              className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>

        {/* Cloud services */}
        {services.map(({ key, name, icon: Icon, desc, color }) => {
          const connected = integrations[key];
          const isConnecting = connecting === key;
          return (
            <div key={key} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      {connected && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Conectado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(key)}
                  disabled={!!connecting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex-shrink-0 ${
                    connected
                      ? 'border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  } disabled:opacity-40`}
                >
                  {isConnecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : connected ? (
                    <RefreshCw className="w-3.5 h-3.5" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  {isConnecting ? 'Conectando…' : connected ? 'Desconectar' : 'Conectar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSchedule = () => {
    const nextExport = () => {
      const now = new Date();
      if (schedule.frequency === 'daily') now.setDate(now.getDate() + 1);
      else if (schedule.frequency === 'weekly') now.setDate(now.getDate() + 7);
      else now.setMonth(now.getMonth() + 1);
      return now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Exportaciones automáticas</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {schedule.enabled ? `Próxima exportación: ${nextExport()}` : 'Configurá exportaciones periódicas'}
            </p>
          </div>
          <button
            onClick={() => handleScheduleChange({ enabled: !schedule.enabled })}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              schedule.enabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {schedule.enabled && (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Frecuencia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleScheduleChange({ frequency: freq })}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      schedule.frequency === freq
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {freq === 'daily' ? 'Diaria' : freq === 'weekly' ? 'Semanal' : 'Mensual'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Hora de envío
              </label>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => handleScheduleChange({ time: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Destino
              </label>
              <div className="space-y-2">
                {[
                  { id: 'email' as const, label: 'Email', icon: Mail, sub: schedule.email || 'Sin configurar' },
                  { id: 'googleSheets' as const, label: 'Google Sheets', icon: Table, sub: integrations.googleSheets ? 'Conectado' : 'No conectado' },
                  { id: 'dropbox' as const, label: 'Dropbox', icon: HardDrive, sub: integrations.dropbox ? 'Conectado' : 'No conectado' },
                ].map(({ id, label, icon: Icon, sub }) => (
                  <button
                    key={id}
                    onClick={() => handleScheduleChange({ destination: id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      schedule.destination === id
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${schedule.destination === id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${schedule.destination === id ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</p>
                      <p className="text-xs text-gray-400 truncate">{sub}</p>
                    </div>
                    {schedule.destination === id && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    const formatColors: Record<string, string> = {
      CSV: 'text-emerald-600 bg-emerald-50',
      JSON: 'text-blue-600 bg-blue-50',
      PDF: 'text-red-600 bg-red-50',
    };
    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Sin historial todavía</p>
          <p className="text-xs text-gray-400 mt-1">Las exportaciones que hagas aparecerán acá</p>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">{history.length} exportación{history.length !== 1 ? 'es' : ''}</p>
          <button
            onClick={() => { clearHistory(); setHistory([]); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Limpiar
          </button>
        </div>
        <div className="space-y-2">
          {history.map((record) => {
            const fmtColor = formatColors[record.format] ?? 'text-gray-600 bg-gray-50';
            const date = new Date(record.timestamp);
            const relTime = (() => {
              const diff = Date.now() - date.getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return 'Hace un momento';
              if (mins < 60) return `Hace ${mins} min`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `Hace ${hrs}h`;
              return date.toLocaleDateString('es-AR');
            })();
            return (
              <div key={record.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${fmtColor}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{record.templateName}</p>
                  <p className="text-xs text-gray-400">{relTime} · {record.recordCount} registros · {record.fileSizeKB} KB</p>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {record.format}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderShare = () => (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 leading-relaxed">
        Generá un enlace público para compartir un resumen de tus finanzas. Solo se comparten totales, sin detalles privados.
      </p>

      <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR de enlace compartible"
            width={160}
            height={160}
            className="rounded-xl border border-gray-100 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-w-0">
            <Link className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate font-mono">{shareUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
          Expiración del enlace
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['1d', '7d', '30d', 'never'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setShareExpiry(opt)}
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                shareExpiry === opt
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt === 'never' ? '∞' : opt}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2">Vista previa del resumen público</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-indigo-600">Total gastos</span>
            <span className="font-bold text-indigo-900">{formatCurrency(getTotalAmount())}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-indigo-600">Cantidad de registros</span>
            <span className="font-bold text-indigo-900">{expenses.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-indigo-600">Generado</span>
            <span className="font-bold text-indigo-900">{new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </div>
        <p className="text-[10px] text-indigo-400 mt-3">Los detalles individuales de cada gasto no se comparten.</p>
      </div>
    </div>
  );

  const tabContent: Record<Tab, React.ReactNode> = {
    templates: renderTemplates(),
    custom: renderCustom(),
    integrations: renderIntegrations(),
    schedule: renderSchedule(),
    history: renderHistory(),
    share: renderShare(),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[460px] bg-white h-full flex flex-col shadow-2xl border-l border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">FinIA Cloud Hub</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-xs text-gray-400">{expenses.length} registros · {formatCurrency(getTotalAmount())}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tabContent[tab]}
        </div>
      </div>
    </div>
  );
}

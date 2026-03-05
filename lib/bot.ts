import { Expense, Category } from '@/types/expense';
import { formatCurrency, formatDate } from './utils';
import { ParsedCommand } from './nlp';

const TIPS = [
  '💡 *Tip:* Los gastos hormiga (café, kiosco) suman más de lo que pensás.',
  '💡 *Tip:* Revisá tus suscripciones y cancelá las que no usás.',
  '💡 *Tip:* Separar el 10% de tus ingresos para ahorro puede cambiar tu vida.',
  '💡 *Tip:* Hacé una lista de compras antes de ir al super.',
  '💡 *Tip:* Registrá los gastos el mismo día para no olvidar nada.',
  '💡 *Tip:* Preguntame "resumen" para ver cómo vas este mes.',
];

const ADD_RESPONSES = [
  (d: string, a: string, c: string) =>
    `✅ Listo! Registré **${d}** por **${a}** en ${c}.`,
  (d: string, a: string, c: string) =>
    `✅ Anotado. **${a}** en ${c} — *${d}*.`,
  (d: string, a: string, c: string) =>
    `✅ Guardé **${d}** → **${a}** (${c}).`,
];

function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

function showTip(): boolean {
  return Math.random() > 0.6;
}

// ─── Main Response Generator ──────────────────────────────────────────────────

export function generateBotResponse(
  command: ParsedCommand,
  expenses: Expense[],
  addedExpense?: Expense,
  deletedExpense?: Expense,
): string {
  switch (command.type) {
    case 'greeting':
      return [
        `¡Hola! 👋 Soy **FinIA**, tu asistente financiero personal.`,
        ``,
        `Registrá gastos escribiendo en lenguaje natural:`,
        `• *"pizza $800"*`,
        `• *"taxi 1500 ayer"*`,
        `• *"netflix 2100"*`,
        `• *"super 8.500 el lunes"*`,
        ``,
        `Escribí **ayuda** para ver todo lo que puedo hacer. 🚀`,
      ].join('\n');

    case 'expense':
      if (addedExpense) {
        const idx = Math.floor(Math.random() * ADD_RESPONSES.length);
        const base = ADD_RESPONSES[idx](
          addedExpense.description,
          formatCurrency(addedExpense.amount),
          addedExpense.category,
        );
        return showTip() ? `${base}\n\n${randomTip()}` : base;
      }
      return '❌ No pude registrar el gasto. Probá con: *"descripción $monto"*';

    case 'delete-last':
      if (deletedExpense) {
        return `🗑️ Borré **${deletedExpense.description}** (${formatCurrency(deletedExpense.amount)}).`;
      }
      return '⚠️ No hay gastos para borrar.';

    case 'query-total': {
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const count = expenses.length;
      if (count === 0) return 'Todavía no tenés gastos registrados. ¡Empezá escribiendo uno!';
      return `📊 Total acumulado: **${formatCurrency(total)}** en ${count} registro${count !== 1 ? 's' : ''}.`;
    }

    case 'query-category': {
      const cat = command.category!;
      const catExp = expenses.filter((e) => e.category === cat);
      const catTotal = catExp.reduce((s, e) => s + e.amount, 0);
      if (catExp.length === 0)
        return `No tenés gastos registrados en **${cat}** todavía.`;
      return `📊 En **${cat}** gastaste **${formatCurrency(catTotal)}** (${catExp.length} registro${catExp.length !== 1 ? 's' : ''}).`;
    }

    case 'query-summary': {
      const now = new Date();
      const thisMonth = expenses.filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

      const catTotals: Record<string, number> = {};
      thisMonth.forEach((e) => {
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
      });
      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

      const lines = [
        `📈 **Resumen del mes:**`,
        `• Total gastado: **${formatCurrency(monthTotal)}**`,
        `• Registros: **${thisMonth.length}**`,
      ];

      if (sorted.length > 0) {
        lines.push(`• Mayor categoría: **${sorted[0][0]}** (${formatCurrency(sorted[0][1])})`);
      }
      if (sorted.length > 1) {
        lines.push(`• Le sigue: **${sorted[1][0]}** (${formatCurrency(sorted[1][1])})`);
      }
      if (thisMonth.length === 0) {
        lines.push(`\nEste mes todavía no tenés gastos. ¡Empezá a registrar!`);
      }

      return lines.join('\n');
    }

    case 'list': {
      const recent = expenses.slice(0, 6);
      if (recent.length === 0) return 'No hay gastos registrados todavía.';
      const header = `📋 **Últimos gastos:**\n`;
      const rows = recent
        .map(
          (e, i) =>
            `${i + 1}. *${e.description}* — **${formatCurrency(e.amount)}** (${formatDate(e.date)})`,
        )
        .join('\n');
      return header + rows;
    }

    case 'export':
      return '📥 Exportando a CSV... revisá tu carpeta de Descargas.';

    case 'help':
      return [
        `🤖 **¿Qué puedo hacer?**`,
        ``,
        `**➕ Registrar gastos:**`,
        `• *"pizza $800"*`,
        `• *"taxi 1500 ayer"*`,
        `• *"netflix 2100 el lunes"*`,
        `• *"super 8.500"*`,
        ``,
        `**🔍 Consultas:**`,
        `• *"¿cuánto gasté?"*`,
        `• *"¿cuánto en comida?"*`,
        `• *"resumen del mes"*`,
        `• *"últimos gastos"*`,
        ``,
        `**⚙️ Acciones:**`,
        `• *"borrar último"*`,
        `• *"exportar"*`,
        ``,
        `También podés gestionar todo desde **Historial** ↗️`,
      ].join('\n');

    case 'unknown':
      return [
        `No entendí eso 🤔`,
        ``,
        `Intentá con algo como *"pizza $800"* o escribí **ayuda** para ver los comandos disponibles.`,
      ].join('\n');

    default:
      return 'No sé qué hacer con eso. Escribí **ayuda** para ver los comandos.';
  }
}

// ─── Welcome Message ──────────────────────────────────────────────────────────

export const WELCOME_MESSAGE = [
  `¡Bienvenido a **FinIA**! 🎉`,
  ``,
  `Soy tu asistente financiero personal. Olvidate de los formularios — solo escribime en lenguaje natural:`,
  ``,
  `• *"pizza $800"* → registro automático`,
  `• *"taxi 1500 ayer"* → con fecha`,
  `• *"¿cuánto gasté este mes?"* → estadísticas`,
  `• *"resumen"* → resumen mensual`,
  ``,
  `¿Empezamos? 🚀`,
].join('\n');

export function getMotivationalGreeting(expenses: Expense[]): string {
  const now = new Date();
  const monthExp = expenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  if (monthExp.length === 0) return `¡Hola de nuevo! 👋 Este mes todavía no registraste gastos.`;

  const total = monthExp.reduce((s, e) => s + e.amount, 0);
  return `¡Hola! 👋 Llevás **${formatCurrency(total)}** gastados este mes en ${monthExp.length} registro${monthExp.length !== 1 ? 's' : ''}.`;
}

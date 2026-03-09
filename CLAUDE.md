# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies (required first time)
npm run dev        # Start development server at http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint check
```

## Architecture

**Next.js 14 App Router** with TypeScript and Tailwind CSS. All UI text is in Spanish.

### State management
The app uses 4 focused React Contexts composed inside `context/AppContext.tsx` (Facade pattern):

| Context | Hook | Responsibility |
|---------|------|---------------|
| `context/ExpensesContext.tsx` | `useExpenses()` | Expense CRUD + queries |
| `context/ChatContext.tsx` | `useChat()` | Chat messages + NLP dispatch |
| `context/AuthContext.tsx` | `useAuth()` | Supabase auth + import flow |
| `context/UIContext.tsx` | `useUI()` | Cloud Hub drawer state |

`useAppContext()` is a facade that merges all 4 hooks — use it only in existing components. **New code must use the focused hooks directly.**

The Supabase layer is abstracted behind `services/IExpenseRepository.ts`. The concrete implementation is `services/SupabaseExpenseRepository.ts`. Contexts receive the repository via props (Dependency Inversion).

### Data persistence
`lib/storage.ts` wraps `localStorage` under the key `gastos_tracker_v1`. All reads/writes go through `loadExpenses()` / `persistExpenses()`. Server-side rendering is safe because both functions guard with `typeof window === 'undefined'`.

### Pages
- `/` — Dashboard: summary cards + bar chart (6 months) + donut chart + recent expenses list
- `/gastos` — Full expense list with search/filter, add/edit modal, delete confirmation modal, CSV export and toast notifications

### Key files
| File | Purpose |
|------|---------|
| `types/expense.ts` | `Expense`, `ExpenseFormData`, `ExpenseFilter`, `Category` types |
| `lib/categories.ts` | Category list, Tailwind badge classes, emoji map, hex colors |
| `lib/utils.ts` | `formatCurrency` (ARS locale), `formatDate`, `generateId`, `getCurrentDateString` |
| `lib/export.ts` | `exportToCSV` – triggers browser download |
| `context/ExpensesContext.tsx` | All expense state, CRUD, derived queries, sample data loader |

### Component tree
```
app/layout.tsx
└── ExpensesProvider (context)
    ├── Navigation
    ├── app/page.tsx (Dashboard)
    │   ├── SummaryCards
    │   ├── MonthlyChart (recharts BarChart)
    │   ├── CategoryChart (recharts PieChart)
    │   └── RecentExpenses
    └── app/gastos/page.tsx
        ├── FilterBar
        ├── ExpenseList → ExpenseItem (grouped by date)
        ├── Modal → ExpenseForm (add/edit)
        ├── Modal (delete confirmation)
        └── ToastContainer
```

### Charts
`recharts` is used for both charts. Both chart components are `'use client'` and `recharts` is listed in `transpilePackages` in `next.config.mjs` to avoid SSR issues.

### Config file
Use `next.config.mjs` (not `.ts`) — Next.js 14 does not support TypeScript config files. Next.js 15+ supports `.ts`.

### Date handling
Dates are stored as `YYYY-MM-DD` strings. Always construct `Date` objects as `new Date(year, month-1, day)` (local time) to avoid UTC offset bugs. Never pass a bare ISO string like `new Date('2024-01-15')` for date display.

### Adding a new category
1. Add to `Category` union in `types/expense.ts`
2. Add entries to all four maps in `lib/categories.ts` (colors, badge classes, emojis)

## SOLID Principles — REQUIRED for all new code

Every new file and modification must respect these principles:

| Principle | Rule |
|-----------|------|
| **S** Single Responsibility | Each module/class/function has ONE reason to change. No God objects. |
| **O** Open/Closed | Extend behavior by adding new code, not modifying existing code. Use interfaces and composition. |
| **L** Liskov Substitution | Subtypes must be substitutable for their base types without breaking behavior. |
| **I** Interface Segregation | Consumers only depend on what they use. Prefer small, focused interfaces over large ones. |
| **D** Dependency Inversion | Depend on abstractions (interfaces), not concretions. Inject dependencies via props/constructor. |

### Practical rules
- **New contexts**: must have a single responsibility. Never mix expenses + auth + chat in one context.
- **New services**: must implement an interface (e.g. `IExpenseRepository`). Never import Supabase directly in contexts.
- **New components**: use the focused hook (`useExpenses`, `useChat`, `useAuth`, `useUI`), not `useAppContext`.
- **New lib functions**: must be pure (no side effects unless it's a storage/IO module).
- **No inline persistence**: reads/writes to localStorage always go through `lib/storage.ts`.

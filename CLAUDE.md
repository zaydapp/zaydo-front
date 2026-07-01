# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint on .ts/.tsx files (quiet mode)
npm run tsc          # TypeScript type checking (no emit)
npm run format       # Check and format with Prettier
npm run format:write # Write Prettier formatting
```

No test suite is configured.

## Architecture

**Zaydo** is a multi-tenant SaaS platform for commercial and industrial project management. The frontend connects to a NestJS backend at `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001/api`). There is no database or ORM in this repo — all persistence is on the backend.

### App Router Layout

```
app/
  (auth)/login/          # Public login page
  (dashboard)/           # Protected routes: dashboard, products, inventory,
                         #   clients, suppliers, orders, billing, hr, divers
  (super-admin)/         # Separate admin portal with own auth flow
  impersonate/           # Support impersonation entry point
```

### Key Directories

- `lib/api/index.ts` — All API call functions (single source of truth for every endpoint)
- `lib/api/client.ts` — Axios instance with JWT injection, `X-Tenant-ID` header, 401 refresh logic, and impersonation session handling
- `contexts/` — React context providers stacked in `app/layout.tsx` order: `ThemeProvider → LanguageProvider → QueryProvider → AuthProvider → TenantProvider`
- `types/index.ts` — All shared TypeScript interfaces
- `store/tenantsStore.ts` — Zustand store (super-admin tenant management only)
- `hooks/` — Custom hooks wrapping React Query calls and business logic
- `components/ui/` — shadcn/ui components (new-york style, neutral color, lucide icons)
- `locales/` — i18n translation files consumed by i18next

### State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server state | React Query (TanStack v5) | Cached API data; stale time 1 min, no refetch-on-focus |
| Auth / tenant | React Context | Global, initialized from localStorage / sessionStorage |
| Super-admin tenants | Zustand | Isolated admin store |
| Forms | React Hook Form + Zod | Local form state |

### Multi-Tenancy & Auth

- JWT stored in `localStorage`; impersonated sessions use `sessionStorage` instead
- Axios interceptor automatically attaches `Authorization: Bearer <token>` and `X-Tenant-ID: <id>` to every request
- 401 responses trigger token refresh via `POST /auth/refresh`; on failure, redirects to `/login`
- Super admin has a separate auth context (`contexts/super-admin-auth-context.tsx`) and its own routes

### Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Zaydo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` PostCSS plugin (no `tailwind.config.ts`)
- Global styles in `app/globals.css`
- shadcn/ui components configured in `components.json`
- Path alias `@/*` maps to the project root

### PDF Generation

Invoices are generated client-side using `jsPDF` + `html2canvas` / `html2pdf.js`. Logic lives in invoice-related hooks and components under `components/invoices/` and `hooks/useInvoiceEditor.ts`.

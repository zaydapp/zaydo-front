## Purpose

This file gives concise, project-specific guidance for AI coding agents working on Zaydo (frontend + backend). Focus on discoverable patterns, developer workflows, and files to inspect before edits.

## Big picture

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind. Root layout composes providers: `ThemeProvider`, `LanguageProvider`, `QueryProvider`, `AuthProvider`, `TenantProvider` ([app/layout.tsx](app/layout.tsx)).
- **Backend:** NestJS API serving under `/api` (see [zaydo-back/src/main.ts](../zaydo-back/src/main.ts)). Backend uses Prisma (schema at [zaydo-back/prisma/schema.prisma](../zaydo-back/prisma/schema.prisma)).
- **Data flow:** Frontend calls REST API at `NEXT_PUBLIC_API_BASE_URL` (default documented in README) using `lib/api` helper; server state is managed with TanStack Query (`QueryProvider`).

## Key developer workflows (commands)

- Frontend: `npm install` then `npm run dev` (starts Next on :3000). See `package.json`.
- Backend: in `zaydo-back` run `npm run start:dev` (NestJS watch) — API listens on port 3001 with global prefix `api`.
- Prisma: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run db:seed` in `zaydo-back` (scripts in `package.json`).
- Tests: backend uses Jest (`npm run test` / `test:e2e`).
- Lint/format: `npm run lint` (both projects), Prettier available in backend.

## Project-specific conventions & patterns

- App Router structure: routes are organized under `app/` with route groups like `(auth)` and `(dashboard)`; place pages/components accordingly.
- Providers order matters: `QueryProvider` wraps `AuthProvider` and `TenantProvider` — changing order may break hooks relying on auth/tenant context ([app/layout.tsx](app/layout.tsx)).
- Authentication: tokens and user are stored in `localStorage` for normal sessions and `sessionStorage` for impersonation. Impersonation flag `impersonated` is used in `contexts/auth-context.tsx`.
- Tenant scoping: many backend models are scoped by `tenantId` (see `Order`, `OrderStatus`, `Product` in Prisma). All tenant-aware API calls must include tenant id or use tenant context.
- API client: check `lib/api` for endpoints and axios wrappers. Update both frontend API helpers and backend controllers if changing request/response shapes.
- Forms & validation: `react-hook-form` + `zod` schemas are the standard pattern — keep validation logic close to form components.
- i18n: translations live in `locales/en` and `locales/fr`; initialization in `lib/i18n.ts` (language detection uses `localStorage`).
- TypeScript paths: project uses alias `@/*` (see `tsconfig.json`) — prefer `@/` imports.

## Files to inspect for common change types

- Frontend bootstrap & providers: [app/layout.tsx](app/layout.tsx)
- Auth flow: [contexts/auth-context.tsx](contexts/auth-context.tsx)
- Tenant logic: [contexts/tenant-context.tsx](contexts/tenant-context.tsx)
- API helpers: [lib/api](lib/api)
- UI components: [components/index.ts](components/index.ts)
- i18n: [lib/i18n.ts](lib/i18n.ts) and [locales/](locales/)
- Backend entry & CORS/prefix: [zaydo-back/src/main.ts](../zaydo-back/src/main.ts)
- Prisma schema & models: [zaydo-back/prisma/schema.prisma](../zaydo-back/prisma/schema.prisma)
- Backend scripts & Prisma commands: [zaydo-back/package.json](../zaydo-back/package.json)

## Safety checks & recommended steps before edits

1. Run the dev servers locally: frontend `npm run dev` and backend `zaydo-back` `npm run start:dev`.
2. For API shape changes, update Prisma schema (if DB model change), run `prisma:migrate`, then update backend controllers and frontend `lib/api` types.
3. Preserve auth/tenant storage behavior: changes to `auth-context` must keep `impersonated` semantics.
4. Use `@/` imports and keep providers order when moving components.

## Examples (quick references)

- To find auth restore logic: inspect `contexts/auth-context.tsx` — it reads `sessionStorage` then `localStorage` and sets `user`.
- To add a dashboard page: add folder under `app/(dashboard)/dashboard/` and export server/client components per Next App Router rules.

## Merge guidance

If `.github/copilot-instructions.md` already exists, keep any custom human-written sections and only update the "Files to inspect" and "Workflows" sections to reflect changes. Keep the file concise (20–50 lines).

---

Please review — tell me if you'd like more detail for any of the backend controllers, Prisma relations, or common PR patterns.

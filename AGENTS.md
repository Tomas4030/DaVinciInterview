# AGENTS

## Quick reality check
- Treat this as a **single Next.js 14 app** (App Router), not a monorepo.
- `README.md` is partially stale: it still describes Supabase, but runtime data access is MySQL via `lib/db.ts` + `lib/queries/*`.
- `lib/supabase.ts`, `lib/supabase-server.ts`, and `lib/supabase-admin.ts` are intentional hard-fail deprecations.

## Commands that actually matter
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Production build: `npm run build`
- Start built app: `npm start` (runs `node .next/standalone/server.js`)
- Typecheck (no script exists): `npx tsc --noEmit`

## Validation flow
- Preferred local verification order: `npm run lint` -> `npx tsc --noEmit` -> `npm run build`.
- There is no test script in `package.json`; do not assume unit/integration tests exist.
- `phase1:check` exists in `package.json` but points to `scripts/phase1-isolation-check.js` (missing in repo). Treat as stale unless restored.

## Routing, locale, and URL quirks
- Locale routing is enforced in `middleware.ts`; non-localized paths are redirected to `/${DEFAULT_LOCALE}/...`.
- `DEFAULT_LOCALE` is `en` in `lib/i18n/locales.ts`.
- `/admin/...` is redirected to localized admin routes (`/${locale}/admin/...`); `/super-admin/...` is separate and not localized.
- `NEXT_PUBLIC_BASE_PATH` is normalized by `lib/base-path-utils.js` and applied in both `next.config.js` and middleware. Keep base-path changes consistent across both.
- Dev build output is `.next-dev` (`next.config.js` sets `distDir` in dev). Production output remains `.next`.

## Deployment-specific gotchas
- `deploy.ps1` is the source of truth for packaging: it removes `.next`, `.next-dev`, and `deploy/`, builds production, then copies standalone output into `deploy/`.
- `deploy/` is a generated artifact and is ignored by git; do not hand-edit files there for source changes.
- Root `app.js` is a generated standalone launcher snapshot (contains fixed `/tomas` basePath values). Prefer editing `next.config.js`/source, then rebuilding, instead of editing `app.js` directly.

## High-signal code boundaries
- App routes and API routes: `app/` (notable heavy surface: `app/api/**/route.ts`).
- Data layer: `lib/db.ts` + `lib/queries/*.ts`.
- i18n dictionaries live in `locales/<locale>/*.json`; runtime locale helpers are in `lib/i18n/*`.
- Authentication/session logic is split across `lib/admin-auth*`, `lib/super-admin-auth*`, and related API routes.

## Environment variables you will likely need
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Core URL/base path: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_PATH`.
- AI: `OPENAI_API_KEY`.
- Auth/session secrets: `AUTH_SECRET` (fallbacks use `NEXTAUTH_SECRET` in auth helpers).
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`.
- Optional timeout tuning used across APIs: `DB_CONNECT_TIMEOUT_MS`, `DB_OP_TIMEOUT_MS`.

# Polaris Frontend Architecture

**Status:** Current + target · **Date:** 2026-10-11 · **Repo:** `algo-trader-frontend` (this repo holds the web app only)

This file describes how the frontend is built today and the target shape for the v3 revamp. Where they differ, the target is marked **(v3)**. Product scope lives in `PRD.md`, visual rules in `DESIGN.md`, coding rules in `RULES.md`.

---

## 1. System context

```
 Browser ──HTTPS──▶ Next.js 16 app (Vercel)                     FastAPI backend (separate repo)
   │                  ├─ proxy.ts: Clerk session + strict CSP      ├─ verifies Clerk JWT on every call
   │                  ├─ Server components ── serverGet() ───────▶ ├─ market data (Yahoo, Binance), quant,
   │                  └─ /api/backend/[...path] (BFF) ──────────▶ │  risk, backtests, AI desk (SSE), news
   │                       adds `Authorization: Bearer <Clerk>`    ├─ Neon Postgres (RLS by Clerk user id)
   └──────── Clerk (hosted auth, MFA, sessions)                    └─ broker connectors, read-only (v3)
```

Rules that follow from this:
- **The browser never talks to the backend directly.** `FLINT_API_URL` is server-only. Client code calls `/api/backend/*` through `src/lib/api.ts`.
- **Auth is checked three times:** `(app)/layout.tsx` calls `auth.protect()`, the BFF refuses requests without a session, and the API verifies the token again.
- **No secrets in the browser** except Clerk's publishable key.
- **Broker credentials never touch the frontend (v3).** The connect flow redirects to the backend, which runs the broker's OAuth and stores tokens encrypted. The frontend only starts the flow and shows its status.

---

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router, React 19 | Read `frontend/node_modules/next/dist/docs/` before using an unfamiliar API (see `frontend/AGENTS.md`). |
| Language | TypeScript, `strict: true` | Path alias `@/*` → `src/*` |
| Auth | `@clerk/nextjs` 7 | `clerkMiddleware` in `src/proxy.ts`; themed from tokens in `app/layout.tsx` |
| Styling | Tailwind CSS 3.4 + CSS variables | Tokens in `tailwind.config.js` and `src/app/globals.css`; `cn()` = clsx + tailwind-merge |
| Charts | lightweight-charts 5 | Candles, panes, drawings (`lib/drawings.ts`) |
| Motion | GSAP 3 + `@gsap/react`, Locomotive Scroll 5 | Locomotive and ScrollTrigger on the landing page only |
| Tests | `node:test` via `tsx --test "src/**/*.test.ts"` | Pure logic in `src/lib` |
| Lint | ESLint 9, `eslint-config-next` core-web-vitals + TS | Zero warnings is the bar |
| Hosting | Vercel | `next build`; every page is dynamic so the CSP nonce reaches scripts |

---

## 3. Routes

### 3.1 Current

```
Public
  /                         Landing (brand register)
  /sign-in/[[...]]  /sign-up/[[...]]   Clerk
  /legal/privacy  /legal/terms
Gated (auth.protect)
  /onboarding               First run (base currency, markets, risk, paper balance)
  /(app)/home               Today
  /(app)/markets            Overview · /movers · /ideas · /levels · /screens
  /(app)/s/[symbol]         Symbol: chart, plan, AI desk, backtest, intel
  /(app)/portfolio          Holdings · /activity · /risk · /journal
  /(app)/news
  /(app)/settings
API
  /api/backend/[...path]    BFF proxy to FastAPI
```

### 3.2 Target (v3)

```
/(app)/home                 Market pulse (indices, breadth, sectors, movers, news) + "Your day"
/(app)/markets              Overview · Movers · Ideas · Levels · Screens   (India | US switch)
/(app)/s/[symbol]           Overview · Plan · AI Desk · Backtest · Fundamentals · News
/(app)/portfolio            ?p=<portfolioId|all-real>
    /                       Holdings
    /performance            TWR/XIRR vs benchmark                          (new)
    /allocation             By asset class, sector, currency, account       (new)
    /risk  /activity  /journal
/(app)/watchlists           Named lists                                     (new)
/(app)/watchlists/[id]
/(app)/alerts               Active · Triggered · Paused                     (new)
/(app)/news                 For you · Markets
/(app)/settings             Profile · Security · Brokers (new) · Preferences · Data and privacy
/(app)/settings/brokers/callback   Return URL after broker OAuth             (new)
```

URL is the source of truth for tabs, the selected portfolio, the market (India/US) and table sort, so every view can be deep-linked and the back button works.

---

## 4. Source layout

```
frontend/src/
  app/                    Routes only: page.tsx, layout.tsx, loading.tsx, error.tsx
    (app)/                Signed-in shell (AppShell, providers, AI assistant)
    api/backend/          BFF route
    globals.css           Tokens as CSS variables + base layer
  components/
    ui/                   Primitives (DESIGN.md §7). No data fetching, no domain words.
    shell/                AppShell, Sidebar (v3), TopBar (v3), BottomTabs (v3), CommandPalette, PortfolioSwitcher (v3)
    landing/              Brand-register sections + LandingMotion (the only Locomotive user)
    <domain>/             agents, backtest, discover, home, intel, markets, portfolio, symbol,
                          watchlists (v3), alerts (v3), brokers (v3)
  context/                PortfolioContext (selected portfolio, positions)
  lib/                    api.ts, server-api.ts, useApi.ts, format.ts, sse.ts, indicators.ts,
                          sizing.ts, drawings.ts, useReducedMotion.ts, utils.ts (+ *.test.ts)
  types/                  API payload types, one file per domain
  proxy.ts                Clerk middleware + CSP
```

Dependency direction is one-way: `app → components/<domain> → components/ui → lib`. `ui` never imports from a domain folder, and `lib` never imports React components.

---

## 5. Data flow

### 5.1 Reads

| Where | How | Notes |
|---|---|---|
| Server component or layout | `serverGet<T>(path)` (`lib/server-api.ts`) | Returns `null` on any failure; the caller decides what an outage means. `cache: 'no-store'`. |
| Client component | `useApi<T>(path, { refreshMs })` (`lib/useApi.ts`) | Abortable, keeps the last good data on reload, polls only while the tab is visible. |
| Streams | `lib/sse.ts` | AI desk and chat (SSE through the BFF). |

### 5.2 Writes

`apiPost` / `apiPatch` / `apiDelete` from `lib/api.ts`. Errors arrive as `ApiError` (message, status, code, ref, retryAfter); render them with `errorMessage()`. Destructive writes are confirmed first and toast with undo.

### 5.3 Endpoints in use (non-exhaustive)

`/api/me`, `/api/me/onboarding`, `/api/accounts`, `/api/watchlists`, `/api/journal`, `/api/quote`, `/api/chart`, `/api/search`, `/api/movers`, `/api/quant-signals`, `/api/ml-insights`, `/api/portfolio-analytics`, `/api/holdings-intel`, `/api/news`, `/api/news-intel`, `/api/deep-analysis`, `/api/backtest/optimize`, `/api/backtest/walk-forward`, `/api/ai-chat`, plus discover/screens/desk routes.

### 5.4 Backend contracts for v3

Built 2026-10-15 in `algo-trader-backend` (migration `0003_real_accounts_alerts.sql`, routers `brokers.py`, `alerts.py`, `ledger.py`, `market.py`). **Applied to the Neon `dev` branch only; production still needs `python -m db.migrate`.** All routes need the Clerk session (via the BFF) and return the standard `{error, code}` shape on failure.

| Capability | Contract as built |
|---|---|
| Accounts | `GET /api/accounts` → `{accounts: [{id, name, kind: 'paper' \| 'real', currency, starting_cash (null for real), created_at, broker: 'zerodha' \| null, sync: {connection_id, status, last_synced_at} \| null}]}`. Field is `currency`, not `base_currency`; the user's base currency is `GET /api/me`. |
| Real is read-only | Orders and `/positions` on a real account → **403**. A database trigger also refuses fills on real accounts. |
| Broker connect | `POST /api/brokers/zerodha/connect` → `{redirect_url, expires_in}` (a one-time state, 10 min). Kite redirects the **browser** to the frontend `/settings/brokers/callback?request_token=…&state=…&status=…` (register this URL in the Kite console). That page `POST`s `{request_token, state}` to `/api/brokers/zerodha/session` → 201 `{connection, sync}`. A reused, expired or other user's state → 403. |
| Broker status | `GET /api/brokers` → `{connections: [{id, broker, broker_user_id, broker_user_name, status: 'connected' \| 'syncing' \| 'needs_reconnect' \| 'error', account_id, last_synced_at, token_expires_at, last_error, scopes, created_at}], available: [{broker, label, markets, configured}]}`. `POST /api/brokers/{id}/sync` → `{account_id, holdings, skipped, synced_at}`; an ended Kite session → **409 `code: needs_reconnect`**. `DELETE /api/brokers/{id}` → 204, removes the connection, its real account, holdings and history. Kite sessions end daily at 06:00 IST, so "needs reconnect" is a normal daily state. |
| Real holdings | `GET /api/accounts/{id}/holdings` (real only) → `{account, as_of, base_currency, holdings: [{symbol, broker_symbol, exchange, isin, quantity, currency, avg_price, last_price, market_value, invested, unrealized_pnl, unrealized_pnl_pct, day_change_pct, fx_rate, market_value_base}], totals}`. Prices are as of the last sync (`as_of`). Money fields are strings. |
| FX | `GET /api/fx?pair=USDINR` → `{pair, base, quote, rate, source, as_of, stale}`. |
| Market pulse | `GET /api/markets/pulse?market=in\|us` → `{session: {state, hours, note}, indices[], breadth: {universe, advancing, declining, unchanged, priced, scanned, coverage_pct, partial, as_of}, sectors[], missing[], source, computed_at}`. Each index/sector row: `{symbol, name, price, change, change_pct, spark[], as_of}`. India breadth is NIFTY 500 (falls back to the 11 NSE sector indices while the scan warms); US breadth is the 11 S&P sector ETFs. `breadth.universe` always says which. |
| Performance | `GET /api/accounts/{id}/performance?period=1m\|3m\|6m\|1y\|ytd\|all` → `{twr_pct, xirr_pct, xirr_note, series: [{date, value, index}], benchmark: {symbol, name, return_pct, series}, method, start, end}`. XIRR is null under 30 days of history. Real accounts are measured from daily sync snapshots, so history starts at the first sync; `method` explains the limits. |
| Alerts | `GET /api/alerts?status=` · `POST /api/alerts {symbol, kind: 'price_above' \| 'price_below' \| 'move_pct', threshold, note?}` · `PATCH /api/alerts/{id} {threshold?, note?, status?: 'active' \| 'paused'}` (active re-arms a triggered alert) · `DELETE /api/alerts/{id}` · `GET /api/alerts/firings?limit=` → `{firings[], unseen, note}` · `POST /api/alerts/firings/seen`. One-shot: a fired alert moves to `triggered`. No background worker: alerts are checked when the app lists alerts or polls firings, at most once a minute per user, on delayed quotes; stale quotes never fire. Poll firings every 60s for the bell (T4.29). |
| Watchlists | `GET/POST /api/watchlists`, `PATCH/DELETE /api/watchlists/{id}`, `POST /api/watchlists/{id}/items`, `DELETE /api/watchlists/{id}/items/{symbol}` |

Brokers: Zerodha Kite only (read-only holdings). Upstox and US brokers are not built (PRD §III.6).

---

## 6. State

| State | Lives in | Why |
|---|---|---|
| Server data | Backend; fetched per view with `useApi` / `serverGet` | No client cache layer yet. Add one (SWR-like) only if duplicate requests become measurable. |
| Selected portfolio | URL `?p=` + `PortfolioContext` | Deep-linkable; context avoids prop drilling |
| UI preferences (sidebar collapsed, density, last tab) | `localStorage` via `UserStorage`, namespaced by Clerk user id | Per-device conveniences only |
| User preferences (base currency, reduced motion) | Backend `/api/me` | Follow the user across devices |
| Form state | Local component state | No form library yet |

`localStorage` is never the record for anything financial.

---

## 7. Styling pipeline

1. `tailwind.config.js` defines the tokens (DESIGN.md §11) and **replaces** `borderRadius` and `boxShadow`, so unapproved values don't exist.
2. `globals.css` mirrors the tokens as CSS variables (for inline SVG, charts and Clerk) and holds the base layer: focus ring, reduced motion, `.tabular`, `.skeleton`.
3. Components compose classes with `cn()`. Variants live in a `Record<Variant, string>` beside the component (see `ui/Button.tsx`).
4. **(v3)** The legacy aliases block in the config is deleted once T1.6 has migrated every file.

---

## 8. Motion architecture

| Surface | Tools | Boundary |
|---|---|---|
| Landing `/` | Locomotive Scroll 5 (dynamic import), GSAP ScrollTrigger + SplitText, `useGSAP` scoped to the page root | Only `components/landing/LandingMotion.tsx` instantiates Locomotive. GSAP ticker drives it so ScrollTrigger stays in sync. Destroyed on unmount. |
| App `(app)` | CSS transitions and keyframes via Tailwind tokens | No smooth scroll, no ScrollTrigger. GSAP is allowed only for the price-tick flash if CSS can't do it. |
| Both | `useReducedMotion()` (`lib/useReducedMotion.ts`) + the global CSS block | Reduced motion skips all JS motion and renders final states. |

A lint guard (T1.8) blocks importing `locomotive-scroll` or `gsap/ScrollTrigger` outside `components/landing/`.

---

## 9. Security

- **CSP:** strict nonce + `strict-dynamic` via Clerk middleware; `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. All pages render dynamically so the nonce is present. No inline `<script>`; no third-party script tags.
- **Errors:** the user sees a message and a reference id, never internals.
- **Rendering untrusted text:** AI and news text goes through the escaped renderer. `dangerouslySetInnerHTML` is banned.
- **Broker (v3):** read-only scopes; tokens stay in the backend; disconnect purges them; the UI shows the scopes granted.

---

## 10. Performance budgets

| Metric | Budget |
|---|---|
| LCP (landing, 4G mid-tier phone) | < 2.5s |
| CLS | < 0.1 (skeletons match final layout) |
| INP | < 200ms |
| JS per app route (gzip, excluding framework) | < 180 KB |
| Landing JS (gzip) | < 250 KB incl. GSAP + Locomotive |

Heavy modules (charts, GSAP, Locomotive, and `three` if T5.12 adopts it) load with dynamic `import()` on the routes that need them.

**Glass cost.** `backdrop-filter` is GPU work that runs again whenever content scrolls under it. Limits: about 8 blurred surfaces on screen at once, none on rows or list items, smaller blur radii on phones, and a solid fallback (`DESIGN.md` §2.3). The light field and grain are static CSS pseudo-elements, so they add no JavaScript or per-frame work.

---

## 11. Environments

| Variable | Where | Purpose |
|---|---|---|
| `FLINT_API_URL` | Server only | FastAPI base URL (default `http://127.0.0.1:5000` in dev) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk |
| `CLERK_SECRET_KEY` | Server only | Clerk |

Dev: run `npm run dev` in `frontend/` with the backend running locally.

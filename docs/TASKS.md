# Polaris v3 Frontend Tasks

**Date:** 2026-10-11 · Each task is sized for one sitting (half a day or less) and ends in a verifiable state.

**How to use:** work top to bottom within a phase; phases can overlap only where "Needs" allows. Tick `[x]` when the Definition of Done in `RULES.md` §13 is met, and add a line to `MEMORY.md`.

**Tags:** `[BE]` needs a backend contract confirmed first (`ARCHITECTURE.md` §5.4). `[S]` ≤ 1h · `[M]` ≤ 3h · `[L]` ≤ half a day.

---

## Phase 0: Alignment

- [x] **T0.6** v3.2 overhaul after owner review ("glass not good enough, overhaul everything"): recalibrate to the reference, rebuild the shell and landing page, move every screen onto glass. See MEMORY 2026-10-11. `[L]`

- [x] **T0.1** Write `docs/` set: ARCHITECTURE, DESIGN, MEMORY, RULES, TASKS; update PRD. `[M]`
- [ ] **T0.2** Owner reviews `DESIGN.md` §2 (palette, paper blue) and §9 (screen blueprints); record the outcome in MEMORY. `[S]`
- [x] **T0.3** Confirm the v3 backend contracts in `ARCHITECTURE.md` §5.4 against the FastAPI repo; mark each one available or missing in MEMORY. `[M]`
- [x] **T0.5** Fold the Wealthcore glass reference into DESIGN v3.1 and propagate it to RULES, TASKS and ARCHITECTURE. `[M]`
- [x] **T0.4** Mark `docs/flint-os-v2/DESIGN.md` §6 and §15.4 superseded and point it to `docs/DESIGN.md`. `[S]`

## Phase 1: Foundations (tokens)

- [x] **T1.1** Tokens v3.1 in `tailwind.config.js`: add `ink-3`, `paper`; update `down` → `#F0625F` and `control` → `#6B7470`; new radius scale (2/4/12/16/20); `shadow-overlay`; `duration-slow`, `ease-standard`, `ease-exit`; `text-figure`, `text-display-xl`, `text-micro`; display weight 400. Keep the legacy aliases for now. `[M]`
  *Accept:* `npm run build` passes; the app renders with no visual regressions besides the intended radius and red changes.
- [x] **T1.2** Mirror the T1.1 tokens as CSS variables in `globals.css` (`--ink-3`, `--paper`, `--radius-*`, `--dur-*`, `--ease-*`). Update Clerk `appearance` in `app/layout.tsx` (radius 6, new red). `[S]`
- [x] **T1.3** Retire the landing print palette: remove `paper`, `carbon`, `graphite`, `hazard`, `grotesk`, `plex` from the config and drop the Archivo/Plex `next/font` loads (do this together with T5.1 so the landing page never renders broken). `[S]` *Needs:* T5.1 started
- [x] **T1.10** Glass layer in `globals.css`: `glass-1`, `glass-2`, `glass-hero`, tints `glass-up/down/warn/paper`, sheen + inner highlight, phone blur sizes, `@supports not (backdrop-filter)` and `prefers-reduced-transparency` fallbacks. `[M]`
  *Accept:* each class verified in Chrome, Safari (with `-webkit-`) and Firefox; the fallback renders solid with the same border.
- [x] **T1.11** Ambient light field (`body::before`, product and brand variants) and film grain (`body::after`, inline SVG noise). `[M]`
  *Accept:* no layout shift, no scroll jank on a mid-tier phone; `fg-3` on `glass-1` measures ≥ 4.5:1 at the brightest point of the product light field.
- [x] **T1.12** `.text-silver` utility with a forced-colours fallback. `[S]`
- [x] **T1.4** Write a migration map: legacy alias → v3 token (`bgPrimary`→`ink-0`, `bgSecondary`→`ink-1`, `bgElevated`→`ink-2`, `textPrimary`→`fg`, `textSecondary`→`fg-2`, `textMuted`→`fg-3`, `accentGreen`→`up`, `accentRed`→`down`, `accentAmber`→`warn`, `accentBlue/Purple/Cyan`→`fg-2`, `borderSubtle`→`line`, `borderStrong`→`line-strong`, `.glass-panel`→`Card` (now real glass)). Put it in MEMORY. `[S]`
- [x] **T1.5** Script the mechanical part of the migration (scratch script, not committed): rewrite alias class names using the T1.4 map. Dry run first and review the diff. `[M]`
- [x] **T1.6** Run the migration per folder, one commit each, and review each one visually: `agents/` · `backtest/` · `discover/` + `markets/` · `intel/` · `symbol/` + `Chart*` · `portfolio/` + `home/` · `app/(app)` pages. Track counts in MEMORY (start: 821 alias uses in 27 files). `[L]` (split across sittings)
  *Accept:* `grep -rE "bgPrimary|textSecondary|accentGreen|glass-panel|..."` returns 0.
- [x] **T1.7** Delete the legacy alias block from `tailwind.config.js` and `globals.css`. `[S]` *Needs:* T1.6
- [x] **T1.8** Lint guards: add an ESLint `no-restricted-imports` rule for `locomotive-scroll`, `gsap/ScrollTrigger` and `gsap/SplitText` outside `components/landing/`, and a `no-restricted-syntax` rule (or grep script in `npm run lint`) that flags hex literals in `className`. `[M]`
- [x] **T1.9** Replace the 69 raw hex values in `.tsx` files with tokens (chart colours read CSS variables). `[M]`

## Phase 2: Primitives (`components/ui/`)

Each primitive comes with all its states, keyboard support and a short usage comment. Build a private gallery page first so every primitive can be checked in one place.

- [x] **T2.1** `/dev/ui` gallery route (rendered in development only, 404 in production) showing every primitive in every state. `[S]`
- [x] **T2.2** `Button` v3.1: white primary, outlined secondary, radius 2, `paper` and `lg` variants, fixed-width loading. Update `ButtonLink`. `[S]`
- [ ] **T2.3** `IconButton`, with a type-required `aria-label`. `[S]`
- [ ] **T2.4** `Field`, `Input`, `Textarea`, `Select` v3 (ink-2 fill, control border, 16px text on phone, error wiring). `[M]`
- [ ] **T2.5** `Segmented` (radiogroup semantics, arrow keys). `[M]`
- [ ] **T2.6** `Switch` with a text state. `[S]`
- [x] **T2.7** `Card` and `Panel` on `glass-1` (radius 16, header slot with `text-micro` label, flush-table body, `tone` prop for semantic tints). `[M]`
- [ ] **T2.8** `Tabs` v3: URL-synced option, sliding underline, horizontal scroll on phone. `[M]`
- [ ] **T2.9** `Dialog` v3 (radius 14, overlay shadow, scrim, focus trap and return). `[M]`
- [x] **T2.10** `Sheet`: right panel on `lg`+, bottom sheet with a handle on phone; focus management; Escape; reduced-motion aware. `[L]`
- [ ] **T2.11** `Popover`, `Menu` and `Tooltip` (positioning, Escape, outside click, APG menu keys). `[L]`
- [ ] **T2.12** `Badge`/`Chip`, ~~`ModeBadge`~~ (done with T3.4), ~~`SyncBadge`~~ (done with T4.14). `[S]`
- [ ] **T2.13** `Figure` and `StatStrip`. `[S]`
- [ ] **T2.14** `Price` with tick flash and throttled `aria-live`; `Change` v3 (true minus, arrow, absolute and/or percent). `[M]`
- [ ] **T2.15** `ProvenanceChip` (hover on pointer, inline on touch, amber when stale). `[M]`
- [ ] **T2.16** `DataTable`: sortable headers with `aria-sort`, sticky header and first column, compact density on `lg`+, card list under 768px, built-in loading/empty/error rows. `[L]`
- [ ] **T2.17** `Sparkline` v3 (moved from `discover/` to `ui/`, `aria-label` summary). `[S]`
- [ ] **T2.18** `Allocation` stacked bar + legend table. `[M]`
- [ ] **T2.19** `Skeleton`, `EmptyState`, `ErrorState`, `Banner`, `Disclaimer` v3. `[M]`
- [ ] **T2.20** `Toast` v3 (position per breakpoint, undo, `role="status"`). `[S]`
- [ ] **T2.21** `lib/format.ts`: confirm INR `en-IN` and USD formatting, ISO code when different from base, `Unavailable` for null. Add tests for each case. `[M]`

## Phase 3: Shell

- [x] **T3.1** `Sidebar` (`lg`+): nav groups, active state (ink-3 + bar + text), collapse to a 64px rail with tooltips, collapse state saved per user. `[L]` *Needs:* T2.11
- [ ] **T3.2** `TopBar`: title/breadcrumb, search trigger, alerts bell with count, user menu (Clerk `UserButton` themed). `[M]`
- [x] **T3.3** `BottomTabs` (under `lg`): Home, Markets, Search, Portfolio, More; safe-area padding; "More" opens a sheet with News, Watchlists, Alerts, Settings. `[M]` *Needs:* T2.10
- [x] **T3.4** `PortfolioSwitcher`: grouped list (All real, real accounts, paper portfolios) with ModeBadge; writes `?p=`. `[M]` `[BE]` (`kind` on `/api/accounts`)
- [x] **T3.5** Rebuild `AppShell` from T3.1–T3.4; skip link stays; footer disclaimer. Remove the old top nav. `[M]`
- [ ] **T3.6** `CommandPalette` v3 styling + "Go to" entries for the new routes + "Add to watchlist" action. `[M]`
- [ ] **T3.7** Route-level `loading.tsx` and `error.tsx` for `(app)` using the shell skeleton and `ErrorState`. `[S]`

## Phase 4: Screens

### Home (market pulse)
- [x] **T4.1** Indices strip (India and US indices, session dots, horizontal scroll on phone). `[M]` `[BE]` pulse
- [x] **T4.2** Breadth bar and sector heat table with India/US segmented control. `[M]` `[BE]` pulse
- [ ] **T4.3** Movers table (Gainers, Losers, Volume) reusing `DataTable`. `[M]`
- [ ] **T4.4** "Your day" column: real net worth Figure, paper P&L today (blue), triggered alerts, top 8 watchlist rows. `[M]` *Needs:* T3.4
- [ ] **T4.5** News on holdings and watchlist (tone-tagged), 5 items + "All news". `[S]`
- [ ] **T4.6** Assemble the Home layout per `DESIGN.md` §9.1 with phone ordering; all data states. `[M]`

### Portfolio
- [ ] **T4.7** Portfolio header: switcher, ModeBadge, SyncBadge or "New paper order", Figure + StatStrip. Paper gets the blue top rule. `[M]`
- [x] **T4.8** Holdings table: currency per row, converted value in base currency, day and total change, weight; real rows have no trade actions. `[L]` `[BE]` holdings
- [ ] **T4.9** "All real" consolidated view: sums real accounts only, FX provenance chip. `[M]` `[BE]` fx *(view and sums done with T3.4/T4.8; FX provenance chip still open)*
- [ ] **T4.10** Performance tab: TWR/XIRR toggle with a one-line explainer, period Segmented, chart vs benchmark. `[L]` `[BE]` performance
- [ ] **T4.11** Allocation tab: by asset class, sector, currency and account (Allocation component). `[M]`
- [ ] **T4.12** Restyle Risk, Activity and Journal tabs on v3 primitives (no behaviour change). `[M]`
- [ ] **T4.13** Paper order ticket on `Sheet`: books only into paper, shows risk and stop before the button, blue primary, disclaimer. `[L]`

### Brokers and settings
- [x] **T4.14** Settings → Brokers: list connections with SyncBadge, "Connect Zerodha", "Connect Upstox", Sync now, Disconnect (typed confirm), scopes shown. `[L]` `[BE]` brokers
- [x] **T4.15** `/settings/brokers/callback`: success, cancelled and error states, then return to Brokers. `[S]` `[BE]`
- [ ] **T4.16** "Needs reconnect" amber `Banner` on Portfolio and Home when any broker needs attention. `[S]`
- [ ] **T4.17** Settings → Preferences: base currency (INR/USD), density, reduced-motion override. Restyle Profile, Security and Data and privacy sections. `[M]`

### Symbol
- [ ] **T4.18** Symbol header v3 (Price, Change, session, ProvenanceChip, watchlist toggle, Paper trade button). `[M]`
- [ ] **T4.19** Overview layout (chart 8 cols, plan KeyValueList 4 cols); chart theme reads CSS variables. `[M]`
- [ ] **T4.20** Restyle AI Desk panels on Card/Panel/Badge; sources and "Model unavailable" states. `[L]`
- [ ] **T4.21** Restyle Backtest lab and results; permanent amber In-sample badge. `[M]`
- [ ] **T4.22** Restyle Fundamentals and News tabs. `[M]`

### Markets
- [ ] **T4.23** Markets layout: tabs + India/US Segmented in the URL. `[S]`
- [ ] **T4.24** Restyle Overview, Movers, Ideas, Levels and Screens on DataTable/Card; not-advice line stays. `[L]`

### Watchlists and alerts (new)
- [ ] **T4.25** `/watchlists` (add it to `MORE` in `AppShell.tsx`): list rail (create, rename, delete with undo) + table with sparklines; phone shows lists as a Segmented/Select. `[L]`
- [ ] **T4.26** Add/remove from watchlist via the symbol header and palette. `[S]`
- [x] **T4.27** `/alerts` list (add it to `MORE` in `AppShell.tsx`): Active, Triggered, Paused tabs. `[M]` `[BE]` alerts
- [x] **T4.28** Create/edit alert sheet: price cross and % move first; validation; "checked every 60s, delayed data" note. `[M]` `[BE]` alerts
- [ ] **T4.29** Alerts bell count + triggered list popover in the TopBar. `[S]` `[BE]` *(count done: sidebar badge, phone bell, More tab; all link to `/alerts?tab=triggered`. The popover waits for T2.11 and the TopBar for T3.2.)*

### News, onboarding, auth
- [ ] **T4.30** News page: For you / Markets tabs, tone tags, source and time, filters. `[M]`
- [ ] **T4.31** Onboarding v3: base currency, markets (India, US), risk per trade, starting paper balance, optional "Connect a broker" step (skippable). `[L]`
- [ ] **T4.32** Clerk sign-in and sign-up pages framed in the brand register (dark, wordmark, disclaimer). `[S]`
- [ ] **T4.33** Legal pages restyled (prose width, headings). `[S]`

## Phase 5: Landing page (brand register)

- [x] **T5.1** Landing skeleton in the dark system: all 9 sections from `DESIGN.md` §9.6 as static markup with final copy, no motion. Remove `landing.css` print styles. `[L]`
- [x] **T5.2** Hero glass card stack (allocation, portfolio value + sparkline, drift/stop alert) over the brand light field, built from real components with fixture data in `components/landing/fixtures.ts`, labelled "Sample data". Contrast-check each card at its brightest backdrop point. `[L]` *Needs:* T4.6, T4.7
- [x] **T5.3** `LandingMotion` v3: Locomotive v5 on the GSAP ticker, reduced-motion bypass, refresh after fonts and images. `[M]`
- [x] **T5.4** Hero motion: headline line split, product frame rise and scale on scroll. `[M]`
- [x] **T5.5** Scroll-linked indices tape. `[S]`
- [x] **T5.6** Pinned 1: Real ↔ Paper scrub. `[L]`
- [x] **T5.7** Pinned 2: chart draw + plan lines sequence. `[L]`
- [x] **T5.8** AI desk stagger, risk count-ups (once), trust list fade. `[M]`
- [x] **T5.9** Nav background on scroll, anchor links through Locomotive `scrollTo`, focus management for skip links. `[S]`
- [ ] **T5.10** Landing QA: reduced motion shows a finished static page; no-JS shows all content; 360px has no horizontal scroll; LCP < 2.5s; JS < 250 KB gzip. `[M]`
- [x] **T5.11** Delete the unused print-landing code and any orphaned assets. `[S]`
- [ ] **T5.12** (Optional) ThreeUI 3D trial: check the licence, prototype *Advanced Glass Material* or *Liquid Form* in greyscale behind the hero, and compare side by side with the CSS light field. Adopt only if it wins and fits the +150 KB budget (`DESIGN.md` §5.1). `[L]`

## Phase 6: Cleanup

- [ ] **T6.1** Remove components made unused by the rebuild (`MarketsTabs`, old `PageHeader` if replaced, old discover `Sparkline`). `[S]`
- [ ] **T6.2** Drop `.glass-panel`, `.hover-lift` and `.label` utilities once unused. `[S]`
- [ ] **T6.3** Check the dependency list and remove anything unused. `[S]`

## Phase 7: Quality

- [ ] **T7.1** Contrast audit of every screen against `DESIGN.md` §10 (automated with axe in the browser). `[M]`
- [ ] **T7.2** Keyboard pass per screen: tab order, focus visible and not obscured, overlays return focus. `[M]`
- [ ] **T7.3** Phone pass at 360px on every route (thumb reach, 44px targets, no horizontal scroll). `[M]`
- [ ] **T7.4** Performance pass against `ARCHITECTURE.md` §10 budgets; dynamic-import offenders. `[M]`
- [ ] **T7.5** Propose an E2E harness (Playwright) covering sign-in, switch portfolio, place a paper order, create an alert. Ask before adding the dependency. `[S]`
- [ ] **T7.6** Update `PRODUCT.md` and `CLAUDE.md` if anything drifted during the build. `[S]`

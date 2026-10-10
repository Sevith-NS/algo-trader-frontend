# Flint OS v2: Design and UX Spec

**Status:** Draft for approval (Phase 1) · **Branch:** `flint-os-v2` · **Date:** 2026-10-10
**Method:** Google UX Design Certificate process (empathize, define, ideate, prototype, test) plus the roadmap.sh UX Design roadmap (behaviour design, UX patterns, research).
**Supersedes:** the "committed identity" in `CLAUDE.md` (deep slate, neon accents, glass, General Sans). The principles in `PRODUCT.md` carry forward; its visual rules do not.

Once approved, this file is the source of truth. Code that disagrees with it is a bug; changes to it need an explicit decision.

---

## 1. Decisions already made

| Area | Decision |
|---|---|
| Access | Invite-only. The owner first, then invited testers in waves. Multi-user from day one. |
| Auth | Clerk only (sign-in, sign-up, MFA, sessions). No passwords stored by Flint. |
| Data | Neon Postgres. Every user-owned row is scoped by Clerk user id and protected by row-level security. |
| Backend | FastAPI. Every input validated at the edge. |
| Markets | Global, all asset classes. One instrument model for everything; data coverage rolls out in waves (section 12). |
| Screens kept | Symbol (Terminal, AI Desk, Backtest), Markets (Overview, Movers, Ideas, Levels, Screens), Portfolio, News. |
| Screens cut | Geotrade, Community, the mock Dashboard grid, the login form. |
| Look | Dark only. Sharp, precise, no ornament. Helvetica family. One accent: candle green. |

---

## 2. Empathize

### Problem statement

> Self-directed traders need a way to turn a symbol into a sized, risk-checked decision they can stand behind, because today they stitch together a charting site, a screener, news, a spreadsheet and their gut, and the gut usually wins.

### Personas

**Sevith, the builder-trader (primary, invite wave 0).** 23, Bengaluru. Product engineer. Trades NSE equities, US tech and crypto on paper before risking money. Research happens on a laptop in the evening; checks positions on the phone during the day.
- *Goals:* a plan with entry, stop, size and targets in under a minute; one place for every market.
- *Frustrations:* tools that show numbers with no source or age; AI that sounds confident and is wrong; losing his trade history.
- *Quote:* "Show me the plan and the risk. Skip the confetti."

**Arjun, the evening swing trader (wave 1).** 31, Pune. Salaried; trades NSE swing setups after work, mostly on his phone.
- *Goals:* scan for setups fast, know his risk per trade in rupees, journal why he took a trade.
- *Frustrations:* desktop-only tools; US-centric apps that show everything in dollars; jargon with no explanation.
- *Quote:* "If it doesn't work on my phone at 9 pm, I won't use it."

**Maya, the global long-term investor (wave 2).** 38, Singapore. ETFs, bonds and some US and Indian stocks. Reviews monthly.
- *Goals:* see total portfolio risk across currencies; rebalance with discipline.
- *Frustrations:* a portfolio split across three brokers in three currencies.
- *Quote:* "I want one number I trust for how much I could lose."

### Journey map: "research to review" (current app pain points from the PRD and the audit)

| Stage | Doing | Feeling | Pain today | v2 opportunity |
|---|---|---|---|---|
| Discover | Scans movers and ideas | Curious | US-only defaults; hardcoded universes | Global universes, asset-class filters |
| Research | Opens a symbol, reads chart and plan | Focused | Plan buried; numbers have no source or age | Plan first; provenance chip on every number |
| Decide | Asks the AI desk, checks risk | Uneasy | Idea analysis silently fabricates a 50% score | Show "unavailable" honestly; never invent data |
| Act | Paper trade | Committed | Portfolio in localStorage; lost on clear | Server ledger in Neon, per user |
| Review | Journal and P&L | Reflective | Anyone could delete the journal (audit finding 1) | Owner-only, soft delete with undo |

---

## 3. Define: design principles

1. **The number is the hero.** Type, layout and motion exist to make a figure readable. Anything else is cut.
2. **Sharp and precise.** Hairlines instead of shadows, 2px corners, no gradients, no glass, no glow. Every element earns its pixels.
3. **Discipline over emotion.** Entries, stops, size and risk are always shown before the buy button. No celebration of trades.
4. **Honest about data and risk.** Every price shows its source, age and delay. Paper trading is labelled. Unknowns say "unavailable", never a made-up value.
5. **Tested on phone first, tuned for laptop.** Each screen is designed at 360px and then expanded.
6. **Security you can see.** Destructive actions confirm and can be undone. Users can see their sessions, turn on MFA, export their data and delete their account.

### Banned patterns (the owner's anti-AI-slop list)

Neon colours, purple, harsh or animated gradients, glass, drop shadows, soft large radii, bento grids, three feature cards in a row, dot or line grid backgrounds, radial orbs, lucide icons, emoji, checkmark bullets, sparkle icons, animated arrows, coloured left stripes on cards, terminal-window mockups, Inter, Geist, Space Grotesk, em dashes in UI copy, "it's not X, it's Y" copy, fake testimonials, decorative hover animations. Also cut from the current build: Galaxy shader, SplashCursor, Meteors, BorderBeam, ShinyText, the 3D candlestick field, Lenis or Locomotive smooth scroll inside the app.

The opposite of the list is also required: real skeleton loaders, real product views on the landing page, a privacy policy and terms page.

---

## 4. Information architecture

```
Public
  /                     Landing: what Flint is, a real product view, "Request an invite"
  /sign-in  /sign-up    Clerk (sign-up requires an invite)
  /legal/privacy  /legal/terms

App (signed in; every route checked on the server)
  /home                 Today: portfolio pulse, watchlist, market sessions, recent journal
  /markets              Overview · Movers · Ideas · Levels · Screens   (tabs, URL per tab)
  /s/[symbol]           Symbol: Overview · Plan · AI Desk · Backtest · Fundamentals · News
  /portfolio            Holdings · Activity · Risk · Journal
  /news                 Global feed with sentiment, filterable by holdings
  /settings             Profile and security (Clerk) · Preferences · Data and privacy
  /onboarding           First-run setup (3 steps)

Global
  Search / command palette (Ctrl K or /)  ·  AI assistant panel  ·  Toasts with undo
```

**What changed and why**
- "Terminal" is not a word new users recognise. A symbol gets its own URL (`/s/RELIANCE.NS`) so it can be bookmarked and shared, and search is the way in.
- The mock dashboard becomes `/home`, built only from real data.
- The decision journal moves under Portfolio, where review happens.
- Five top-level destinations at most, so the nav fits a phone's bottom bar.

### Navigation

- **Laptop (1024px and up):** a top bar 48px high. Wordmark, then Home, Markets, Portfolio, News, then a search field (with a Ctrl K hint), then the user menu. The active item gets a 2px green underline plus white text, so the state is carried by two signals, not colour alone.
- **Phone (under 1024px):** a top bar with the wordmark, search and user menu, plus a bottom tab bar with Home, Markets, Search, Portfolio and News. Targets are at least 44px and sit in the thumb zone.

---

## 5. Key flows

Every flow defines all of its states: loading (skeleton), empty, error (with a recovery action), partial (some data stale) and success.

**F1. Invite to first value (target: under 3 minutes)**
1. The invite email links to `/sign-up`. Clerk sign-up (email or Google), with an optional TOTP prompt.
2. Onboarding, step 1: base currency (detected from locale, editable).
3. Step 2: markets you trade (India, US, Europe, Crypto, FX...). This seeds the default universes.
4. Step 3: risk per trade (default 1%) and starting paper balance.
5. Land on `/home` with a seeded watchlist and one call to action: "Search a symbol".

**F2. Symbol to paper trade**
1. Search (palette), choose a result. Each result shows an asset-class tag, exchange and currency.
2. The symbol page opens on Overview: price, change, session state, chart, and the plan summary (entry, stop, target, size).
3. Open the order ticket (a side panel on laptop, a bottom sheet on phone). Size is prefilled from risk per trade; the ticket shows the rupee or dollar risk and the stop before the button.
4. Confirm. The toast reads "Paper order filled · View in Portfolio".

**F3. AI desk to journal**
1. Run the desk. Analyst cards stream in (SSE), each with its sources.
2. The verdict and trade plan are shown with confidence and their inputs. If a model is unavailable, the card says so.
3. "Save to journal" stores the entry against the user. Deleting it later is a soft delete with a 10-second undo and a 30-day restore.

**F4. Backtest a plan.** Pick a strategy and range, run it, read the equity curve and robustness panels, compare with buy and hold. In-sample results carry a permanent "in-sample" tag.

**F5. Review portfolio risk.** Portfolio, then Risk: VaR and CVaR in base currency, drawdown, concentration. Each metric has a one-line plain-language explanation available on demand.

---

## 6. Visual language

### Colour (dark only)

Neutrals carry a very slight green bias toward the accent so they read as chosen, not default.

| Token | Hex | Use | Contrast on `ink-0` |
|---|---|---|---|
| `ink-0` | `#0A0B0B` | Page background | |
| `ink-1` | `#111312` | Panels, table headers | |
| `ink-2` | `#181B1A` | Raised: menus, sheets, ticket | |
| `line` | `#242927` | Hairlines, dividers | |
| `line-strong` | `#626A66` | Input and control borders (3:1 on every surface) | 3.5:1 |
| `fg` | `#F2F4F3` | Primary text, key numbers | 17.8:1 |
| `fg-2` | `#A4ACA8` | Secondary text, labels | 8.5:1 |
| `fg-3` | `#848C88` | Captions, timestamps (minimum) | 5.7:1 |
| `green` | `#2FBF71` | Up, brand, primary action, focus ring | 8.3:1 |
| `red` | `#E5484D` | Down, losses, destructive actions | 5.0:1 |
| `amber` | `#D9A23A` | Stale or delayed data, warnings | 8.6:1 |

Rules: green and red are never the only signal. Every change carries a sign (+/−) and an arrow (▲ ▼). Tinted fills use the colour at 12% opacity. No other hues.

### Typography

| Role | Family | Notes |
|---|---|---|
| Display | Coolvetica (self-hosted) | Wordmark, landing headlines, page titles of 32px and up only. The licence must be checked before shipping; fallback is the UI stack at weight 700. |
| UI and body | `"Helvetica Neue", Helvetica, Arial, sans-serif` | System fonts: zero download, crisp. Renders as Helvetica on Apple devices and Arial on Windows and Android. |
| Numbers | Same stack, `font-variant-numeric: tabular-nums` | Figures align in columns without a monospace font. |

Scale (px, line-height): 12/16 caption · 13/18 table · 14/20 body small · 16/24 body · 20/28 heading 4 · 24/32 heading 3 · 32/36 heading 2 · 48/52 heading 1 · 72/72 display (landing only). Weights: 400, 500, 700. Display tracking −0.02em. Sentence case everywhere; no tracked uppercase eyebrows.

### Space, grid and shape

- 4px base unit; the spacing steps are 4, 8, 12, 16, 24, 32, 48, 64.
- Breakpoints: 360 (design start), 768, 1024, 1440. Content max width 1440px; 16px gutters on phones, 24px on tablets, 32px on laptops.
- Corners are 2px for controls and 0 for tables and panels. No shadows: elevation comes from the `ink` steps plus a hairline.
- Icons: no icon library. A small custom set (search, close, menu, arrows, external) on a 16px grid with a 1.5px stroke, and text labels by default.

### Motion

- Durations are 120ms (hover, press) and 200ms (panels, sheets), ease-out. Nothing loops.
- Price ticks: the changed digits flash green or red and fade over 600ms.
- No page transitions, no smooth-scroll libraries, no scroll-triggered reveals inside the app. The landing page gets one orchestrated moment at most.
- `prefers-reduced-motion`: everything becomes instant, and the flash becomes a static colour for one second.

### Data display rules

- Numbers are right-aligned and tabular, with a currency symbol and an ISO code when it differs from the base currency (`₹2,914.50`, `$231.40 USD`).
- Every live number has a provenance chip on hover or tap: source, age, delay class (`Live`, `15m delayed`, `EOD`). Stale data is amber and impossible to miss.
- Charts use lightweight-charts with green and red candles, an `ink-0` background, faint `line` gridlines and the crosshair in `fg-3`.

### Voice and copy

Plain, short, specific. Buttons say exactly what happens ("Place paper order", "Delete entry"). Errors say what went wrong and what to do next. No em dashes in UI copy. The footer and order ticket always show: "Paper trading. Educational, not investment advice."

---

## 7. Wireframes (low fidelity)

### Symbol page, laptop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLINT   Home  Markets  Portfolio  News          [ Search  Ctrl K ]     (SN)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ RELIANCE.NS  Reliance Industries · NSE · INR · Equity        ● Open 15m delay │
│ ₹2,914.50   ▲ +38.20 (+1.33%)                                 [ Paper trade ] │
│ Overview  Plan  AI Desk  Backtest  Fundamentals  News                          │
├───────────────────────────────────────────────┬──────────────────────────────┤
│                                               │ Plan              Swing · 1D │
│   chart (candles, volume)                     │ Entry      ₹2,902.00 limit   │
│   1m 5m 15m 1h 1D 1W                          │ Stop       ₹2,861.40 (ATR)   │
│                                               │ Target 1   ₹2,963.00  1.5R   │
│                                               │ Target 2   ₹3,024.00  3R     │
│                                               │ Size       34 sh · ₹1,380 risk│
│                                               │ Signal  ▲ Long  4 of 5 vote  │
├───────────────────────────────────────────────┴──────────────────────────────┤
│ Factor votes · Key levels · Latest headlines                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Symbol page, phone (360px)

```
┌──────────────────────────┐
│ FLINT          [⌕]  (SN) │
├──────────────────────────┤
│ RELIANCE.NS   ● Open     │
│ ₹2,914.50  ▲ +1.33%      │
│ Overview Plan Desk  ›    │
│ ┌──────────────────────┐ │
│ │ chart                │ │
│ └──────────────────────┘ │
│ Entry   ₹2,902.00        │
│ Stop    ₹2,861.40        │
│ Size    34 · ₹1,380 risk │
│ [   Paper trade   ]      │
├──────────────────────────┤
│ Home Markets ⌕ Port News │
└──────────────────────────┘
```

### Home, laptop

```
┌───────────────────────────────────────────────────────────────┐
│ Portfolio  ₹10,42,380  ▲ +0.84% today   Risk: VaR 95% ₹18,200 │
├──────────────────────────────┬────────────────────────────────┤
│ Watchlist (sortable table)   │ Sessions  NSE ● Open  NYSE ○   │
│ sym  last  chg  plan signal  │ Journal  last 3 entries        │
│                              │ Alerts   none yet · Create     │
└──────────────────────────────┴────────────────────────────────┘
```

---

## 8. Component inventory

AppShell · TopBar · BottomTabs · CommandPalette · SymbolHeader · Price (with tick flash) · Change (sign, arrow and colour) · ProvenanceChip · SessionBadge · AssetClassTag · Tabs (URL-synced) · DataTable (sortable, sticky header, becomes a card list under 768px) · KeyValueList · Chart · OrderTicket (side panel or bottom sheet) · ConfirmDialog (typed confirmation for irreversible actions) · Toast (with undo) · EmptyState · Skeleton · ErrorState (with retry) · Field (label, hint, error) · Select · Segmented control · UserMenu (Clerk `UserButton`, themed).

No "hero metric" tile grids. Summary numbers sit in one inline strip.

---

## 9. Accessibility (WCAG 2.2 AA)

- Text contrast at least 4.5:1 (all tokens above pass on `ink-0`); 3:1 for UI boundaries.
- A visible focus ring on everything: 2px `green` outline, 2px offset.
- Full keyboard use: palette, tabs (arrow keys), tables, order ticket; Escape closes overlays and focus returns to the trigger.
- Touch targets at least 44 by 44px.
- Prices update an `aria-live="polite"` region, throttled to at most one announcement every 10 seconds per symbol.
- Colour is never the only signal (sign plus arrow plus colour).
- Forms: visible labels, errors tied to fields with `aria-describedby`, no placeholder-only labels.
- `prefers-reduced-motion` honoured everywhere (a hard requirement).

---

## 10. Security in the experience

- **Invite-only:** Clerk restricted sign-up (allowlist or invitations). The landing page explains this and offers "Request an invite".
- **MFA:** offered right after sign-up, and nudged on Settings until enabled.
- **Sessions:** Settings, then Security, shows active devices with "Sign out".
- **Destructive actions:** confirm first, then toast with undo; account deletion requires typing the account email.
- **Data rights:** "Export my data" (JSON or CSV) and "Delete my account" in Settings, then Data and privacy.
- **Errors never leak internals:** users see a reference id, while details go to server logs with secrets redacted.
- **No secrets in the browser:** the frontend holds only Clerk's publishable key; every data call goes through the backend with a Clerk session token.

---

## 11. Usability study plan

- **Who:** 5 participants (the owner plus 4 invitees from wave 1), moderated, remote.
- **Device:** phone first, then laptop.
- **Tasks:**
  1. Find Reliance and tell me where you'd put your stop.
  2. Place a paper trade that risks 1% of your balance.
  3. Find out why your portfolio's risk went up this week.
  4. You deleted a journal entry by mistake. Get it back.
  5. Turn on two-step verification.
- **Measures:** task success, time on task, errors, and the Single Ease Question (1 to 7) after each task.
- **Pass bar:** at least 4 of 5 complete each task without help, with a median SEQ of 5 or more.

---

## 12. Global asset coverage

The instrument model (symbol, asset class, exchange, currency, price scale, tick size, multiplier, calendar) covers every class from day one, so the UI never needs a redesign. Live data arrives in waves, and anything not yet covered says "Coverage coming" instead of showing bad data.

| Wave | Asset classes | Free source |
|---|---|---|
| 1 | Equities (US, India NSE/BSE, Europe, Asia), ETFs, indices, crypto, FX | Yahoo, Binance public |
| 2 | Futures, commodities, government bond yields | Yahoo |
| 3 | Options chains with Greeks | Yahoo plus in-house Black-Scholes |

---

## 13. What gets removed in the rebuild

Geotrade, Community, Dashboard grid, the login form, next-auth, bcryptjs, three, @react-three/*, globe.gl, react-globe.gl, ogl, locomotive-scroll, lenis, lucide-react, react-grid-layout, the magicui and reactbits components, Background3D, the General Sans and JetBrains Mono files.

---

## 14. Subscription tiers (later in the build)

Advanced features will sit behind paid tiers once the core is stable. Planned now so nothing needs re-architecting:
- Every user row carries a `plan` (`free` to start). The backend checks entitlements on the server, never only in the UI.
- Locked features stay visible with a plain "Available on Pro" state and what it unlocks; no dark patterns, no fake urgency.
- Candidates for paid tiers: AI desk runs per day, walk-forward and optimisation backtests, real-time data providers, alerts volume.
- Billing provider to be decided at that stage (Clerk Billing is the first option to evaluate).

## 15. Resolved questions (defaults, override any time)

1. **Coolvetica licence.** Confirm web embedding against the Typodermic licence before shipping. If it fails, display uses the UI stack at 700.
2. **Invites.** Sent by the owner from the Clerk dashboard (restricted sign-up). A public waitlist can come later.
3. **Starting paper balance.** Chosen in onboarding, defaulting to ₹10,00,000 or the $100,000 equivalent in the base currency.

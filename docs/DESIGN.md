# Polaris Design System v3.2 "Glass"

**Status:** Binding · **Date:** 2026-10-11 (v3.1 same day) · **Supersedes:** `docs/flint-os-v2/DESIGN.md` §6 (visual language) and §15.4 (landing exception)
**Reference:** the "Wealthcore" design on motionsites.ai: monochrome near-black, light-weight Helvetica display with a silver sheen, sharp white and outlined buttons, dark frosted-glass cards floating over a grainy monochrome light field. We take the look, not the copy; its premium prompt was never seen or used.
**Scope:** every surface: the landing page at `/`, auth, onboarding and the signed-in app. One system, two registers (section 1.2).

Code that disagrees with this file is a bug. Changing a rule here needs an explicit decision recorded in `docs/MEMORY.md`.

---

## 1. Direction

### 1.1 In one line

Monochrome glass over a dark, grainy light field. Sharp controls sit on soft glass. Colour appears only when it means something: green gains, red losses, amber stale data, blue paper money. v2's discipline stays (the number is the hero, sharp controls, sentence-case copy). v3.1 adds frosted glass surfaces, an ambient monochrome light field, film grain and a silver display type.

### 1.2 Registers

| Register | Surfaces | Motion budget | Density |
|---|---|---|---|
| **Brand** | `/` landing, `/legal/*`, auth screens | Cinematic but precise: smooth scroll, up to 2 pinned scrubbed sections, count-ups | Spacious |
| **Product** | everything under `(app)`, `/onboarding` | State only: feedback, panels, ticks | Dense |

Both registers share every token in this file. They differ only in motion and spacing, never in colour, type or shape.

### 1.3 What changed from v2

| v2 | v3 | Why |
|---|---|---|
| 2px corners everywhere | Controls stay sharp (4px); glass is soft (16 / 20px) | The Wealthcore contrast: brutal controls on soft glass |
| Flat opaque panels, no glass | **Frosted glass** surfaces (§2.3) over an ambient light field (§2.4) | Owner's direction (v3.1) |
| No gradients | Gradients allowed in exactly three places: the ambient light field, the glass sheen, the silver display text | Each one is part of the material, not decoration |
| No texture | Film grain over the page at 3–5% | Gives the dark depth and hides gradient banding |
| Green primary button | **White primary button**, outlined secondary | Colour is reserved for meaning; white is the action |
| One accent (green) | Green, red and amber as **semantic glass tints**, plus **paper blue** for simulated money | Owner asked for glass red, green and amber |
| Green-biased greys, red `#E5484D` | Neutral greys, brighter accents (`#3DD68C`, `#FF7A75`, `#E8B04A`, `#86B7FF`) | Sampled from the reference; brighter accents keep AA on the card sheen |
| Bold 700 display | Regular 400 display with tight tracking and a silver sheen | Matches the reference; quieter and more expensive |
| Top nav | Sidebar (desktop) + bottom tabs (phone), both glass | Room for Watchlists and Alerts |
| Landing in a light print palette | Landing in the same dark glass system | One consistent product |
| Lucide banned, custom glyphs | Custom glyph set stays (`components/ui/icons.tsx`) | Unchanged |

### 1.4 Still banned

Neon, purple, colourful gradients (any gradient with hue, rainbow or aurora effects), gradient borders, glow or bloom around text or cards, radial colour orbs, dot or line grid page backgrounds (a faint dot grid *inside* a chart card is fine), emoji, sparkle icons, checkmark bullet lists, coloured left stripes on cards, three identical feature cards in a row, fake testimonials, **fake customer logo strips**, decorative looping animation in the app, WebGL cursor effects (SplashCursor, Galaxy, Meteors and the 3D field stay deleted), em dashes in UI copy, glass over glass more than two layers deep, and glass on table rows.

---

## 2. Colour, glass and light (dark only)

v3.2 is calibrated by sampling the Wealthcore reference: neutral greys (no colour bias), a vertical page gradient, near-opaque glass with a diagonal sheen and a rim light, a grainy silver light behind it, and heavy grain. Implemented in `frontend/src/app/globals.css` and `frontend/tailwind.config.js`.

### 2.1 Tokens

Contrast is measured on `ink-0` and on the brightest point a card's sheen can reach (`#2D2D2D`, the reference card top).

| Token | Hex | Role | Contrast ink-0 / card top |
|---|---|---|---|
| `ink-0` | `#0B0B0C` | Page base | |
| `ink-1` | `#141414` | Solid fallback surface | |
| `ink-2` | `#1C1C1C` | Solid raised fallback, tooltips | |
| `ink-3` | `#242424` | Pressed | |
| `line` | `#2A2A2A` | Hairlines on solid surfaces | |
| `line-strong` | `#3A3A3A` | Emphasised dividers | |
| `control` | `#7A7A7A` | Control borders | 4.4 / 3.2 |
| `fg` | `#F5F5F5` | Primary text, numbers, primary button fill, focus ring | 18.0 / 12.6 |
| `fg-2` | `#B5B5B5` | Secondary text | 9.8 / 6.9 |
| `fg-3` | `#A0A0A0` | Captions (the floor) | 7.5 / 5.3 |
| `up` | `#3DD68C` | Gains, open sessions | 10.5 / 7.3 |
| `down` | `#FF7A75` | Losses, destructive | 7.8 / 5.4 |
| `warn` | `#E8B04A` | Stale or delayed data | 10.1 / 7.0 |
| `paper` | `#86B7FF` | Simulated money only | 9.6 / 6.7 |

On glass, hairlines and washes use white at low alpha (`border-white/10`, `bg-white/[0.06]`) rather than the solid `line`/`ink` steps.

### 2.2 Semantic rules

1. **Colour is meaning, white is action.** Buttons, selected segments, active nav and the focus ring are white. Green, red, amber and blue never mark a button or a selection.
2. **Green and red mean direction** and always carry a sign and an arrow.
3. **Blue means paper.** Paper surfaces carry `glass-paper`, a `Paper` pill and a blue top rule. Paper order buttons use the `paper` variant.
4. **Amber means "don't fully trust this number".**
5. **Real money has no accent.**
6. Charts: candles `up` / `down`, hollow up and filled down; other series in greys with dash patterns.

### 2.3 Glass

The reference reads as glass because of the light behind it and the rim around it, not because the card is see-through. So the fill is near-opaque.

| Class | Fill | Use |
|---|---|---|
| `glass` | `rgb(17 17 17 / 0.80)` | Cards, panels, sidebar, bars |
| `glass-2` | `rgb(22 22 22 / 0.90)` + deeper drop shadow | Overlays: dialogs, palette, toasts, assistant, menus. Sets no `position` (overlays are already positioned; it would break `<dialog>`). |
| `glass-hero` | `rgb(15 15 15 / 0.88)` | Landing cards over the bright light panel |

Every glass surface has:
- **Diagonal sheen:** `linear-gradient(135deg, white 7.5% → 2.5% at 42% → 0 at 72%)` over the fill.
- **Rim light:** a 1px masked gradient border (`::before`), bright top-left (`white 34%`) fading to `4%` and back up to `14%` at bottom-right.
- **Drop:** `inset 0 1px 0 white 6%` and `0 24px 48px -24px black 70%`.
- **Emboss:** `text-shadow: 0 1px 0 black 35%` on its text.
- **Blur:** 14px on phones, 24px from `lg`; solid `ink-2` fallback without `backdrop-filter` support or with `prefers-reduced-transparency`.

**Tints** (`glass-up`, `glass-down`, `glass-warn`, `glass-paper`): the colour at 7% in the fill and a tinted rim. Never replaces the text label.

**Inside glass** use `.well` (black 28% + white 7% hairline) for nested cards, inputs and chart wells. Never glass on glass. Error states are a flat red wash, so they work at any depth.

**Helpers:** `.pill` (square uppercase status label, 11px bold, 0.06em), `.ring-dot` (the reference's ringed status dot), `.dot-grid` (faint chart grid).

### 2.4 Light

| Where | Class | What | Brightest point |
|---|---|---|---|
| App | `.ambient` (on the shell, onboarding, auth, legal) | Vertical gradient `#0B0B0C → #121212 → #181818`, a grey bloom at the top right, a faint glow bottom left | about `#5A5A5A`, so glass text keeps AA everywhere |
| Landing | `.bloom` (absolute, `-z-1`, inside a `relative isolate` parent; `--b` sets strength 0 to 1) | Free-floating silver radial light behind each group of cards, fading to transparent at every edge, so the page reads as one continuous surface | `#D6D6D6` core, hidden behind cards |

**Continuity rule (landing):** no section backgrounds, no borders between sections, no bands, and no gradient anchored to an element's edge (it gets sliced at that edge and reads as a line). Blooms use a Gaussian falloff (no stop kinks); bridge blooms carry the light across gaps such as the tape. Light comes only from blooms that overlap across section edges. The nav is a dark wash that fades into the page, the tape fades at its ends, and the footer rule is a fading hairline.

**Contrast rule:** text never sits on a bloom's bright core. Blooms sit behind glass cards and are offset away from headings (measured: the background beside the hero headline peaks at `#373737`). Text near a bloom goes inside `glass-hero` (fg and fg-2 only) or a pill with an `ink-0/85` fill.

### 2.5 Grain

SVG `feTurbulence` noise as `--grain`. Page level: `opacity 0.11`, `mix-blend-mode: overlay` (invisible on black, visible on light and glass, as in the reference). Light panels add their own layer at `0.35`. Static, never animated.

### 2.6 Silver text

`.text-silver`: vertical gradient `#FFFFFF → #E4E4E4 → #A3A3A3` clipped to text, with a soft dark drop shadow. Page titles, display headlines, hero figures. Darkest stop is 7.3:1 on `ink-0`. Forced-colours fallback to `CanvasText`.

## 3. Typography

### 3.1 Family

| Role | Stack | Notes |
|---|---|---|
| Everything | `"Helvetica Neue", Helvetica, Arial, sans-serif` | System fonts with nothing to download: Helvetica on Apple devices, Arial on Windows and Android. |
| Numbers | Same stack plus `font-variant-numeric: tabular-nums` (`.tabular`) | Figures align in columns. No monospace face. |

The landing page's Archivo and IBM Plex Mono are retired with the print palette.

### 3.2 Scale

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `text-caption` | 12 / 16 | 400, 500 | Timestamps, provenance, helper text |
| `text-table` | 13 / 18 | 400, 500 | Dense tables, chips |
| `text-body-sm` | 14 / 20 | 400, 500 | Default app UI text |
| `text-body` | 16 / 24 | 400 | Reading text, forms on phone (prevents iOS zoom) |
| `text-h4` | 20 / 28 | 500 | Card titles |
| `text-h3` | 24 / 32 | 700 | Section titles |
| `text-h2` | 32 / 36 | 700 | Page titles |
| `text-h1` | 48 / 52 | 400 | Landing section headlines |
| `text-display` | 72 / 72 | 400 | Landing hero on tablet and up |
| `text-display-xl` | clamp(56px, 8vw, 120px) / 0.95 | 400 | Landing hero on desktop only |
| `text-figure` | 40 / 44 | 500 | The hero number on a screen (net worth, price) |
| `text-micro` | 11 / 14, uppercase, tracking 0.06em | 500 | Badges and status pills only (`REBALANCE NEEDED`, `PAPER`, `STOP HIT`) |

- Tracking: −0.035em for display sizes, −0.02em at 32–48px, −0.01em for h4/h3, 0 below.
- Display type is weight **400**, not bold. In the reference, the large regular weight is what makes it feel expensive.
- **Silver text** (`.text-silver`, display sizes on the landing page and the hero `Figure` only): `background: linear-gradient(180deg, #FFFFFF 0%, #D9DCDA 55%, #9AA19D 100%); background-clip: text; color: transparent`, plus a solid `fg` fallback for forced-colours mode. Every stop is at least 7:1 on `ink-0`. No text-shadow glow.
- Sentence case for buttons, tabs, headings and labels. Uppercase appears **only** in `text-micro` badges, never in headings or body copy.
- Hero numbers use weight 500, not 700; heavy digits look shouty.
- Line length for reading text: 60–75 characters (`max-w-prose`).

### 3.3 Number formatting

All formatting goes through `src/lib/format.ts`.
- INR uses `en-IN` grouping (`₹10,42,380.00`); USD uses `en-US` (`$231.40`).
- The ISO code is shown when a value's currency differs from the user's base currency (`$231.40 USD` in an INR view).
- Mixed-currency totals show the converted value plus the FX rate and its age on the provenance chip.
- Right-align numbers in tables. Don't truncate prices; abbreviate only market caps and volumes (`₹1.2L Cr`, `$3.1T`).

---

## 4. Space, layout and shape

### 4.1 Spacing

4px base. Steps: `1`=4, `2`=8, `3`=12, `4`=16, `6`=24, `8`=32, `12`=48, `16`=64, `24`=96 (landing only).
- Product register: card padding 16 (phone) / 20 (desktop); gap between cards 12 / 16.
- Brand register: section padding 96 (phone 64) vertical.

### 4.2 Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 2px | Buttons, inputs, selects, segmented controls (sharp, as in the reference) |
| `rounded` / `rounded-md` | 4px | Chips, badges, checkboxes, tooltips |
| `rounded-lg` | 12px | Small glass: popovers, menus, toasts, stat chips |
| `rounded-xl` | 16px | Glass cards and panels |
| `rounded-2xl` | 20px | Dialogs, sheets, landing showcase cards |
| `rounded-full` | 9999px | Avatars, status dots, toggles |

Tables inside a card are square; the card clips them. The contrast between sharp controls and soft glass is deliberate; don't round the buttons.

### 4.3 Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 | `ink-0` + ambient light field (§2.4) + grain (§2.5) | Page |
| 1 | `glass` (§2.3) | Cards, panels, sidebar, top bar, bottom tabs |
| 1a | `ink-2` solid + 1px `line` | Inputs, hover rows and nested sections *inside* a glass card (never glass on glass for these) |
| 2 (overlay) | `glass-2` + `shadow-overlay` = `0 24px 48px -12px rgb(0 0 0 / 0.65)` | Menus, popovers, dialogs, sheets, toasts, command palette |

Only overlays cast a shadow. A dialog's scrim is `ink-0` at 60% with `blur(4px)`.

### 4.4 Grid and breakpoints

| Breakpoint | Width | Columns | Gutter | Shell |
|---|---|---|---|---|
| base | 360+ (design start) | 4 | 16 | Top bar 56 + bottom tabs 64 |
| `md` | 768+ | 8 | 24 | Same as phone |
| `lg` | 1024+ | 12 | 24 | Sidebar 64 (collapsed rail) + top bar 56 |
| `xl` | 1280+ | 12 | 32 | Sidebar 240 (expanded by default, user can collapse) |
| `2xl` | 1440+ | 12 | 32 | Content max width 1440, centred |

No horizontal page scroll at any width. Wide tables scroll inside their own container with a sticky first column.

### 4.5 Touch

Minimum target 44×44 everywhere (`min-h-11`). Compact table rows (36px) are allowed only on `lg` and up, where a pointer is assumed; the whole row is the target.

---

## 5. Iconography

- The custom set in `src/components/ui/icons.tsx`: 16px grid, 1.5px stroke, square caps. Sizes 16 (inline), 20 (nav, buttons). Add a glyph there rather than importing a library.
- Text labels come first. An icon appears where it does a job (navigation, close, search, direction, a tool) and always has a text label or `aria-label`.
- Decorative icons get `aria-hidden="true"`.
- No emoji anywhere.

### 5.1 3D assets (landing only, optional)

The look comes from glass, grain and the light field, which cost no JavaScript. A 3D element is **optional** and allowed only on the landing page, at most one per page, if it beats the CSS light field in a side-by-side review.
- Source: ThreeUI (threeui.com). Candidates that fit a monochrome finance hero: *Advanced Glass Material* (hero), *Liquid Form* and *Nocturne* (backgrounds). Rendered in greyscale only.
- Before use: confirm ThreeUI's licence allows commercial use, and record it in `MEMORY.md`.
- Budget: +150 KB gzip at most including `three`, lazy-loaded after LCP, paused offscreen and when the tab is hidden, DPR capped at 1.5.
- Fallback: a static poster image for reduced motion, low-power devices, no WebGL, and the first paint.
- Never inside the app.

---

## 6. Motion

### 6.1 Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120ms | Hover, press, colour changes |
| `duration-base` | 200ms | Popovers, tabs indicator, accordions |
| `duration-slow` | 320ms | Sheets, dialogs, sidebar collapse |
| `ease-out` (`ease-standard`) | `cubic-bezier(0.2, 0, 0, 1)` | Things entering or responding |
| `ease-in` (`ease-exit`) | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (exits run at about 70% of the enter duration) |

Animate only `transform` and `opacity` (plus `color` and `background-color` for hover). Never animate width, height, top or left.

### 6.2 Product register (allowed list)

1. Hover and press feedback (120ms).
2. Overlay enter and exit: popover fade + 4px rise; sheet slide from its edge; dialog fade + 0.98→1 scale.
3. **Price tick:** changed digits flash `up` or `down` and fade to `fg` over 600ms.
4. Skeleton pulse while loading (1.6s, opacity only).
5. First-load stagger for **card grids only** (not tables): at most 8 items, 40ms apart, 8px rise + fade, 200ms each.
6. Sidebar collapse (320ms).
7. Tab underline slides between tabs (200ms).

Anything not on this list needs a decision in `MEMORY.md`. There are no page transitions, no scroll-triggered reveals and no smooth-scroll library inside the app.

### 6.3 Brand register (landing)

- **Smooth scroll:** Locomotive Scroll v5 (Lenis under the hood), landing route only, driven by GSAP's ticker so ScrollTrigger stays in sync.
- **GSAP + ScrollTrigger + SplitText** via `useGSAP` with a scoped container, so cleanup is automatic.
- At most **2 pinned sections** per page, scrubbed (`scrub: 0.6–1`), each ending by `+=150%`.
- Reveals: 24px rise + fade, 500ms, `power2.out`, stagger ≤ 8 children at 80ms.
- Headline splits are by line or word, never by character on body copy.
- Count-ups run once when the element enters the viewport, then stay still.
- `ScrollTrigger.refresh()` runs after `document.fonts.ready` and after images load.

### 6.4 Reduced motion (hard requirement)

`prefers-reduced-motion: reduce`:
- Locomotive is never instantiated, so native scrolling is used.
- GSAP timelines are skipped and every element renders in its final state.
- Count-ups show the final value. Price ticks become a static colour for 1s. Skeletons stop pulsing.
- Nothing is hidden by default without a no-JS final state (`.reveal` starts visible unless `html.js-motion` is set).

---

## 7. Components

Primitives live in `src/components/ui/`. Domain components compose them; screens compose domain components. **A screen never styles a raw element that a primitive covers.**

Every interactive component has six states: default, hover, focus-visible, active/pressed, disabled and loading. Every data component has five: loading (skeleton), empty, error (with retry), partial/stale (amber), and success.

### 7.1 Actions

| Component | Spec |
|---|---|
| `Button` | Variants: `primary` (bg `fg` white, text `ink-0`, hover `#FFFFFF`), `secondary` (transparent, 1px `rgb(255 255 255 / 0.24)` border, text `fg`, hover border `fg-2`), `ghost` (text `fg-2`, hover `ink-2`), `danger` (border and text `down`), `paper` (bg `paper`, text `ink-0`; only for placing paper orders). Sizes `md` 44px / `sm` 32px (sm only on `lg`+ pointer UIs) / `lg` 56px (landing). Radius 2 (sharp). Green is never a button fill. Loading shows a spinner and keeps the width fixed. |
| `IconButton` | 44×44 hit area, 20px glyph, required `aria-label`, ghost style. |
| `ButtonLink` | Button styles on a `next/link`. |

### 7.2 Inputs

| Component | Spec |
|---|---|
| `Field` | Visible label above (`text-body-sm` `fg-2`), control, then hint or error below (`text-caption`, error in `down` with an icon). Wired with `aria-describedby`. |
| `Input` / `Select` / `Textarea` | `black/30` fill, 1px `control/70` border, radius 2, 44px tall, 16px text on phone. Focus: white border plus the white ring. |
| `Segmented` | Track in `ink-2` (radius 2); the selected segment is `fg` white with `ink-0` text, like a primary button. Used for period pickers (1D 1W 1M 1Y All), Real/Paper and currency. |
| `Switch` | 44px hit area; `up` when on, plus an "On"/"Off" text label. |
| `Search` | Opens the command palette; shows a `Ctrl K` hint on `lg`+. |

### 7.3 Containers

| Component | Spec |
|---|---|
| `Card` | `glass`, radius 16, padding 20 (phone 16). Optional header row: `text-micro` label or `h4` title, actions on the right. `tone` prop for semantic tints (`up`, `down`, `warn`, `paper`). No coloured stripes. |
| `Panel` | A Card with a hairline-separated header and a body that can hold a flush table. |
| `Tabs` | URL-synced. 2px `up` underline plus `fg` text on the active tab (two signals). Arrow-key navigation. Scrolls horizontally on phone with a fade-free edge. |
| `Dialog` | `glass-2` + overlay shadow, radius 20, max width 480 (confirm) / 640 (forms). Focus trapped; Escape closes; focus returns to the trigger. |
| `Sheet` | Right side panel on `lg`+, bottom sheet on phone with a drag handle and 20px top radius; `glass-2`. Used for the order ticket and filters. |
| `Popover` / `Menu` / `Tooltip` | `glass-2`, radius 12 (tooltip: solid `ink-2`, radius 4). A tooltip never holds the only copy of important information. |

### 7.4 Data display

| Component | Spec |
|---|---|
| `Figure` | The hero number: label (`caption` `fg-3`), value (`text-figure`, tabular), change below. One per view. |
| `StatStrip` | An inline row of 3–5 label/value pairs divided by hairlines. Replaces "hero metric tile grids", which are banned. |
| `Price` | Tabular price with currency and the tick flash. Takes `aria-live="polite"`, throttled to one announcement per 10s. |
| `Change` | Sign + arrow + colour + value, absolute and/or percent. The only way to render a signed value. |
| `ProvenanceChip` | Source · age · delay class (`Live`, `15m delayed`, `EOD`). Amber when stale. Shown on hover or tap, inline on phone. |
| `ModeBadge` | `Real` (neutral outline) or `Paper` (blue tint). Required on every portfolio header, order ticket and mixed list row. |
| `SyncBadge` | Broker name · last sync time · state (`Synced`, `Syncing`, `Needs reconnect` in amber). |
| `Badge` / `Chip` | Radius 4, `text-table`, tinted fill. Asset class, exchange, horizon tags. |
| `DataTable` | Lives inside one glass `Card` (rows are never glass). Sticky header (solid `ink-1`, `line-strong` bottom rule), 44px rows (36px compact on `lg`+), sortable headers with `aria-sort`, a sticky first column on overflow, and a card list under 768px. |
| `Sparkline` | 1.5px stroke, coloured by period direction, no fill, no axes, with an `aria-label` summarising the trend. |
| `Chart` | lightweight-charts on a transparent background inside a glass card, a faint dot grid (`rgb(255 255 255 / 0.05)`) instead of gridlines, crosshair in `fg-3`, candles in `up`/`down`. |
| `KeyValueList` | Label left (`fg-2`), value right (tabular `fg`), hairline rows. Trade plans use this. |
| `Allocation` | A horizontal stacked bar plus a legend table with percentages. No donuts. |

### 7.5 Feedback

| Component | Spec |
|---|---|
| `Skeleton` | `ink-2` blocks matching the final layout's shape, so there's no layout shift. |
| `EmptyState` | One sentence on what goes here, plus a single primary action. No illustration. |
| `ErrorState` | What went wrong, a `Try again` action and a reference id. Never a stack trace or host. |
| `Toast` | Bottom-left on desktop, top on phone, elevation 3. Undo action for destructive operations, 6s (10s with undo). |
| `Banner` | Full-width notice inside a page: `warn` for stale data or a needed reconnect, `paper` for paper mode. |
| `Disclaimer` | "Paper trading is simulated. Analytics are educational, not investment advice." Shown in the footer, the order ticket and the AI desk. |

### 7.6 Shell

| Component | Spec |
|---|---|
| `Sidebar` | `lg`+. `glass`, right hairline, floats 12px from the viewport edges with radius 16. Polaris mark + wordmark, search well with Ctrl K, then Home, Markets, Portfolio, News (Watchlists and Alerts join when built); Settings, user and the paper disclaimer at the bottom. Active item: `rgb(255 255 255 / 0.08)` fill + `fg` text + a 2px `fg` bar inside the item's left edge. 240px at `xl`, 76px icon rail at `lg`. |
| `TopBar` | 56px. Page title (phone) or breadcrumb (desktop), search, alerts bell with a count, portfolio switcher, user menu. |
| `BottomTabs` | Under `lg`: Home, Markets, Search, Portfolio, More. 64px + safe area. Active state is `fg` text + glyph weight change + a 2px top bar. |
| `PortfolioSwitcher` | Lists `All real`, each real account and each paper portfolio, grouped and labelled with `ModeBadge`. |
| `CommandPalette` | `Ctrl K` / `/`. Groups: Symbols, Go to, Actions. Combobox ARIA pattern. |

---

## 8. Patterns

### 8.1 Real vs paper

- **Never summed.** Net worth and the home pulse use real accounts only. Paper portfolios have their own totals.
- A paper surface carries a `paper` 2px top rule on its header, a `Paper` badge and blue primary actions. A real surface has none of these.
- Real accounts are **read-only mirrors** of the broker. No buy or sell controls render on them. The order ticket only ever books into a paper portfolio, and says so.
- Switching portfolio is explicit (the switcher). The app never silently changes which book you're looking at.

### 8.2 Data honesty

- Every live number can show its provenance. Stale numbers are amber with "as of HH:MM".
- Unknowns read "Unavailable", never `0`, `—` or a made-up value.
- In-sample backtests carry a permanent amber "In-sample" badge.
- AI output shows its sources and inputs, plus a "Model unavailable" state.

### 8.3 Page anatomy (product)

```
Page title + context (mode badge, sync badge)          [primary action]
Figure or StatStrip
Tabs (if the page has sections)
Content grid: a main column (8 of 12) + a side column (4 of 12) on xl;
single column below lg
```

### 8.4 Copy

Plain, short and specific. Buttons say what happens ("Place paper order", "Reconnect Zerodha"). Errors say what went wrong and what to do next. Sentence case. No em dashes, no exclamation marks, no hype ("to the moon", "crush the market").

---

## 9. Screen blueprints

### 9.1 Home: market pulse (the default landing after sign-in)

```
Indices strip: NIFTY 50 · SENSEX · BANK NIFTY · S&P 500 · NASDAQ · USD/INR    (session dots)
┌ Market breadth + sector heat (xl: 8 cols) ┐ ┌ Your day (4 cols)              ┐
│ Advancers / decliners bar, sector table   │ │ Real net worth  ₹xx  ▲ +0.8%   │
└───────────────────────────────────────────┘ │ Paper P&L today (blue)          │
┌ Top movers: Gainers · Losers · Volume ────┐ │ Alerts triggered (3)            │
│ table, India / US segmented               │ │ Watchlist (top 8, sparklines)   │
└───────────────────────────────────────────┘ └─────────────────────────────────┘
┌ News on your holdings and watchlist (tone-tagged) ─────────────────────────────┐
```

Phone order: indices strip (horizontal scroll), Your day, movers, news, sector heat.

### 9.2 Portfolio

Tabs: Holdings · Performance · Allocation · Risk · Activity · Journal. The header carries the switcher, ModeBadge and SyncBadge (real) or a "New paper order" button (paper).

### 9.3 Symbol `/s/[symbol]`

Header (symbol, name, exchange, currency, session, Price, Change, watchlist toggle, "Paper trade"). Tabs: Overview · Plan · AI Desk · Backtest · Fundamentals · News. Overview is chart (8 cols) + plan summary (4 cols).

### 9.4 Markets

Tabs: Overview · Movers · Ideas · Levels · Screens, with an India / US segmented control.

### 9.5 Watchlists, Alerts, News, Settings

- **Watchlists:** a list rail with the named lists and a DataTable with sparklines.
- **Alerts:** active / triggered / paused tabs; create via a sheet.
- **News:** For you (holdings + watchlist) and Markets, with tone tags.
- **Settings:** Profile, Security (Clerk), Brokers (connections with sync state, reconnect, disconnect), Preferences (base currency, density, reduced motion), Data and privacy.

### 9.6 Landing (brand register)

| # | Section | Motion |
|---|---|---|
| 1 | Nav: wordmark, two anchor links, Sign in, Request invite. Transparent at top, then `ink-0` + hairline after 24px of scroll. | Background fade |
| 2 | **Hero:** headline (display-xl), one-line subhead, two CTAs, then a stack of 2–3 `glass-hero` cards (allocation, a portfolio value with sparkline, a drift or stop alert) floating over the grainy light field, built from real components with sample data, labelled "Sample data". | Headline line-split reveal; the frame rises 40px and scales 0.94→1 on scroll |
| 3 | **Indices tape:** a static row of sample indices that drifts with scroll position (not on autoplay). | Scroll-linked x translate |
| 4 | **Pinned 1, "Real and paper, never mixed":** one portfolio frame that scrubs from a real holdings view to a paper view (badge, blue rule and totals change). | Pinned, scrubbed |
| 5 | **Pinned 2, "From symbol to plan":** a chart draws, then the entry, stop and target lines and the size readout appear in sequence. | Pinned, scrubbed (stroke-dashoffset) |
| 6 | **AI desk shows its work:** analyst cards with sources. | Staggered reveal, max 6 |
| 7 | **Risk you can read:** VaR, drawdown and concentration figures. | Count-up once |
| 8 | **Trust:** read-only broker sync, Clerk auth with MFA, paper clearly labelled, your data exportable. A plain list, not cards. Where the reference has a customer-logo strip, Polaris has a plain text line naming its data sources and brokers it reads from. Never logos of companies that don't use it. | Fade |
| 9 | **Closing CTA + footer** with the disclaimer, privacy and terms. | None |

---

## 10. Accessibility (WCAG 2.2 AA, hard gate)

- Contrast: text 4.5:1, large text and UI boundaries 3:1. All tokens in §2 pass on `ink-0` to `ink-2` and on `glass` over the app light field; landing glass follows the §2.3 contrast rule.
- Focus: 2px `fg` (white) outline with a 2px offset on every focusable element. Never removed without a visible replacement. Never obscured by sticky bars (`scroll-margin` on targets).
- Keyboard: everything is reachable and operable; the palette, tabs, tables, sheets and menus follow the ARIA APG patterns.
- Targets: 44×44 minimum.
- Colour is never the only signal (§2.2).
- Forms: visible labels, errors tied to fields, an error summary on submit for forms with more than 3 fields.
- Live regions: prices are throttled; toasts are `role="status"`.
- Reduced motion: §6.4.
- Zoom: the layout holds at 200% zoom and at 320px width with no horizontal scroll.

---

## 11. Token implementation map

| Concept | Tailwind | CSS variable |
|---|---|---|
| Surfaces | `bg-ink-0..3` | `--ink-0..3` |
| Lines | `border-line`, `border-line-strong`, `border-control` | `--line`, `--line-strong`, `--control` |
| Text | `text-fg`, `text-fg-2`, `text-fg-3` | `--fg`, `--fg-2`, `--fg-3` |
| Semantic | `up`, `down`, `warn`, `paper` | `--up`, `--down`, `--warn`, `--paper` |
| Radius | `rounded-sm/md/lg/xl/2xl/full` | `--radius-sm..2xl` |
| Glass | `glass`, `glass-2`, `glass-hero`, `glass-up/down/warn/paper` (component classes in `globals.css`) | `--glass-*`, `--blur`, `--grain` |
| Silver text | `text-silver` | |
| Shadow | `shadow-overlay`, `shadow-card` (inset highlight) | |
| Motion | `duration-fast/base/slow`, `ease-standard`, `ease-exit` | `--dur-*`, `--ease-*` |

The legacy aliases (`bgPrimary`, `textSecondary`, `accentGreen`, `glass-panel` and the rest) are deprecated. They are removed in TASKS T1.x and must not appear in new code.

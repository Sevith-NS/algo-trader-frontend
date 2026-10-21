# Polaris Frontend Coding Rules

**Date:** 2026-10-11 · Applies to everything in `frontend/`. Visual rules live in `DESIGN.md`; this file covers how code is written.

**MUST** rules are enforced in review (and by lint where possible). **SHOULD** rules can be broken with a one-line comment explaining why.

---

## 1. Workflow

1. **MUST** pick a task from `TASKS.md` before writing code. If the work isn't there, add it first.
2. **MUST** read the relevant `DESIGN.md` section before touching UI, and the Next.js docs in `node_modules/next/dist/docs/` before using an unfamiliar Next API.
3. **MUST** keep changes surgical: every changed line traces to the task. Note unrelated problems in `MEMORY.md` under "Noticed"; don't fix them in passing.
4. **MUST** run `npm run lint`, `npx tsc --noEmit` and `npm test` before calling a task done. All three are clean.
5. **MUST** check UI tasks at 360px, 768px, 1024px and 1440px, with keyboard only, and with reduced motion on.
6. **MUST** update `TASKS.md` (tick the box) and `MEMORY.md` (one log line, plus any decision) when a task is done.
7. One task per commit where practical. Message format: `T2.3: Add Sidebar with collapsed rail`.

---

## 2. TypeScript

- **MUST** keep `strict` on. No `any`. Use `unknown` and narrow it. `as` casts only at trust boundaries (API responses), each with a type from `src/types/`.
- **MUST** type every API payload in `src/types/<domain>.ts`. Components import the types; they don't redeclare shapes.
- **SHOULD** prefer `type` over `interface`, and union literals over enums.
- **SHOULD** export named functions. Default exports only where Next requires them (`page`, `layout`, `route`, `loading`, `error`).
- **MUST NOT** leave `// @ts-ignore`. Use `// @ts-expect-error <reason>` if truly unavoidable.

## 3. Files and naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase, one main component | `PortfolioSwitcher.tsx` |
| Hook | `useX.ts` in `lib/` or beside its only user | `useReducedMotion.ts` |
| Lib module | camelCase | `format.ts` |
| Test | beside the module, `.test.ts` | `format.test.ts` |
| Types | `src/types/<domain>.ts` | `types/portfolio.ts` |
| Route segments | kebab-case | `settings/brokers` |

- **SHOULD** keep a component file under ~250 lines. Split by responsibility (header, table, row), not by size alone.
- **MUST** put shared primitives in `components/ui/`, and anything that knows a domain word (portfolio, symbol, broker) in `components/<domain>/`.
- **MUST** follow the dependency direction `app → components/<domain> → components/ui → lib`.

## 4. React and Next.js

- **MUST** make components Server Components by default. Add `'use client'` only for state, effects, event handlers or browser APIs, and push it as far down the tree as possible.
- **MUST** fetch on the server with `serverGet` when the data is needed for first paint, and on the client with `useApi`. Never `fetch` the backend URL directly. All client calls go through `lib/api.ts`.
- **MUST** handle all five data states (loading, empty, error, partial/stale, success) for every data view, using `Skeleton`, `EmptyState`, `ErrorState` and `Banner`.
- **MUST** clean up effects: abort fetches, clear intervals, kill GSAP contexts (use `useGSAP`).
- **MUST** put tab, filter, sort and selected-portfolio state in the URL (`useSearchParams` / `useRouter`), not in component state.
- **MUST NOT** use `dangerouslySetInnerHTML`, inline `<script>`, or third-party script tags (the strict CSP blocks them anyway).
- **SHOULD** use `next/dynamic` for charts and anything heavier than ~30 KB that isn't needed for first paint.
- **SHOULD** derive values instead of syncing them with `useEffect`. Memoise only after measuring.
- **SHOULD** use stable `key`s from data ids, never array indexes for reorderable lists.

## 5. Styling

- **MUST** use design tokens only: `bg-ink-1`, `text-fg-2`, `border-line`, `text-up`, `rounded-lg`, `duration-base`.
- **MUST NOT** add raw hex colours, `rgb()` literals or arbitrary colour values (`bg-[#...]`) in components. If a colour is missing, it goes into `DESIGN.md` and the config first.
- **MUST NOT** use the legacy aliases (`bgPrimary`, `bgSecondary`, `bgElevated`, `textPrimary`, `textSecondary`, `textMuted`, `accent*`, `border*`, `.glass-panel`, `.hover-lift`).
- **SHOULD** avoid arbitrary values (`w-[317px]`). Allowed for one-off layout measurements tied to a real constraint (e.g. `pb-[env(safe-area-inset-bottom)]`), each with a comment.
- **MUST NOT** use inline `style={{}}` except for values computed at runtime (chart sizes, progress widths, CSS variables).
- **MUST** get glass only from the `glass-*` classes or `Card`/overlay primitives. Never hand-roll `backdrop-blur`, and never put glass on table rows or list items.
- **MUST NOT** add gradients except the three sanctioned ones in `DESIGN.md` §1.3 (light field, glass sheen, `text-silver`).
- **MUST** compose classes with `cn()` from `lib/utils.ts`. Variants are `Record<Variant, string>` maps beside the component.
- **MUST** build mobile-first: base classes for 360px, then `md:`, `lg:`, `xl:`.
- **MUST** use `.tabular` (or the `Price`/`Change`/`Figure` components) for every number shown in a column or that updates live.

## 6. Accessibility

- **MUST** use semantic elements first: `button` for actions, `a`/`Link` for navigation, `table` for tabular data, headings in order (one `h1` per page).
- **MUST** give every icon-only control an `aria-label`, and mark decorative glyphs `aria-hidden="true"`.
- **MUST** keep the global focus ring. If a component replaces it, the replacement must be at least as visible.
- **MUST** make targets 44×44 at minimum (`min-h-11 min-w-11`).
- **MUST** render signed values only through `Change` (sign + arrow + colour).
- **MUST** label form controls with visible labels linked by `htmlFor`/`id`, and tie errors with `aria-describedby`.
- **MUST** follow the ARIA APG pattern for tabs, menus, dialogs, combobox (palette) and sortable tables, and return focus to the trigger when an overlay closes.
- **MUST** throttle live regions (prices: one announcement per 10s per symbol).

## 7. Motion

- **MUST** use motion tokens (`duration-fast/base/slow`, `ease-standard/exit`) and animate only `transform`, `opacity` and colours.
- **MUST** gate every JS animation on `useReducedMotion()`. CSS animations are covered by the global block in `globals.css`.
- **MUST NOT** import `locomotive-scroll`, `gsap/ScrollTrigger` or `gsap/SplitText` outside `components/landing/`.
- **MUST** make anything that starts hidden for a reveal visible without JavaScript and under reduced motion.
- **MUST NOT** loop animations in the product register (skeleton pulse is the one exception).

## 8. Data, money and honesty

- **MUST** format every number, currency, percentage and date with `lib/format.ts`. No `toFixed` or `Intl.NumberFormat` in components.
- **MUST** carry currency with every money value (`{ amount, currency }` or a typed field). Never assume INR or USD.
- **MUST NOT** sum real and paper values anywhere, and must label every portfolio surface with `ModeBadge`.
- **MUST NOT** render buy or sell controls for a real (broker-synced) account.
- **MUST** show "Unavailable" for missing data, never `0`, `NaN`, `—` or an invented value. Stale data shows amber with an "as of" time.
- **MUST** keep pure financial logic (sizing, P&L, allocation maths) in `lib/` with unit tests.

## 9. Errors and security

- **MUST** show users `errorMessage(err)` (message plus reference id). Never print stack traces, hosts or ports.
- **MUST** keep secrets server-side. Only `NEXT_PUBLIC_*` variables may be read in client code, and only Clerk's publishable key is public.
- **MUST** import `server-only` in any module that reads server env vars or Clerk server helpers.
- **MUST** confirm destructive actions (typed confirmation for irreversible ones) and offer undo where the backend supports it.
- **MUST NOT** log tokens, broker data or personal data to the console.

## 10. Copy

- Sentence case, plain words, no em dashes, no exclamation marks.
- Buttons name the outcome: "Place paper order", "Reconnect Zerodha", "Delete watchlist".
- Errors say what happened and what to do next.
- Never use advice language in discovery or AI surfaces ("buy recommendation", "target price"). Use "plan", "level", "setup".

## 11. Testing

- **MUST** unit test every function in `lib/` that does maths, formatting or parsing (`node:test`, `assert/strict`).
- **SHOULD** add a fixture test when fixing a bug in `lib/`, written to fail before the fix.
- UI is verified manually against the checklist in §1.5 until an E2E harness exists (TASKS T7.5).

## 12. Dependencies

- **MUST** ask before adding a dependency, and record why in `MEMORY.md`.
- **MUST NOT** add a UI kit, icon library, CSS-in-JS library or a second animation library. Primitives are built here.
- Remove what you make unused.

## 13. Definition of done

- [ ] Task acceptance criteria in `TASKS.md` met
- [ ] Lint, typecheck and tests clean
- [ ] Checked at 360 / 768 / 1024 / 1440, keyboard only, reduced motion
- [ ] All data states designed (loading, empty, error, stale, success)
- [ ] No raw hex, legacy aliases or new arbitrary values
- [ ] `TASKS.md` ticked, `MEMORY.md` log line added

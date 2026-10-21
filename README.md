# Polaris — Quant Screener & Portfolio Intelligence

A personal stock screener and portfolio management platform with quant-grade analytics:

- **Terminal (Screener)** — candlestick charting with a systematic multi-factor **Quant Trade Plan**: limit entry, ATR/swing-based stop loss, 1.5R / 3R targets, factor vote breakdown (mean reversion, momentum, VWAP, volume flow, RSI) and **half-Kelly position sizing**.
- **Portfolio** — paper trading with live prices, **risk analytics** (95% VaR & CVaR in dollars, Sharpe, Sortino, max drawdown, beta vs S&P 500, diversification score), sector allocation, and Markowitz max-Sharpe optimization.
- **News** — global headlines across 8 market categories, each scored with NLP sentiment, plus a global market mood gauge.
- **Trading Desk** — a multi-agent decision pipeline on the Terminal: four specialist analysts
  (fundamentals, technical, news, sentiment/flow) file report cards, a bull and a bear **debate**
  over 1-4 rounds with a required rebuttal each round, a research manager writes the thesis, a
  trader takes the quant engine's solved levels, three risk seats (aggressive/neutral/conservative)
  argue position size against half-Kelly and portfolio VaR, and a **portfolio manager** approves or
  refuses with an executable share count. Streams turn by turn over SSE. Every decision is
  journalled and later scored on **realized alpha vs the S&P 500**, and past hits and misses on the
  same ticker are fed back into the next run's prompts.
- **Backtest** — a full event-driven backtester on the Terminal, over every bar Yahoo
  holds (decades on daily, not the two years a charting site's tester gives you). 13
  strategies including a Pine v6 port; signals form at a bar's close and fill at the next
  open, commission and slippage are charged on both sides, and a bar holding both a stop
  and a target is assumed to have hit the stop. Date range, cost model, stops and sizing
  are all set in the panel, and the report carries the professional stat block — Calmar,
  Ulcer, Omega, MAE/MFE, a drawdown table, a monthly grid and the trade log — plus three
  robustness passes: **out-of-sample**, **walk-forward** and a **Monte Carlo** resample.
- **Polaris AI** — floating assistant (bottom-right on every page) powered by Gemini. It sees your paper portfolio, the symbol on screen, live quant signals and news sentiment, and answers grounded questions about risk, sizing and markets.
- **ML Forecasts** — XGBoost next-day direction probability, Prophet 7-day forecast, news fear/greed index.
- **Geotrade** — AI macro analysis per country on a 3D globe.

## Architecture

The repo is split into two independently deployable services:

```
algo-trader/
├── frontend/          Next.js 16 app (App Router, Tailwind) — port 3000
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example   copy to .env.local
└── backend/           Flask quant/data API — port 5000
    ├── app.py
    ├── requirements.txt
    └── .env.example   copy to .env
```

They talk over HTTP only: the frontend's server-side BFF proxy reads `FLINT_API_URL` (see
`frontend/src/app/api/backend`) and the backend allows CORS on `/api/*`. There is no
shared code or build step between them, so either can be deployed on its own.

- `frontend/src/` — Next.js 16 (App Router, Tailwind) frontend on port 3000
- `backend/` — Flask quant/data backend on port 5000
  - `quant_models.py` — multi-factor signal engine + trade levels + Kelly sizing
  - `risk_analytics.py` — VaR/CVaR, Sharpe/Sortino, drawdown, beta, correlations
  - `news_engine.py` — Google News RSS + VADER sentiment (5-min cache)
  - `ai_assistant.py` — Gemini chat grounded in live portfolio/signal context
  - `ml_models.py` — XGBoost, Prophet, Markowitz optimization
  - `agents_desk.py` — multi-agent trading desk: analyst team, bull/bear debate,
    risk committee, PM sign-off, plus the alpha-scored decision journal that
    feeds the reflection memory
  - `backtest/` — event-driven backtester: `engine.py` (target-position fills,
    costs, stops), `riskengine.py` (risk sizing, scale-outs, per-leg exits),
    `swingpro.py` (the Pine v6 port), `indicators.py` (TradingView-equivalent,
    Wilder's smoothing), `metrics.py`, `analysis.py` (out-of-sample,
    walk-forward, Monte Carlo) and `service.py` (request → JSON)
  - `llm_router.py` — OmniRoute fallback transport, engaged only once Gemini
    reports its quota is gone (see "Surviving the Gemini rate limit" below)
  - `geotrade_layer.py` — country macro analysis

## Surviving the Gemini rate limit

One trading-desk run is roughly `10 + 2 x rounds` model calls — 14 at the
default 2 rounds. A free-tier Gemini key will exhaust its per-minute quota
partway through, which used to leave the later seats empty.

Two mitigations, in order:

1. **Retry with backoff** (`agents_desk.py`) — handles the common case where the
   quota is a per-minute window and the next attempt succeeds.
2. **OmniRoute fallback** (`llm_router.py`, optional) — when Gemini says it is
   out of quota, remaining seats are served by a local
   [OmniRoute](https://github.com/diegosouzapw/OmniRoute) gateway instead.

The fallback is deliberately strict, so the desk does not quietly stop being a
Gemini app:

- Gemini is **always** tried first. Nothing routes through OmniRoute while
  Gemini is answering.
- Traffic only moves after a 429 / `RESOURCE_EXHAUSTED`, and Gemini is benched
  for exactly the `retryDelay` it asked for (falling back to 90s if it did not
  say). A short per-minute 429 can never release a longer bench.
- When the bench lapses the next call goes back to Gemini.
- If OmniRoute is not installed, the backend behaves exactly as it did before.
- The UI says so: the run emits a one-shot failover notice, and the `done` event
  reports how many seats the fallback served.

```bash
npm install -g omniroute     # ~830 MB unpacked
omniroute serve              # OpenAI-compatible gateway on :20128
```

Nothing else is required — OmniRoute ships with free keyless providers, so the
fallback works with no configuration. To pin it to your own keys and ordering,
use `omniroute keys add` and a `priority` combo. Settings live in
`backend/.env` (see `.env.example`); `OMNIROUTE_ENABLED=0` disables it outright.

`GET /api/agents/routing` reports where desk calls are currently going, which
distinguishes "quota exhausted, rerouted" from "quota exhausted, no fallback
installed".

## How the backtester avoids lying to you

The engines are a direct port of a standalone desktop tester, and they are verified
bar-for-bar against it — same fills, same costs, same trade log on the same frame.
The conventions are all deliberately pessimistic:

- **Signals form at a bar's close and fill at the next bar's open.** No look-ahead.
  The risk-sized engine fills at the signal bar's close instead (matching Pine's
  `process_orders_on_close`), and the stop it places there only goes live next bar.
- **Costs are charged on both sides** of every trade — slippage on price, commission
  on notional. Buy & hold is charged one round trip so the comparison is fair.
- **Stops are checked intrabar** against the real high and low. When a stop and a
  target both sit inside one bar, the stop is assumed to hit first.
- **A gap through the stop fills at the open**, not at the stop price.
- **Wilder's smoothing (`ta.rma`)** is used for RSI, ATR and ADX, exactly as Pine does.
  Using a simple mean here is the usual reason a Python port disagrees with TradingView.

Three passes attack the result from different sides, because a single backtest over all
available history answers the question least worth asking:

| Pass | What it does |
| --- | --- |
| Out-of-sample | Holds back the tail, fits nothing to it, looks once |
| Walk-forward | Re-optimises on a rolling window, trades the window after it, and stitches those untouched segments into one curve |
| Monte Carlo | Keeps the trades, resamples their order, and reports the spread rather than the one path that happened |

`backtest/data.py` draws bars from `data_source` rather than opening a second connection
to Yahoo, so a backtest shares the throttle, cache and stale-if-error fallback the rest of
the backend uses. Full daily history goes through `data_source.get_ohlc_max`: asking Yahoo
for `range=max&interval=1d` quietly returns coarsened bars (~170 quarterly candles for
AAPL rather than 11,500 daily ones), so that path asks with an explicit date window instead.

## Getting Started

### 1. Backend (Flask, port 5000)

```bash
cd backend
(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& c:\Users\asus\Desktop\algo-trader-backend\venv\Scripts\Activate.ps1)
./venv/bin/pip install -r requirements.txt
cp .env.example .env      # then fill in GEMINI_API_KEY
./run.sh
```

`run.sh` handles a macOS quirk: on machines behind a TLS-intercepting corporate proxy it
exports the system keychain CAs so Yahoo Finance / Google News / Gemini requests don't fail
with certificate errors. (`./venv/bin/python app.py` also works on a normal network.)
XGBoost on macOS needs OpenMP: `brew install libomp`.

Secrets live in `backend/.env` (gitignored; template in `backend/.env.example`). The Gemini
key powers the AI assistant, deep analysis and Geotrade:

```
GEMINI_API_KEY=your_key_here
```

### 2. Frontend (Next.js, port 3000)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run this in a second terminal — the two
services are separate processes.

`.env.local` holds `FLINT_API_URL` (defaults to `http://127.0.0.1:5000`) and the Clerk
keys; template in `frontend/.env.example`. `FLINT_API_URL` is server-only: the Next.js
server calls the API, so the browser never sees it.

### 3. Deploying the frontend to Vercel

Vercel builds one directory, so point it at the frontend rather than the repo root:

- **Root Directory** → `frontend` (Project Settings → General)
- **Environment Variables** → `FLINT_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

The Flask backend is *not* deployed by this — it needs its own host (Render, Railway, Fly,
a VPS) with `GEMINI_API_KEY` set there, and its public URL becomes `FLINT_API_URL`.

## Key API Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /api/quant-signals?symbol=` | Multi-factor signal, entry/stop/targets, Kelly sizing |
| `POST /api/portfolio-analytics` | VaR, CVaR, Sharpe, Sortino, drawdown, beta, sectors |
| `GET /api/news` | Global news with per-headline sentiment + mood indices |
| `GET /api/news/ticker?symbol=` | Ticker-specific headlines + sentiment |
| `POST /api/ai-chat` | Portfolio-aware Gemini assistant |
| `GET /api/ml-insights?symbol=` | XGBoost direction, Prophet forecast, fear/greed |
| `POST /api/portfolio-optimization` | Markowitz max-Sharpe weights + CAPM betas |
| `GET /api/backtest/strategies` | Strategy catalogue with every parameter and its default |
| `POST /api/backtest/run` | One backtest + out-of-sample split + Monte Carlo |
| `POST /api/backtest/optimize` | Parameter sweep, streamed as SSE |
| `POST /api/backtest/walk-forward` | Rolling optimise-then-trade folds, streamed as SSE |

> All trading is paper trading. Signals and analytics are educational, not financial advice.

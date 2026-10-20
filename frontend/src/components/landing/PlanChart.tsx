import { CANDLES, LEVELS } from './planData';

/**
 * The landing page's example plan chart. Hollow candles close up, filled
 * candles close down, so direction never depends on colour alone. Rendered
 * finished on the server; LandingMotion draws it in on scroll.
 */
const W = 1000;
const H = 560;
const PLOT_W = 860;
const TOP = 24;
const BOTTOM = 536;
const P_MIN = 2830;
const P_MAX = 3045;

const y = (p: number) => TOP + ((P_MAX - p) / (P_MAX - P_MIN)) * (BOTTOM - TOP);
const slot = PLOT_W / CANDLES.length;

const LEVEL_STROKE: Record<string, string> = {
  t2: 'var(--fg-2)', t1: 'var(--fg-2)', entry: 'var(--fg)', stop: 'var(--red)',
};

export function PlanChart() {
  const entryY = y(LEVELS[2].price);
  const stopY = y(LEVELS[3].price);
  const t2Y = y(LEVELS[0].price);
  const zoneX = PLOT_W * 0.66;

  return (
    <div className="relative aspect-[1000/560] w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img"
           aria-label="Illustrative daily candles with a plan's entry, stop and two targets drawn as horizontal levels.">
        {[2850, 2900, 2950, 3000].map((p) => (
          <line key={p} x1="0" x2={W} y1={y(p)} y2={y(p)} stroke="rgb(255 255 255 / 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}

        <rect data-zone x={zoneX} y={t2Y} width={PLOT_W - zoneX} height={entryY - t2Y} fill="var(--green)" opacity="0.08" />
        <rect data-zone x={zoneX} y={entryY} width={PLOT_W - zoneX} height={stopY - entryY} fill="var(--red)" opacity="0.14" />

        {CANDLES.map((c, i) => {
          const cx = slot * i + slot / 2;
          const up = c.close >= c.open;
          const top = y(Math.max(c.open, c.close));
          const h = Math.max(1.5, y(Math.min(c.open, c.close)) - top);
          const tone = up ? 'var(--green)' : 'var(--red)';
          return (
            <g key={i} data-candle>
              <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={tone} strokeWidth="1.5" opacity="0.8" />
              <rect x={cx - 4.5} y={top} width="9" height={h} rx="1"
                    fill={up ? 'transparent' : tone} stroke={tone} strokeWidth="1.5" />
            </g>
          );
        })}

        {LEVELS.map((l) => (
          <line key={l.key} data-level={l.key} x1="0" x2={PLOT_W} y1={y(l.price)} y2={y(l.price)}
                stroke={LEVEL_STROKE[l.key]}
                strokeWidth={l.key === 'entry' || l.key === 'stop' ? 2.5 : 1.5}
                strokeDasharray={l.key.startsWith('t') ? '10 6' : undefined} />
        ))}
      </svg>

      {/* Labels are HTML so they stay readable at phone width. */}
      {LEVELS.map((l) => (
        <div key={l.key} data-level-label
             className={`absolute right-0 w-[14%] -translate-y-1/2 pl-2 text-[10px] font-bold uppercase leading-tight tracking-[0.06em] sm:text-[11px] ${l.key === 'stop' ? 'text-down' : 'text-fg'}`}
             style={{ top: `${(y(l.price) / H) * 100}%` }}>
          <span className="block">{l.label}</span>
          <span className="hidden font-normal text-fg-2 sm:block">{l.note}</span>
        </div>
      ))}
    </div>
  );
}

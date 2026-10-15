'use client';

import { useEffect, useRef } from 'react';
import { ColorType, LineSeries, LineStyle, createChart, type Time } from 'lightweight-charts';
import { cssVar } from '@/lib/theme';

type Point = { date: string; index: number };

const toLine = (points: Point[]) => points.map((p) => ({ time: p.date as Time, value: p.index }));

/**
 * Growth of 100 for the portfolio against its benchmark, on one axis. The
 * portfolio line is paper blue for simulated money and white for real money.
 */
export function PerformanceChart({ portfolio, benchmark, paper, height }: {
  portfolio: Point[]; benchmark?: Point[]; paper: boolean; height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: cssVar('--fg-2') },
      autoSize: true,
      height,
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      crosshair: { mode: 1 },
    });
    if (benchmark?.length) {
      chart.addSeries(LineSeries, {
        color: cssVar('--fg-3'), lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true,
      }).setData(toLine(benchmark));
    }
    chart.addSeries(LineSeries, {
      color: cssVar(paper ? '--paper' : '--fg'), lineWidth: 2, priceLineVisible: false,
    }).setData(toLine(portfolio));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [portfolio, benchmark, paper, height]);

  return <div ref={ref} style={{ height }} className="w-full" aria-hidden="true" />;
}

"use client";
import { useState } from 'react';
import { ExternalLink } from '@/components/ui/icons';
import { Tone } from '@/components/ui/Tone';
import { timeAgo } from '@/lib/format';
import type { Failed, NewsArticle, NewsIntel } from '../../types/intel';

const STANCE_WORD = { bullish: 'Positive', bearish: 'Negative', neutral: 'Neutral' } as const;
const SHOWN = 8;

function Story({ a }: { a: NewsArticle }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body-sm font-medium text-fg group-hover:underline group-hover:underline-offset-4">
          {a.title}
          {a.link && <ExternalLink size={12} aria-hidden="true" className="ml-1.5 inline align-baseline text-fg-3" />}
        </span>
        <span className="text-caption text-fg-3">
          {a.source ?? 'Unknown outlet'}
          {a.published && <> · <time dateTime={a.published}>{timeAgo(a.published)}</time></>}
        </span>
      </span>
      <Tone score={a.sentiment_score} className="shrink-0 pt-0.5" />
    </>
  );
  return (
    <li className="border-b border-line">
      {a.link ? (
        <a href={a.link} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-4 py-3">
          {body}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <div className="flex items-start justify-between gap-4 py-3">{body}</div>
      )}
    </li>
  );
}

/**
 * News for one symbol: headlines from several outlets, each scored for tone,
 * plus the recency-weighted overall read (0 to 100) and how much to trust it.
 */
export default function NewsIntelPanel({ data }: { data: NewsIntel | Failed | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!data || 'error' in data || !data.articles) return null;

  const { bullish, neutral, bearish } = data.breakdown;
  const total = Math.max(1, bullish + neutral + bearish);
  const shown = expanded ? data.articles : data.articles.slice(0, SHOWN);

  return (
    <section aria-labelledby="news-intel-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="news-intel-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />News tone</h2>
        <p className="text-body-sm text-fg-2">
          {data.article_count} stories from {data.distinct_outlets} outlets, newest weighted most.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-y border-line py-4">
        <p className="flex items-baseline gap-2">
          <span className="text-h3 font-bold tabular">{data.rating}</span>
          <span className="text-body-sm text-fg-2">of 100 · {STANCE_WORD[data.stance]}</span>
        </p>
        <p className="text-body-sm text-fg-2">Confidence <span className="font-medium text-fg">{data.confidence}</span></p>
        <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
          <span aria-hidden="true" className="flex h-1.5 w-full bg-white/[0.06]">
            <span className="bg-up" style={{ width: `${(bullish / total) * 100}%` }} />
            <span className="bg-fg-3" style={{ width: `${(neutral / total) * 100}%` }} />
            <span className="bg-down" style={{ width: `${(bearish / total) * 100}%` }} />
          </span>
          <span className="flex justify-between text-caption text-fg-2 tabular">
            <span>▲ {bullish} positive</span><span>{neutral} neutral</span><span>▼ {bearish} negative</span>
          </span>
        </div>
      </div>

      <ul>{shown.map((a, i) => <Story key={`${a.link ?? a.title}-${i}`} a={a} />)}</ul>

      {data.articles.length > SHOWN && (
        <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}
                className="min-h-11 self-start text-body-sm text-fg-2 underline underline-offset-4 hover:text-fg">
          {expanded ? 'Show fewer stories' : `Show all ${data.articles.length} stories`}
        </button>
      )}

      <p className="max-w-prose text-caption text-fg-3">
        Sources: {data.sources_scanned?.join(', ')}. Tone is scored per headline by a finance-tuned sentiment model
        and weighted toward the last three days. It describes coverage, not where the price will go.
      </p>
    </section>
  );
}

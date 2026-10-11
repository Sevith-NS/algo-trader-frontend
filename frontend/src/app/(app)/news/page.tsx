'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ExternalLink, RefreshCw } from '@/components/ui/icons';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { Tone } from '@/components/ui/Tone';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/useApi';

interface Article {
  title: string;
  /** Null when the feed's link wasn't plain http(s). */
  link: string | null;
  source: string | null;
  published: string | null;
  sentiment_score: number;
  sentiment: string;
  category: string;
}

interface CategoryData {
  articles: Article[];
  avg_sentiment: number;
  mood_index: number;
}

interface NewsData {
  overall_mood_index: number;
  overall_sentiment: string;
  categories: Record<string, CategoryData>;
  latest: Article[];
}

const CATEGORY_LABELS: Record<string, string> = {
  markets: 'Markets',
  economy: 'Economy',
  crypto: 'Crypto',
  commodities: 'Commodities',
  forex: 'Forex',
  asia: 'Asia',
  europe: 'Europe',
  tech: 'Tech',
};

const label = (key: string) => CATEGORY_LABELS[key] ?? key;

/** Tone index on 0 to 100, where 50 is neutral. */
function moodWord(index: number) {
  return index >= 55 ? 'Positive' : index <= 45 ? 'Negative' : 'Neutral';
}

/** Feeds append " - Outlet" to titles; the outlet is already shown beside it. */
function cleanTitle(a: Article) {
  return a.source && a.title.endsWith(` - ${a.source}`) ? a.title.slice(0, -(a.source.length + 3)) : a.title;
}

function MoodBar({ index }: { index: number }) {
  const word = moodWord(index);
  return (
    <span aria-hidden="true" className="relative h-1.5 w-full bg-ink-2">
      <span className={clsx('absolute inset-y-0 left-0',
        word === 'Positive' ? 'bg-up' : word === 'Negative' ? 'bg-down' : 'bg-fg-3')}
            style={{ width: `${Math.max(0, Math.min(100, index))}%` }} />
      <span className="absolute inset-y-0 left-1/2 w-px bg-fg-3" />
    </span>
  );
}

function Headline({ a }: { a: Article }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body-sm font-medium text-fg group-hover:underline group-hover:underline-offset-4">
          {cleanTitle(a)}
          {a.link && <ExternalLink size={12} aria-hidden="true" className="ml-1.5 inline align-baseline text-fg-3" />}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-caption text-fg-3">
          <span>{label(a.category)}</span>
          {a.source && <><span aria-hidden="true">·</span><span>{a.source}</span></>}
          {a.published && <><span aria-hidden="true">·</span><time dateTime={a.published}>{timeAgo(a.published)}</time></>}
        </span>
      </span>
      <Tone score={a.sentiment_score} className="shrink-0 pt-0.5" />
    </>
  );
  return (
    <li className="border-b border-line">
      {a.link ? (
        <a href={a.link} target="_blank" rel="noopener noreferrer"
           className="group flex items-start justify-between gap-4 py-3">
          {body}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <div className="flex items-start justify-between gap-4 py-3">{body}</div>
      )}
    </li>
  );
}

export default function NewsPage() {
  const { data, error, loading, reload } = useApi<NewsData>('/api/news');
  const [category, setCategory] = useState('all');

  const keys = data ? Object.keys(data.categories) : [];
  const articles = !data ? [] : category === 'all' ? data.latest : data.categories[category]?.articles ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h3 font-bold">News</h1>
          <p className="max-w-prose text-body-sm text-fg-2">
            Headlines from public feeds, each scored for tone by a sentiment model. Tone is not a forecast.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={reload} loading={loading && Boolean(data)}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </Button>
      </div>

      {loading && !data ? (
        <LoadingBlock lines={8} label="Loading news" />
      ) : error && !data ? (
        <ErrorState error={error} title="Couldn't load the news" onRetry={reload} />
      ) : data && (
        <>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1 border-y border-line py-4">
            <p className="flex items-baseline gap-3">
              <span className="text-body-sm text-fg-2">Overall tone</span>
              <span className="text-h4 font-bold tabular">{data.overall_mood_index}</span>
              <span className="text-body-sm text-fg-2">of 100 · {moodWord(data.overall_mood_index)}</span>
            </p>
            <p className="text-caption text-fg-3">0 is all negative, 50 neutral, 100 all positive.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <section aria-label="Headlines" className="flex min-w-0 flex-col gap-2">
              <Tabs idPrefix="news" label="Category" value={category} onChange={setCategory}
                    tabs={[{ id: 'all', label: 'All' }, ...keys.map((k) => ({ id: k, label: label(k) }))]} />
              <div role="tabpanel" id={`news-panel-${category}`} aria-labelledby={`news-tab-${category}`}>
                {articles.length ? (
                  <ul>{articles.map((a, i) => <Headline key={`${a.link ?? a.title}-${i}`} a={a} />)}</ul>
                ) : (
                  <EmptyState title="No headlines here right now" className="mt-4">
                    Feeds refresh every few minutes. Try another category or check back shortly.
                  </EmptyState>
                )}
              </div>
            </section>

            <section aria-labelledby="tone-h" className="flex flex-col gap-3">
              <h2 id="tone-h" className="text-body font-bold">Tone by category</h2>
              <ul className="flex flex-col">
                {keys.map((k) => {
                  const idx = data.categories[k].mood_index;
                  return (
                    <li key={k}>
                      <button type="button" onClick={() => setCategory(category === k ? 'all' : k)}
                              aria-pressed={category === k}
                              aria-label={`${label(k)}: ${idx} of 100, ${moodWord(idx)}`}
                              className={clsx('grid min-h-11 w-full grid-cols-[6rem_1fr_2rem] items-center gap-3 text-left text-body-sm',
                                category === k ? 'font-medium text-fg' : 'text-fg-2 hover:text-fg')}>
                        <span>{label(k)}</span>
                        <MoodBar index={idx} />
                        <span className="text-right tabular">{idx}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="text-caption text-fg-3">Select a category to filter the headlines.</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

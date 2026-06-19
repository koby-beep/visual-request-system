'use client';

import { useEffect, useState } from 'react';
import { VisualRequest } from '@/types';
import { getPriority, PRIORITY_CONFIG } from '@/lib/priority';
import { STATUS_CONFIG } from '@/lib/status';

const TYPE_COLORS: Record<string, string> = {
  'SMM ad':       'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900',
  'PPC ad':       'bg-pink-50   text-pink-700   border border-pink-200   dark:bg-pink-950   dark:text-pink-400   dark:border-pink-900',
  'Poster':       'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900',
  'Landing page': 'bg-cyan-50   text-cyan-700   border border-cyan-200   dark:bg-cyan-950   dark:text-cyan-400   dark:border-cyan-900',
  'Video':        'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900',
};

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-sm leading-none ${rating >= s ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}>★</span>
      ))}
    </div>
  );
}

export default function HistoryView() {
  const [requests, setRequests] = useState<VisualRequest[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/requests', { cache: 'no-store' })
      .then(r => r.json())
      .then((all: VisualRequest[]) => {
        setRequests(all.filter(r => r.status === 'done'));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm gap-2">
        <span className="text-3xl">🗂️</span>
        No completed requests yet
      </div>
    );
  }

  // Group by brand (empty brand → "Other")
  const groups: Record<string, VisualRequest[]> = {};
  for (const r of requests) {
    const key = r.brand || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  const sortedGroups = Object.entries(groups).sort(([a], [b]) =>
    a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)
  );

  return (
    <div className="flex flex-col gap-8">
      {sortedGroups.map(([brand, items]) => (
        <section key={brand}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{brand}</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{items.length} request{items.length !== 1 ? 's' : ''}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(r => {
              const p = getPriority(r.date);
              const typeColor = TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
              const thumb = r.deliverables?.[0];

              return (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                  {/* Deliverable thumbnail */}
                  {thumb ? (
                    <img
                      src={thumb}
                      alt="Deliverable"
                      onClick={() => window.open(thumb, '_blank')}
                      className="w-full h-28 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-300 dark:text-gray-600 text-2xl">
                      🎨
                    </div>
                  )}

                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColor}`}>{r.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_CONFIG[p].className}`}>{PRIORITY_CONFIG[p].label}</span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.requester}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(r.date)} · {r.visuals.length} visual{r.visuals.length !== 1 ? 's' : ''}</p>

                    <Stars rating={r.rating} />

                    <span className={`self-start mt-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[r.status].className}`}>
                      {STATUS_CONFIG[r.status].label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

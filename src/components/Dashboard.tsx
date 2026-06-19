'use client';

import { useCallback, useEffect, useState } from 'react';
import { Status, VisualRequest } from '@/types';
import { getDaysLeft, getPriority, PRIORITY_CONFIG, PRIORITY_ORDER } from '@/lib/priority';

type Filter = 'all' | Status;

const TYPE_COLORS: Record<string, string> = {
  'SMM ad':       'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900',
  'PPC ad':       'bg-pink-50   text-pink-700   border border-pink-200   dark:bg-pink-950   dark:text-pink-400   dark:border-pink-900',
  'Poster':       'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900',
  'Landing page': 'bg-cyan-50   text-cyan-700   border border-cyan-200   dark:bg-cyan-950   dark:text-cyan-400   dark:border-cyan-900',
  'Video':        'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900',
};

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatCard({ n, label, color }: { n: number; label: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className={`text-3xl font-medium leading-none mb-1 ${color ?? 'text-gray-900 dark:text-white'}`}>{n}</div>
      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'pending',     label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'done',        label: 'Done' },
];

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [requests, setRequests] = useState<VisualRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetch_ = useCallback(async () => {
    const res = await fetch('/api/requests', { cache: 'no-store' });
    setRequests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); fetch_(); }, [fetch_, refreshKey]);

  const updateStatus = async (id: string, status: Status) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetch_();
  };

  const del = async (id: string) => {
    if (!confirm('Remove this request?')) return;
    await fetch(`/api/requests/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const today = new Date().toISOString().split('T')[0];
  const urgent   = requests.filter(r => getPriority(r.date) === 'urgent' && r.status !== 'done').length;
  const dueToday = requests.filter(r => r.date === today && r.status !== 'done').length;
  const done     = requests.filter(r => r.status === 'done').length;

  const filtered = (filter === 'all' ? requests : requests.filter(r => r.status === filter))
    .slice()
    .sort((a, b) => {
      const pd = PRIORITY_ORDER.indexOf(getPriority(a.date)) - PRIORITY_ORDER.indexOf(getPriority(b.date));
      return pd !== 0 ? pd : new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard n={requests.length} label="Total" />
        <StatCard n={urgent}          label="Urgent"    color="text-red-600 dark:text-red-400" />
        <StatCard n={dueToday}        label="Due today" color="text-amber-600 dark:text-amber-400" />
        <StatCard n={done}            label="Completed" color="text-green-600 dark:text-green-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={fetch_}
          className="ml-auto text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm gap-2">
          <span className="text-3xl">📭</span>
          No requests to show
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const p    = getPriority(r.date);
            const days = getDaysLeft(r.date);
            const daysText  = days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`;
            const daysColor = days < 0
              ? 'text-red-600 dark:text-red-400 font-semibold'
              : days === 0
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-gray-500 dark:text-gray-400';
            const typeColor = TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                {/* ── Card header ── */}
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_CONFIG[p].className}`}>
                        {PRIORITY_CONFIG[p].label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${typeColor}`}>
                        {r.type}
                      </span>
                      {r.brand && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          {r.brand}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">by {r.requester}</span>
                    </div>
                    <p className={`text-xs ${daysColor}`}>
                      {fmtDate(r.date)} · {daysText} · {r.visuals.length} visual{r.visuals.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value as Status)}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      onClick={() => del(r.id)}
                      aria-label="Delete"
                      className="p-1.5 text-gray-300 dark:text-gray-600 rounded-lg hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Visuals list ── */}
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {r.visuals.map((v, i) => (
                    <div
                      key={i}
                      className={`px-4 py-3 flex gap-3 items-start ${
                        i < r.visuals.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''
                      }`}
                    >
                      {/* Visual number */}
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-14 shrink-0 pt-0.5">
                        Visual {i + 1}
                      </span>

                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        {/* Size chip */}
                        {v.size && (
                          <span className="inline-flex self-start text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                            {v.size}
                          </span>
                        )}

                        {/* Content */}
                        {v.content && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{v.content}</p>
                        )}

                        {/* Reference */}
                        {(v.referenceUrl || v.referenceImage) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {v.referenceUrl && (
                              <a
                                href={v.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2 max-w-[240px] truncate"
                              >
                                {v.referenceUrl}
                              </a>
                            )}
                            {v.referenceImage && (
                              <img
                                src={v.referenceImage}
                                alt="Reference"
                                title="Click to view full size"
                                onClick={() => window.open(v.referenceImage, '_blank')}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

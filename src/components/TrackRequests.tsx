'use client';

import { useState } from 'react';
import { VisualRequest } from '@/types';
import { getDaysLeft, getPriority, PRIORITY_CONFIG } from '@/lib/priority';
import { STATUS_CONFIG } from '@/lib/status';

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const TYPE_COLORS: Record<string, string> = {
  'SMM ad':       'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900',
  'PPC ad':       'bg-pink-50   text-pink-700   border border-pink-200   dark:bg-pink-950   dark:text-pink-400   dark:border-pink-900',
  'Poster':       'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900',
  'Landing page': 'bg-cyan-50   text-cyan-700   border border-cyan-200   dark:bg-cyan-950   dark:text-cyan-400   dark:border-cyan-900',
};

function guessExt(dataUrl: string) {
  if (dataUrl.startsWith('data:image/png'))  return 'png';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  if (dataUrl.startsWith('data:application/pdf')) return 'pdf';
  return 'jpg';
}

function downloadAll(deliverables: string[], prefix: string) {
  deliverables.forEach((d, i) => {
    const a = document.createElement('a');
    a.href = d;
    a.download = `${prefix}-visual-${i + 1}.${guessExt(d)}`;
    a.click();
  });
}

export default function TrackRequests() {
  const [name,      setName]      = useState('');
  const [searched,  setSearched]  = useState('');
  const [requests,  setRequests]  = useState<VisualRequest[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [didSearch, setDidSearch] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    const res = await fetch('/api/requests', { cache: 'no-store' });
    const all: VisualRequest[] = await res.json();
    setRequests(all.filter(r => r.requester.toLowerCase() === q.toLowerCase()));
    setSearched(q);
    setDidSearch(true);
    setLoading(false);
  };

  const rate = async (id: string, requesterRating: number) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterRating }),
    });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, requesterRating } : r));
  };

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={search} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Enter your name to see your requests and their status.
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (e.g. Sarah)"
            className="flex-1 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition-colors"
          />
          <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {didSearch && (
        requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm gap-2">
            <span className="text-3xl">🔍</span>
            No requests found for <strong className="text-gray-600 dark:text-gray-300">"{searched}"</strong>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {requests.length} request{requests.length !== 1 ? 's' : ''} for <strong className="text-gray-600 dark:text-gray-300">{searched}</strong>
            </p>
            {requests.map(r => {
              const p = getPriority(r.date);
              const days = getDaysLeft(r.date);
              const daysText = days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`;
              const daysColor = days < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : days === 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400';
              const typeColor = TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
              const isDone = r.status === 'done';
              const hasFiles = (r.deliverables ?? []).length > 0;

              return (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[r.status].className}`}>{STATUS_CONFIG[r.status].label}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_CONFIG[p].className}`}>{PRIORITY_CONFIG[p].label}</span>
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${typeColor}`}>{r.type}</span>
                        {r.format && (
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${r.format === 'video' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}`}>
                            {r.format === 'video' ? '🎬 Video' : '🖼 Static'}
                          </span>
                        )}
                        {r.brand && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{r.brand}</span>
                        )}
                      </div>
                      <p className={`text-xs ${daysColor}`}>
                        {fmtDate(r.date)} · {daysText} · {r.visuals.length} visual{r.visuals.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Admin note */}
                  {r.adminNote && (
                    <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-xs ${
                      r.status === 'rejected'
                        ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900'
                    }`}>
                      <span className="font-semibold">{r.status === 'rejected' ? 'Reason: ' : 'Note: '}</span>{r.adminNote}
                    </div>
                  )}

                  {/* Visuals */}
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {r.visuals.map((v, i) => (
                      <div key={i} className={`px-4 py-3 flex gap-3 items-start ${i < r.visuals.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''}`}>
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-14 shrink-0 pt-0.5">Visual {i + 1}</span>
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex gap-1.5 flex-wrap">
                            {v.size && <span className="inline-flex text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">{v.size}</span>}
                            {v.logoOnVisual && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">logo</span>}
                            {v.sensitiveElement && <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 rounded text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">sensitive</span>}
                          </div>
                          {v.content && <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{v.content}</p>}
                          {(v.referenceUrl || v.referenceImage) && (
                            <div className="flex items-center gap-2 mt-0.5">
                              {v.referenceUrl && <a href={v.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2 max-w-[240px] truncate">{v.referenceUrl}</a>}
                              {v.referenceImage && <img src={v.referenceImage} alt="Reference" onClick={() => window.open(v.referenceImage, '_blank')} className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deliverables + download */}
                  {hasFiles && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Delivered files ({r.deliverables!.length})
                        </p>
                        <button
                          onClick={() => downloadAll(r.deliverables!, r.brand || r.type)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.deliverables!.map((d, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={d}
                              alt={`Deliverable ${i + 1}`}
                              onClick={() => window.open(d, '_blank')}
                              className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            />
                            {/* Individual download on hover */}
                            <a
                              href={d}
                              download={`visual-${i + 1}.${guessExt(d)}`}
                              onClick={e => e.stopPropagation()}
                              className="absolute bottom-1 right-1 h-6 w-6 bg-black/60 text-white rounded-md items-center justify-center hidden group-hover:flex"
                              title="Download"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                                <path d="M5 20h14"/>
                              </svg>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requester rating — only on done requests */}
                  {isDone && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-wrap bg-gray-50/40 dark:bg-gray-900/20">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your rating</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => rate(r.id, star)}
                            className={`text-2xl leading-none transition-colors hover:scale-110 ${(r.requesterRating ?? 0) >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700 hover:text-amber-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {r.requesterRating ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{r.requesterRating}/5</span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Tap a star to rate</span>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

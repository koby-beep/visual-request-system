'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VisualRequest } from '@/types';
import { getDaysLeft, getPriority, PRIORITY_CONFIG, PRIORITY_ORDER } from '@/lib/priority';
import { STATUS_CONFIG } from '@/lib/status';
import DatePicker from './DatePicker';

const TYPE_COLORS: Record<string, string> = {
  'SMM ad':       'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900',
  'PPC ad':       'bg-pink-50   text-pink-700   border border-pink-200   dark:bg-pink-950   dark:text-pink-400   dark:border-pink-900',
  'Poster':       'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900',
  'Landing page': 'bg-cyan-50   text-cyan-700   border border-cyan-200   dark:bg-cyan-950   dark:text-cyan-400   dark:border-cyan-900',
};

const FIELD = 'bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors';

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Designer   { id: string; name: string; username: string; }
interface EditState  { id: string; date: string; note: string; }

export default function DesignerDashboard({ designer, onLogout }: { designer: Designer; onLogout: () => void }) {
  const [requests,  setRequests]  = useState<VisualRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragging,  setDragging]  = useState<Record<string, boolean>>({});
  const [editing,   setEditing]   = useState<EditState | null>(null);
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/requests', { cache: 'no-store' });
    const all: VisualRequest[] = await res.json();
    setRequests(
      all
        .filter(r => r.assignedTo === designer.username)
        .sort((a, b) => {
          const pd = PRIORITY_ORDER.indexOf(getPriority(a.date)) - PRIORITY_ORDER.indexOf(getPriority(b.date));
          return pd !== 0 ? pd : new Date(a.date).getTime() - new Date(b.date).getTime();
        })
    );
    setLoading(false);
  }, [designer.username]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, body: Partial<VisualRequest>) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    load();
  };

  const saveEdit = async (id: string) => {
    if (!editing) return;
    await patch(id, { date: editing.date, adminNote: editing.note || undefined });
    setEditing(null);
  };

  const uploadFiles = async (r: VisualRequest, files: FileList | File[]) => {
    setUploading(u => ({ ...u, [r.id]: true }));
    const fileArr = Array.from(files);
    const newDeliverables: string[] = [];
    await Promise.all(fileArr.map(file => new Promise<void>(resolve => {
      const reader = new FileReader();
      reader.onload = ev => { newDeliverables.push(ev.target?.result as string); resolve(); };
      reader.readAsDataURL(file);
    })));
    await patch(r.id, { deliverables: [...(r.deliverables ?? []), ...newDeliverables] });
    setUploading(u => ({ ...u, [r.id]: false }));
    if (uploadRefs.current[r.id]) uploadRefs.current[r.id]!.value = '';
  };

  const removeDeliverable = async (r: VisualRequest, idx: number) => {
    await patch(r.id, { deliverables: (r.deliverables ?? []).filter((_, i) => i !== idx) });
  };

  const handleDrop = (r: VisualRequest) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(d => ({ ...d, [r.id]: false }));
    if (e.dataTransfer.files.length) uploadFiles(r, e.dataTransfer.files);
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Assigned',    n: requests.length,                                        color: 'text-gray-900 dark:text-white' },
          { label: 'In progress', n: requests.filter(r => r.status === 'in-progress').length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Done',        n: requests.filter(r => r.status === 'done').length,        color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className={`text-3xl font-medium leading-none mb-1 ${s.color}`}>{s.n}</div>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Showing requests assigned to you</p>
        <div className="flex gap-2">
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">↻ Refresh</button>
          <button onClick={onLogout} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Sign out</button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm gap-2">
          <span className="text-3xl">🎨</span>
          No requests assigned to you yet
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map(r => {
            const p = getPriority(r.date);
            const days = getDaysLeft(r.date);
            const daysText = days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`;
            const daysColor = days < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : days === 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400';
            const typeColor = TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
            const isDone    = r.status === 'done';
            const isEditing = editing?.id === r.id;

            return (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

                {/* ── Header ── */}
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
                      {r.brand && <span className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{r.brand}</span>}
                      <span className="text-xs text-gray-400 dark:text-gray-500">by {r.requester}</span>
                    </div>
                    <p className={`text-xs ${daysColor}`}>
                      {fmtDate(r.date)} · {daysText} · {r.visuals.length} visual{r.visuals.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Edit icon */}
                  <button
                    onClick={() => isEditing ? setEditing(null) : setEditing({ id: r.id, date: r.date, note: r.adminNote ?? '' })}
                    title="Edit"
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${isEditing ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>

                {/* Edit panel */}
                {isEditing && editing && (
                  <div className="mx-4 mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Edit</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 dark:text-gray-500">Due date</label>
                        <DatePicker value={editing.date} onChange={v => setEditing(prev => prev ? { ...prev, date: v } : prev)} fieldClass={FIELD} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 dark:text-gray-500">Note (visible to requester)</label>
                        <textarea value={editing.note} onChange={e => setEditing(prev => prev ? { ...prev, note: e.target.value } : prev)} className={`${FIELD} resize-none`} rows={2} placeholder="Optional note…" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveEdit(r.id)} className="px-4 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">Save</button>
                      <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Note display */}
                {r.adminNote && !isEditing && (
                  <div className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                    <span className="font-semibold">Note: </span>{r.adminNote}
                  </div>
                )}

                {/* ── Brief (visuals) ── */}
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
                        {r.format === 'video' ? (
                          <>
                            {v.videoSizes.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {v.videoSizes.map(s => (
                                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
                                    {s === 'horizontal' ? '1920×1080' : s === 'vertical' ? '1080×1920' : s === 'square' ? '1080×1080' : v.customVideoSize || 'Custom'}
                                  </span>
                                ))}
                                {v.subtitle && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">subtitles</span>}
                              </div>
                            )}
                            {v.description && <p className="text-sm text-gray-700 dark:text-gray-300">{v.description}</p>}
                            {v.script      && <p className="text-xs text-gray-500 dark:text-gray-500 italic">Script: {v.script}</p>}
                            {v.textInVideo && <p className="text-xs text-gray-500 dark:text-gray-500">Text: {v.textInVideo}</p>}
                          </>
                        ) : (
                          <>
                            {v.mainTitle && <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{v.mainTitle}</p>}
                            {v.subTitle  && <p className="text-sm text-gray-600 dark:text-gray-400">{v.subTitle}</p>}
                            {v.bodyText  && <p className="text-xs text-gray-500 dark:text-gray-500">{v.bodyText}</p>}
                            {v.ctaButton && v.ctaText && <span className="self-start text-xs px-2.5 py-1 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium">{v.ctaText}</span>}
                          </>
                        )}
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

                {/* ── Upload finished visual ── */}
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50/40 dark:bg-gray-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Finished visual{r.visuals.length !== 1 ? 's' : ''}
                    </p>
                    {(r.deliverables ?? []).length > 0 && !isDone && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium">
                        {r.deliverables!.length} uploaded
                      </span>
                    )}
                  </div>

                  {/* Uploaded files grid */}
                  {(r.deliverables ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {r.deliverables!.map((d, i) => (
                        <div key={i} className="relative group">
                          <img src={d} alt={`Upload ${i + 1}`} onClick={() => window.open(d, '_blank')} className="h-20 w-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity shadow-sm" />
                          {!isDone && (
                            <button onClick={() => removeDeliverable(r, i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full text-[11px] leading-none items-center justify-center hidden group-hover:flex shadow">×</button>
                          )}
                          <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white rounded px-1 py-0.5 leading-tight">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone */}
                  {!isDone && (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragging(d => ({ ...d, [r.id]: true })); }}
                      onDragLeave={() => setDragging(d => ({ ...d, [r.id]: false }))}
                      onDrop={handleDrop(r)}
                      onClick={() => uploadRefs.current[r.id]?.click()}
                      className={`relative flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed cursor-pointer transition-all py-6 ${
                        dragging[r.id]
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                      }`}
                    >
                      {uploading[r.id] ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Uploading…</p>
                      ) : (
                        <>
                          <svg className="text-gray-300 dark:text-gray-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {(r.deliverables ?? []).length > 0 ? 'Upload more files' : 'Upload your finished visual'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Click to browse or drag &amp; drop · PNG, JPG, PDF</p>
                          </div>
                        </>
                      )}
                      <input ref={el => { uploadRefs.current[r.id] = el; }} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => { if (e.target.files?.length) uploadFiles(r, e.target.files); }} />
                    </div>
                  )}

                  {isDone && (r.deliverables ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No files uploaded for this request.</p>
                  )}
                </div>

                {/* ── Ratings (read-only) ── */}
                {(r.rating || r.requesterRating) && (
                  <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 flex-wrap">
                    {r.rating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Admin:</span>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xl leading-none ${r.rating! >= s ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    )}
                    {r.requesterRating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Requester:</span>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xl leading-none ${r.requesterRating! >= s ? 'text-blue-400' : 'text-gray-200 dark:text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Action row ── */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex-wrap">
                  {r.status === 'pending' && (
                    <button onClick={() => patch(r.id, { status: 'approved' })} className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      ✓ Approve
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => patch(r.id, { status: 'in-progress' })} className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Start work
                    </button>
                  )}
                  {r.status === 'in-progress' && (r.deliverables ?? []).length > 0 && (
                    <button onClick={() => patch(r.id, { status: 'done' })} className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      Mark as done
                    </button>
                  )}
                  {r.status === 'in-progress' && (r.deliverables ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Upload the finished visual above to mark as done</p>
                  )}
                  {r.status === 'done' && (
                    <button onClick={() => patch(r.id, { status: 'in-progress' })} className="px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Reopen
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

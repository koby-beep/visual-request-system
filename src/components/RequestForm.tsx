'use client';

import { useRef, useState } from 'react';
import { Visual, VisualType } from '@/types';
import { getDaysLeft, getPriority, PRIORITY_CONFIG } from '@/lib/priority';

const VISUAL_TYPES: VisualType[] = ['SMM ad', 'PPC ad', 'Poster', 'Landing page', 'Video'];

const FIELD =
  'bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition-colors';

const EMPTY_VISUAL: Visual = { size: '', content: '', referenceUrl: '', referenceImage: '' };

interface FormState {
  requester: string;
  brand: string;
  logoOnVisual: boolean;
  type: string;
  date: string;
  visuals: Visual[];
}

const EMPTY: FormState = {
  requester: '', brand: '', logoOnVisual: false,
  type: '', date: '', visuals: [{ ...EMPTY_VISUAL }],
};

export default function RequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<'idle' | 'ok' | 'err'>('idle');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setField = (k: keyof Omit<FormState, 'visuals' | 'logoOnVisual'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setMsg('idle');
    };

  const updateVisual = (i: number, patch: Partial<Visual>) =>
    setForm(f => ({
      ...f,
      visuals: f.visuals.map((v, idx) => idx === i ? { ...v, ...patch } : v),
    }));

  const addVisual = () =>
    setForm(f => ({ ...f, visuals: [...f.visuals, { ...EMPTY_VISUAL }] }));

  const removeVisual = (i: number) => {
    if (fileRefs.current[i]) fileRefs.current[i]!.value = '';
    setForm(f => ({ ...f, visuals: f.visuals.filter((_, idx) => idx !== i) }));
  };

  const handleImageUpload = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      updateVisual(i, { referenceImage: ev.target?.result as string, referenceUrl: '' });
    reader.readAsDataURL(file);
  };

  const priority = form.date ? getPriority(form.date) : null;
  const daysLeft  = form.date ? getDaysLeft(form.date) : null;
  const daysText  =
    daysLeft === null ? '' :
    daysLeft < 0 ? 'Past due!' :
    daysLeft === 0 ? 'Due today!' :
    `${daysLeft}d away`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = form.requester && form.type && form.date &&
      form.visuals.length > 0 &&
      form.visuals.every(v => v.size.trim() && v.content.trim());
    if (!ok) { setMsg('err'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(EMPTY);
      fileRefs.current.forEach(r => { if (r) r.value = ''; });
      setMsg('ok');
      onSuccess?.();
    } catch {
      setMsg('err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">

      {/* ── Top fields ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Requester</label>
          <input type="text" value={form.requester} onChange={setField('requester')} placeholder="e.g. Sarah" className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Visual type</label>
          <select value={form.type} onChange={setField('type')} className={FIELD}>
            <option value="">Select a type...</option>
            {VISUAL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Brand</label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-gray-500 dark:text-gray-400">Logo on visual</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.logoOnVisual}
                onClick={() => setForm(f => ({ ...f, logoOnVisual: !f.logoOnVisual }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  form.logoOnVisual ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                  form.logoOnVisual
                    ? 'translate-x-4 bg-white dark:bg-gray-900'
                    : 'translate-x-0.5 bg-white dark:bg-gray-400'
                }`} />
              </button>
            </label>
          </div>
          <input type="text" value={form.brand} onChange={setField('brand')} placeholder="e.g. Nike, Coca-Cola" className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date required</label>
          <input type="date" value={form.date} onChange={setField('date')} className={FIELD} />
          {priority && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CONFIG[priority].className}`}>
                {PRIORITY_CONFIG[priority].label}
              </span>
              {daysText}
            </p>
          )}
        </div>

      </div>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-700 mb-5" />

      {/* ── Visual cards ── */}
      <div className="flex flex-col gap-4">
        {form.visuals.map((v, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100/60 dark:bg-gray-700/30">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Visual {i + 1}
              </span>
              {form.visuals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVisual(i)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Card body */}
            <div className="p-4 flex flex-col gap-3">

              {/* Size */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Size &amp; format</label>
                <input
                  type="text"
                  value={v.size}
                  onChange={e => updateVisual(i, { size: e.target.value })}
                  placeholder="e.g. 1080×1080 px, PNG"
                  className={FIELD}
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Content</label>
                <textarea
                  value={v.content}
                  onChange={e => updateVisual(i, { content: e.target.value })}
                  rows={3}
                  placeholder="Describe what goes in this visual — message, imagery, colors, tone, text to include..."
                  className={`${FIELD} resize-y`}
                />
              </div>

              {/* Reference */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  Reference <span className="font-normal opacity-70">(optional — link or image)</span>
                </label>
                <input
                  type="url"
                  value={v.referenceUrl}
                  onChange={e => updateVisual(i, { referenceUrl: e.target.value, referenceImage: '' })}
                  placeholder="https://example.com/inspiration"
                  className={FIELD}
                  onFocus={() => { if (fileRefs.current[i]) fileRefs.current[i]!.value = ''; }}
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                  <button
                    type="button"
                    onClick={() => fileRefs.current[i]?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    Upload image
                  </button>
                  <input
                    ref={el => { fileRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(i, e)}
                  />
                  {v.referenceImage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={v.referenceImage}
                        alt="Reference preview"
                        className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateVisual(i, { referenceImage: '' });
                          if (fileRefs.current[i]) fileRefs.current[i]!.value = '';
                        }}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ── Add visual button ── */}
      <button
        type="button"
        onClick={addVisual}
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/40 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span className="text-lg font-light leading-none">+</span>
        Add visual
      </button>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 gap-3">
        <button
          type="button"
          onClick={() => { setForm(EMPTY); setMsg('idle'); fileRefs.current.forEach(r => { if (r) r.value = ''; }); }}
          className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit request'}
        </button>
      </div>

      {msg === 'ok' && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900 rounded-lg text-sm">
          Request submitted — switch to the dashboard to see it.
        </div>
      )}
      {msg === 'err' && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg text-sm">
          Please fill in Requester, Visual type, Date, and every visual needs a size and content.
        </div>
      )}
    </form>
  );
}

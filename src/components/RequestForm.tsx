'use client';

import { useRef, useState } from 'react';
import { Visual, VisualFormat, VisualType } from '@/types';
import { getDaysLeft, getPriority, PRIORITY_CONFIG } from '@/lib/priority';
import DatePicker from './DatePicker';
import BrandSelect from './BrandSelect';

const VISUAL_TYPES: VisualType[] = ['SMM ad', 'PPC ad', 'Poster', 'Landing page'];

const VIDEO_SIZES = [
  { key: 'horizontal', label: 'Horizontal', sub: '1920×1080' },
  { key: 'vertical',   label: 'Vertical',   sub: '1080×1920' },
  { key: 'square',     label: '1:1',         sub: '1080×1080' },
  { key: 'custom',     label: 'Custom',      sub: '' },
];

const FIELD =
  'bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition-colors';

const EMPTY_VISUAL: Visual = {
  size: '', mainTitle: '', subTitle: '', bodyText: '',
  logoOnVisual: false, sensitiveElement: false,
  ctaButton: false, ctaText: '',
  videoSizes: [], customVideoSize: '',
  description: '', script: '', textInVideo: '', subtitle: false,
  referenceUrl: '', referenceImage: '',
};

interface FormState {
  requester: string;
  brand: string;
  type: string;
  format: VisualFormat;
  date: string;
  visuals: Visual[];
}

const EMPTY: FormState = {
  requester: '', brand: '', type: '', format: 'static', date: '', visuals: [{ ...EMPTY_VISUAL }],
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
          checked ? 'translate-x-4 bg-white dark:bg-gray-900' : 'translate-x-0.5 bg-white dark:bg-gray-400'
        }`} />
      </button>
    </label>
  );
}

export default function RequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState<'idle' | 'ok' | 'err'>('idle');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setField = (k: keyof Omit<FormState, 'visuals'>) => (val: string) => {
    setForm(f => ({ ...f, [k]: val }));
    setMsg('idle');
  };

  const updateVisual = (i: number, patch: Partial<Visual>) =>
    setForm(f => ({ ...f, visuals: f.visuals.map((v, idx) => idx === i ? { ...v, ...patch } : v) }));

  const toggleVideoSize = (i: number, key: string) => {
    const v = form.visuals[i];
    const next = v.videoSizes.includes(key)
      ? v.videoSizes.filter(s => s !== key)
      : [...v.videoSizes, key];
    updateVisual(i, {
      videoSizes: next,
      customVideoSize: next.includes('custom') ? v.customVideoSize : '',
    });
  };

  const addVisual = () => setForm(f => ({ ...f, visuals: [...f.visuals, { ...EMPTY_VISUAL }] }));

  const removeVisual = (i: number) => {
    if (fileRefs.current[i]) fileRefs.current[i]!.value = '';
    setForm(f => ({ ...f, visuals: f.visuals.filter((_, idx) => idx !== i) }));
  };

  const handleImageUpload = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateVisual(i, { referenceImage: ev.target?.result as string, referenceUrl: '' });
    reader.readAsDataURL(file);
  };

  const isVideo = form.format === 'video';
  const cardLabel = isVideo ? 'Video' : 'Visual';
  const addLabel  = isVideo ? '+ Add video' : '+ Add visual';

  const priority = form.date ? getPriority(form.date) : null;
  const daysLeft  = form.date ? getDaysLeft(form.date) : null;
  const daysText  = daysLeft === null ? '' : daysLeft < 0 ? 'Past due!' : daysLeft === 0 ? 'Due today!' : `${daysLeft}d away`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = form.requester && form.type && form.date && form.visuals.length > 0 &&
      (isVideo
        ? form.visuals.every(v => v.videoSizes.length > 0 && v.description.trim())
        : form.visuals.every(v => v.size.trim() && v.mainTitle.trim()));
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
          <input type="text" value={form.requester} onChange={e => setField('requester')(e.target.value)} placeholder="e.g. Sarah" className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date required</label>
          <DatePicker value={form.date} onChange={v => setField('date')(v)} fieldClass={FIELD} />
          {priority && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CONFIG[priority].className}`}>{PRIORITY_CONFIG[priority].label}</span>
              {daysText}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Brand</label>
          <BrandSelect value={form.brand} onChange={v => setField('brand')(v)} fieldClass={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Visual type</label>
          <select value={form.type} onChange={e => setField('type')(e.target.value)} className={FIELD}>
            <option value="">Select a type…</option>
            {VISUAL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Video or static?</label>
          <div className="flex gap-2">
            {(['static', 'video'] as VisualFormat[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, format: f, visuals: [{ ...EMPTY_VISUAL }] }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.format === f
                    ? f === 'video'
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {f === 'video' ? '🎬 Video' : '🖼 Static'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-700 mb-5" />

      {/* ── Cards ── */}
      <div className="flex flex-col gap-4">
        {form.visuals.map((v, i) => (
          <div key={i} className={`rounded-xl border overflow-hidden ${
            isVideo
              ? 'border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40'
          }`}>

            {/* Card header */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
              isVideo
                ? 'border-purple-200 dark:border-purple-900 bg-purple-100/50 dark:bg-purple-950/40'
                : 'border-gray-200 dark:border-gray-700 bg-gray-100/60 dark:bg-gray-700/30'
            }`}>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {isVideo ? '🎬' : ''} {cardLabel} {i + 1}
              </span>
              {form.visuals.length > 1 && (
                <button type="button" onClick={() => removeVisual(i)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950">
                  Remove
                </button>
              )}
            </div>

            {/* Card body */}
            <div className="p-4 flex flex-col gap-3">

              {isVideo ? (
                /* ── VIDEO FIELDS ── */
                <>
                  {/* Size multi-select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Size <span className="font-normal opacity-60">(select all that apply)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VIDEO_SIZES.map(sz => {
                        const selected = v.videoSizes.includes(sz.key);
                        return (
                          <button
                            key={sz.key}
                            type="button"
                            onClick={() => toggleVideoSize(i, sz.key)}
                            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-center transition-colors ${
                              selected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-600'
                            }`}
                          >
                            <span className="text-xs font-semibold">{sz.label}</span>
                            {sz.sub && <span className={`text-[10px] mt-0.5 ${selected ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>{sz.sub}</span>}
                          </button>
                        );
                      })}
                    </div>
                    {v.videoSizes.includes('custom') && (
                      <input
                        type="text"
                        value={v.customVideoSize}
                        onChange={e => updateVisual(i, { customVideoSize: e.target.value })}
                        placeholder="Enter custom size e.g. 1280×720"
                        className={FIELD}
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Description</label>
                    <textarea
                      value={v.description}
                      onChange={e => updateVisual(i, { description: e.target.value })}
                      rows={3}
                      placeholder="Describe this video — concept, mood, visuals, style, target audience…"
                      className={`${FIELD} resize-y`}
                    />
                  </div>

                  {/* Script */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Script <span className="font-normal opacity-60">(optional)</span></label>
                    <textarea
                      value={v.script}
                      onChange={e => updateVisual(i, { script: e.target.value })}
                      rows={3}
                      placeholder="Voiceover or on-screen narration script…"
                      className={`${FIELD} resize-y`}
                    />
                  </div>

                  {/* Text in video */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Text in video <span className="font-normal opacity-60">(optional)</span></label>
                    <input
                      type="text"
                      value={v.textInVideo}
                      onChange={e => updateVisual(i, { textInVideo: e.target.value })}
                      placeholder="Any text overlays or on-screen copy…"
                      className={FIELD}
                    />
                  </div>

                  {/* Subtitle toggle */}
                  <div className="flex gap-4 flex-wrap">
                    <Toggle
                      checked={v.subtitle}
                      onChange={() => updateVisual(i, { subtitle: !v.subtitle })}
                      label="Subtitle"
                    />
                  </div>
                </>
              ) : (
                /* ── STATIC FIELDS ── */
                <>
                  {/* Size */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Size &amp; format</label>
                    <input type="text" value={v.size} onChange={e => updateVisual(i, { size: e.target.value })} placeholder="e.g. 1080×1080 px, PNG" className={FIELD} />
                  </div>

                  {/* Main title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Main title</label>
                    <input type="text" value={v.mainTitle} onChange={e => updateVisual(i, { mainTitle: e.target.value })} placeholder="e.g. Summer Sale — Up to 50% Off" className={FIELD} />
                  </div>

                  {/* Sub title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Sub title <span className="font-normal opacity-60">(optional)</span></label>
                    <input type="text" value={v.subTitle} onChange={e => updateVisual(i, { subTitle: e.target.value })} placeholder="e.g. Limited time only · Free shipping on orders $50+" className={FIELD} />
                  </div>

                  {/* Body text */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 dark:text-gray-500">Body text <span className="font-normal opacity-60">(optional)</span></label>
                    <textarea value={v.bodyText} onChange={e => updateVisual(i, { bodyText: e.target.value })} rows={2} placeholder="Additional details — imagery description, colors, tone, any extra copy…" className={`${FIELD} resize-y`} />
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-4 flex-wrap">
                    <Toggle checked={v.logoOnVisual}   onChange={() => updateVisual(i, { logoOnVisual: !v.logoOnVisual })}                                       label="Logo on visual" />
                    <Toggle checked={v.sensitiveElement} onChange={() => updateVisual(i, { sensitiveElement: !v.sensitiveElement })}                             label="Sensitive element" />
                    <Toggle checked={v.ctaButton}       onChange={() => updateVisual(i, { ctaButton: !v.ctaButton, ctaText: v.ctaButton ? '' : v.ctaText })}    label="CTA button" />
                  </div>

                  {v.ctaButton && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-400 dark:text-gray-500">CTA button text</label>
                      <input type="text" value={v.ctaText} onChange={e => updateVisual(i, { ctaText: e.target.value })} placeholder="e.g. Shop Now, Learn More, Get Started…" className={FIELD} />
                    </div>
                  )}
                </>
              )}

              {/* Reference — shared for both */}
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
                  <button type="button" onClick={() => fileRefs.current[i]?.click()} className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                    Upload image
                  </button>
                  <input ref={el => { fileRefs.current[i] = el; }} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(i, e)} />
                  {v.referenceImage && (
                    <div className="flex items-center gap-2">
                      <img src={v.referenceImage} alt="Reference preview" className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                      <button type="button" onClick={() => { updateVisual(i, { referenceImage: '' }); if (fileRefs.current[i]) fileRefs.current[i]!.value = ''; }} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
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

      {/* ── Add card button ── */}
      <button
        type="button"
        onClick={addVisual}
        className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-sm border border-dashed rounded-xl transition-colors ${
          isVideo
            ? 'text-purple-500 dark:text-purple-400 border-purple-300 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
            : 'text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/40 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <span className="text-lg font-light leading-none">+</span>
        {addLabel}
      </button>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 gap-3">
        <button type="button" onClick={() => { setForm(EMPTY); setMsg('idle'); fileRefs.current.forEach(r => { if (r) r.value = ''; }); }} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Clear
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors">
          {loading ? 'Submitting…' : 'Submit request'}
        </button>
      </div>

      {msg === 'ok' && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900 rounded-lg text-sm">
          Request submitted!
        </div>
      )}
      {msg === 'err' && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg text-sm">
          {isVideo
            ? 'Please fill in Requester, Visual type, Date, and every video needs at least one size and a description.'
            : 'Please fill in Requester, Visual type, Date, and every visual needs a size and main title.'}
        </div>
      )}
    </form>
  );
}

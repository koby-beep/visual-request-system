'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  fieldClass: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function DatePicker({ value, onChange, fieldClass }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const selected = value
    ? new Date(value + 'T12:00:00')
    : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({
    year:  selected ? selected.getFullYear()  : today.getFullYear(),
    month: selected ? selected.getMonth()     : today.getMonth(),
  }));

  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () =>
    setView(v => v.month === 0
      ? { year: v.year - 1, month: 11 }
      : { ...v, month: v.month - 1 });

  const nextMonth = () =>
    setView(v => v.month === 11
      ? { year: v.year + 1, month: 0 }
      : { ...v, month: v.month + 1 });

  // build grid: leading nulls + day numbers
  const firstDow = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pick = (day: number) => {
    const m = String(view.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${view.year}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="relative" ref={ref}>
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 cursor-pointer`}
      >
        <span className={displayValue ? '' : 'text-gray-400 dark:text-gray-500'}>
          {displayValue || 'Pick a date'}
        </span>
        {/* calendar icon */}
        <svg className="shrink-0 text-gray-400 dark:text-gray-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute z-50 left-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-72 select-none">

          {/* month/year header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {MONTHS[view.month]} {view.year}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* day-of-week headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {DAY_HEADERS.map(d => (
              <span key={d} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const m = String(view.month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateStr = `${view.year}-${m}-${d}`;
              const isSelected = dateStr === value;
              const isToday    = dateStr === todayStr;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  className={`
                    h-8 w-full rounded-lg text-sm transition-colors
                    ${isSelected
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold'
                      : isToday
                      ? 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* today shortcut */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false); }}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

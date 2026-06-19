'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  fieldClass: string;
}

export default function BrandSelect({ value, onChange, fieldClass }: Props) {
  const [brands,   setBrands]   = useState<string[]>([]);
  const [open,     setOpen]     = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(setBrands);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setCreating(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (brand: string) => { onChange(brand); setOpen(false); setCreating(false); };

  const createBrand = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const updated = await res.json();
    setBrands(Array.isArray(updated) ? updated : brands);
    onChange(name);
    setNewName(''); setCreating(false); setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 cursor-pointer text-left`}
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {value || 'Select or create a brand…'}
        </span>
        <svg className="shrink-0 text-gray-400 dark:text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-h-60 overflow-y-auto">
          {value && (
            <button type="button" onClick={() => select('')} className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
              — No brand
            </button>
          )}
          {brands.length === 0 && !creating && (
            <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">No brands yet. Create one below.</p>
          )}
          {brands.map(b => (
            <button key={b} type="button" onClick={() => select(b)} className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${b === value ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'}`}>
              {b}
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            {creating ? (
              <div className="flex gap-1.5">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Brand name…"
                  className="flex-1 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createBrand(); } if (e.key === 'Escape') setCreating(false); }}
                  autoFocus
                />
                <button type="button" onClick={createBrand} className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100">Add</button>
                <button type="button" onClick={() => setCreating(false)} className="px-2.5 py-1.5 text-xs text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)} className="w-full text-left px-2 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors flex items-center gap-1.5">
                <span className="text-base font-light leading-none">+</span> Create new brand
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

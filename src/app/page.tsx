'use client';

import { useState } from 'react';
import RequestForm from '@/components/RequestForm';
import TrackRequests from '@/components/TrackRequests';
import HistoryView from '@/components/HistoryView';
import { useTheme } from '@/hooks/useTheme';

type Tab = 'form' | 'track' | 'history';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('form');
  const { dark, toggle, mounted } = useTheme();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            🎨 Visual Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Submit and track your design requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/designer"
            className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Designer
          </a>
          <a
            href="/admin"
            className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Admin
          </a>
          <button
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mounted ? (dark ? <SunIcon /> : <MoonIcon />) : <MoonIcon />}
          </button>
        </div>
      </div>

      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
        {(['form', 'track', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t === 'form' ? '+ New request' : t === 'track' ? 'My requests' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'form'    && <RequestForm onSuccess={() => setTab('track')} />}
      {tab === 'track'   && <TrackRequests />}
      {tab === 'history' && <HistoryView />}
    </main>
  );
}

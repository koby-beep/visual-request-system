'use client';

import { useEffect, useState } from 'react';
import DesignerDashboard from '@/components/DesignerDashboard';
import { useTheme } from '@/hooks/useTheme';

interface Designer { id: string; name: string; username: string; }

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

const FIELD = 'bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition-colors';

export default function DesignerPage() {
  const [designer,  setDesigner]  = useState<Designer | null>(null);
  const [checking,  setChecking]  = useState(true);
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const { dark, toggle, mounted } = useTheme();

  useEffect(() => {
    fetch('/api/auth/designer')
      .then(r => r.json())
      .then(d => { if (d.ok) setDesigner(d.designer); })
      .finally(() => setChecking(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/designer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setDesigner(data.designer);
    } else {
      setError(data.error ?? 'Login failed');
    }
    setLoading(false);
  };

  const logout = async () => {
    await fetch('/api/auth/designer', { method: 'DELETE' });
    setDesigner(null);
  };

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500 text-sm">Loading…</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            🎨 Designer Portal
          </h1>
          {designer && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome, {designer.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            ← Requests
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

      {designer ? (
        <DesignerDashboard designer={designer} onLogout={logout} />
      ) : (
        <div className="flex items-center justify-center pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Designer sign in</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Enter the username and password your admin gave you.</p>

            <form onSubmit={login} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alex"
                  className={FIELD}
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={FIELD}
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

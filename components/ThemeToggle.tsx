'use client';
import { useSyncExternalStore } from 'react';

function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const v = document.documentElement.getAttribute('data-theme');
  return v === 'dark' ? 'dark' : 'light';
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}

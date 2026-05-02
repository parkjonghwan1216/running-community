'use client';
import { useSyncExternalStore } from 'react';
import { formatRelative } from '@/lib/time';

function subscribe(cb: () => void) {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
}

export default function TimeAgo({ date, className }: { date: string; className?: string }) {
  const now = useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => 0,
  );
  // SSR snapshot returns 0 → render absolute date string; on hydration switch to relative
  const label = now === 0 ? date : formatRelative(date, new Date(now));
  return (
    <time className={className} title={date} dateTime={date} suppressHydrationWarning>
      {label}
    </time>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';

const ITEMS = [
  { href: '/posts/free', label: '자유게시판' },
  { href: '/posts/training', label: '훈련방법' },
  { href: '/races', label: '대회 일정' },
  { href: '/courses', label: 'GPX 코스' },
  { href: '/glossary', label: '용어 사전' },
  { href: '/me', label: '마이페이지' },
];

export default function MobileNav({
  loggedIn,
  displayName,
}: {
  loggedIn: boolean;
  displayName?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '';
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-toggle"
        aria-label="메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>
      {open && <div className="mobile-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`mobile-drawer${open ? ' is-open' : ''}`}>
        <div className="mobile-drawer__head">
          {loggedIn ? (
            <span><strong>{displayName}</strong>님</span>
          ) : (
            <span className="muted">로그인이 필요합니다</span>
          )}
        </div>
        <nav className="mobile-drawer__nav">
          {ITEMS.filter((i) => i.href !== '/me' || loggedIn).map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`mobile-drawer__link${pathname.startsWith(it.href) ? ' is-active' : ''}`}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-drawer__foot">
          {loggedIn ? (
            <LogoutButton />
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost btn--block">로그인</Link>
              <Link href="/signup" className="btn btn--primary btn--block" style={{ marginTop: 8 }}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

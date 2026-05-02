'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UserMenu({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    toast.success('로그아웃되었습니다');
    router.refresh();
    router.push('/');
  }

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="profile-avatar profile-avatar--sm">{displayName.slice(0, 1)}</span>
        <span className="user-menu__name">{displayName}</span>
        <span aria-hidden style={{ fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div className="user-menu__panel" role="menu">
          <Link href="/me" role="menuitem" className="user-menu__item" onClick={() => setOpen(false)}>
            마이페이지
          </Link>
          <Link href="/me?tab=posts" role="menuitem" className="user-menu__item" onClick={() => setOpen(false)}>
            내 글
          </Link>
          <Link href="/me?tab=comments" role="menuitem" className="user-menu__item" onClick={() => setOpen(false)}>
            내 댓글
          </Link>
          <div className="user-menu__divider" />
          <button type="button" role="menuitem" className="user-menu__item user-menu__item--danger" onClick={logout}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

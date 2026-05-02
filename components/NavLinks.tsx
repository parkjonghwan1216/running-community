'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/posts/free', label: '자유게시판' },
  { href: '/posts/training', label: '훈련방법' },
  { href: '/races', label: '대회 일정' },
  { href: '/courses', label: 'GPX 코스' },
  { href: '/glossary', label: '용어 사전' },
];

export default function NavLinks() {
  const pathname = usePathname() || '';
  return (
    <nav className="nav">
      {ITEMS.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav__link${active ? ' is-active' : ''}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

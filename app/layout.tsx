import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { getSession } from '@/lib/session';
import NavLinks from '@/components/NavLinks';
import ThemeInit from '@/components/ThemeInit';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import UserMenu from '@/components/UserMenu';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: '러닝 커뮤니티',
    template: '%s | 러닝 커뮤니티',
  },
  description: '러너를 위한 훈련법, 대회 일정, 용어 사전, 자유게시판',
  openGraph: {
    title: '러닝 커뮤니티',
    description: '러너를 위한 훈련법, 대회 일정, 용어 사전, 자유게시판',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const loggedIn = !!session.userId;
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              <span className="brand__dot" />
              러닝 커뮤니티
            </Link>
            <div className="nav-desktop">
              <NavLinks />
            </div>
            <div className="user-tag">
              <ThemeToggle />
              {loggedIn ? (
                <UserMenu displayName={session.displayName ?? '러너'} />
              ) : (
                <span className="user-tag__inner">
                  <Link href="/login" className="btn btn--ghost">로그인</Link>
                  <Link href="/signup" className="btn btn--primary">회원가입</Link>
                </span>
              )}
            </div>
            <div className="nav-mobile">
              <ThemeToggle />
              <MobileNav loggedIn={loggedIn} displayName={session.displayName} />
            </div>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="site-footer">
          러너 누구나 환영합니다 · Running Community
        </footer>
        <Toaster position="top-center" richColors closeButton theme="system" />
      </body>
    </html>
  );
}

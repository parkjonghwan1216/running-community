import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import { getStats } from '@/lib/db';

const FEATURES = [
  {
    kicker: 'BOARD',
    title: '자유게시판',
    desc: '오늘 달린 거리, 대회 후기, 일상을 자유롭게. 러너라면 누구나.',
    href: '/posts/free',
  },
  {
    kicker: 'TRAINING',
    title: '훈련방법',
    desc: '인터벌, LSD, 템포런 — 실제 달려본 러너들의 검증된 훈련법.',
    href: '/posts/training',
  },
  {
    kicker: 'RACES',
    title: '대회 일정',
    desc: '다가오는 대회를 한눈에. 직접 등록해 다른 러너와 공유하세요.',
    href: '/races',
  },
  {
    kicker: 'COURSES',
    title: 'GPX 코스',
    desc: '실제 달린 코스를 지도 위에. 경로·고도·거리를 한눈에.',
    href: '/courses',
  },
  {
    kicker: 'GLOSSARY',
    title: '러닝 용어 사전',
    desc: 'VO2max, 케이던스, LT — 헷갈리는 용어를 글 읽다 바로 확인.',
    href: '/glossary',
  },
];

export default function HomePage() {
  const stats = getStats();
  const kmFormatted = stats.monthlyKm >= 1000
    ? `${(stats.monthlyKm / 1000).toFixed(1)}천`
    : Math.round(stats.monthlyKm).toString();

  return (
    <>
      <section className="hero">
        <span className="hero__eyebrow">A community for every runner</span>
        <h1 className="hero__title">오늘도 달렸나요?</h1>
        <p className="hero__sub">
          훈련 기록을 남기고, 코스를 공유하고, 같이 달릴 러너를 찾는 곳.<br />
          초보든 마라토너든, 페이스 상관없이 환영합니다.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/posts/free" className="btn btn--primary btn--lg">커뮤니티 보기</Link>
          <Link href="/courses" className="btn btn--ghost btn--lg">코스 둘러보기</Link>
        </div>
      </section>

      <div className="community-stats">
        <div className="community-stats__item">
          <span className="community-stats__num">{stats.totalUsers.toLocaleString()}</span>
          <span className="community-stats__label">러너</span>
        </div>
        <div className="community-stats__divider" />
        <div className="community-stats__item">
          <span className="community-stats__num">{stats.totalPosts.toLocaleString()}</span>
          <span className="community-stats__label">게시글</span>
        </div>
        <div className="community-stats__divider" />
        <div className="community-stats__item">
          <span className="community-stats__num">{kmFormatted}</span>
          <span className="community-stats__label">이번 달 달린 km</span>
        </div>
      </div>

      <WeatherWidget />

      <div className="section-head">
        <div>
          <h2>달리기의 모든 것, 한 곳에</h2>
          <p className="section-head__meta">기록하고, 공유하고, 함께 달리세요.</p>
        </div>
      </div>

      <ul className="feature-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {FEATURES.map((f) => (
          <li key={f.href}>
            <Link href={f.href} className="card card--hover feature-card" style={{ display: 'block', height: '100%' }}>
              <div className="feature-card__kicker">{f.kicker}</div>
              <h3>{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
              <span className="feature-card__link">바로 가기 →</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

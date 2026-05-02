import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRace } from '@/lib/repositories/races';

const MONTH_KO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const race = getRace(Number(id));
  if (!race) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const isPast = race.race_date < today;
  const [y, m, d] = race.race_date.split('-');

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/races" className="muted" style={{ fontSize: 14 }}>
          ← 대회 일정 목록
        </Link>
      </div>

      <article className="article">
        <div className="row" style={{ marginBottom: 24 }}>
          <div className="race-date" style={{ minWidth: 96 }}>
            <div className="race-date__day">{Number(d)}</div>
            <div className="race-date__month">
              {MONTH_KO[Number(m) - 1]} {y}
            </div>
          </div>
          <span className={isPast ? 'chip' : 'chip'} style={isPast ? { background: 'var(--surface-2)', color: 'var(--text-muted)' } : undefined}>
            {isPast ? '종료된 대회' : '예정된 대회'}
          </span>
        </div>

        <h1 className="article__title">{race.name}</h1>
        <div className="article__meta">
          {race.location} · {race.distance_km}km
          {race.creator_name && <span className="dot-sep">등록 {race.creator_name}</span>}
        </div>

        {race.description ? (
          <div className="article__body">{race.description}</div>
        ) : (
          <p className="muted">상세 설명이 없습니다.</p>
        )}

        {race.registration_url && !isPast && (
          <div style={{ marginTop: 32 }}>
            <a
              href={race.registration_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary btn--lg"
            >
              참가 신청하러 가기 →
            </a>
          </div>
        )}
      </article>
    </>
  );
}

import Link from 'next/link';
import { listRaces, type RaceRow } from '@/lib/repositories/races';

const MONTH_KO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function RaceCard({ race, past }: { race: RaceRow; past?: boolean }) {
  const [, m, d] = race.race_date.split('-');
  return (
    <li>
      <Link href={`/races/${race.id}`} className={`race-card${past ? ' race-card--past' : ''}`}>
        <div className="race-date">
          <div className="race-date__day">{Number(d)}</div>
          <div className="race-date__month">{MONTH_KO[Number(m) - 1]}</div>
        </div>
        <div>
          <div className="race-card__name">{race.name}</div>
          <div className="race-card__meta">
            {race.location} · {race.distance_km}km
            {race.description ? ` · ${race.description.slice(0, 60)}${race.description.length > 60 ? '…' : ''}` : ''}
          </div>
        </div>
        <span className="muted race-card__cta">자세히 →</span>
      </Link>
    </li>
  );
}

export default async function RacesPage() {
  const { upcoming, past } = listRaces();
  return (
    <>
      <div className="section-head">
        <div>
          <h1>대회 일정</h1>
          <p className="section-head__meta">다가오는 대회 {upcoming.length}개 · 지난 대회 {past.length}개</p>
        </div>
        <Link href="/races/new" className="btn btn--primary">대회 등록</Link>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>다가오는 대회</h2>
      {upcoming.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__title">예정된 대회가 없습니다</div>
          <p>다가오는 대회를 가장 먼저 공유해보세요.</p>
        </div>
      ) : (
        <ul className="race-list" style={{ marginBottom: 36 }}>
          {upcoming.map((r) => (
            <RaceCard key={r.id} race={r} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>지난 대회</h2>
          <ul className="race-list">
            {past.map((r) => (
              <RaceCard key={r.id} race={r} past />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

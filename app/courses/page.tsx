import Link from 'next/link';
import type { Metadata } from 'next';
import { listCourses } from '@/lib/repositories/courses';
import TimeAgo from '@/components/TimeAgo';

export const metadata: Metadata = {
  title: 'GPX 코스',
  description: '러너들이 직접 올린 실제 달린 코스를 지도로 확인하세요.',
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const { items, total } = listCourses(page, 20);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="section-head">
        <div>
          <h1>GPX 코스</h1>
          <p className="section-head__meta">러너들이 직접 달린 코스 · 총 {total}개</p>
        </div>
        <Link href="/courses/new" className="btn btn--primary">코스 등록</Link>
      </div>

      {items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__title">아직 등록된 코스가 없어요</div>
          <p>첫 번째 코스를 등록해 다른 러너와 공유해보세요.</p>
        </div>
      ) : (
        <>
          <ul className="course-list">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.id}`} className="course-card card card--hover">
                  <div className="course-card__title">{c.title}</div>
                  <div className="course-card__meta">
                    <span className="chip chip--sm">
                      {c.distance_km != null ? `${c.distance_km} km` : '거리 미상'}
                    </span>
                    {c.elevation_m != null && (
                      <span className="chip chip--sm">↑ {c.elevation_m} m</span>
                    )}
                    <span className="dot-sep muted">{c.author_name}</span>
                    <TimeAgo date={c.created_at} className="dot-sep muted" />
                  </div>
                  {c.description && (
                    <p className="course-card__desc">{c.description.slice(0, 120)}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="페이지">
              {page > 1 ? (
                <Link href={`/courses?page=${page - 1}`} className="btn btn--ghost">← 이전</Link>
              ) : (
                <span className="btn btn--ghost is-disabled">← 이전</span>
              )}
              <span className="muted pagination__indicator">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={`/courses?page=${page + 1}`} className="btn btn--ghost">다음 →</Link>
              ) : (
                <span className="btn btn--ghost is-disabled">다음 →</span>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

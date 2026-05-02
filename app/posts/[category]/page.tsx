import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listPosts } from '@/lib/repositories/posts';
import { htmlToPreview } from '@/lib/sanitize';
import TimeAgo from '@/components/TimeAgo';
import SearchBar from './SearchBar';

const META = {
  free: { title: '자유게시판', sub: '러너들의 자유로운 이야기' },
  training: { title: '훈련방법', sub: '검증된 훈련 노하우 모음' },
} as const;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const { q } = await searchParams;
  if (category !== 'free' && category !== 'training') return {};
  const m = META[category as 'free' | 'training'];
  if (q?.trim()) return { title: `"${q}" 검색 — ${m.title}` };
  return { title: m.title, description: m.sub };
}

export default async function CategoryListPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  if (category !== 'free' && category !== 'training') notFound();
  const cat = category as 'free' | 'training';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const q = (sp.q ?? '').trim();
  const { items, total, pageSize } = listPosts(cat, page, q || undefined);
  const meta = META[cat];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseQuery = q ? `&q=${encodeURIComponent(q)}` : '';

  return (
    <>
      <div className="section-head">
        <div>
          <h1>{meta.title}</h1>
          <p className="section-head__meta">
            {q ? `"${q}" 검색 결과 · ` : `${meta.sub} · `}총 {total}개의 글
          </p>
        </div>
        <Link href={`/posts/${cat}/new`} className="btn btn--primary">새 글 작성</Link>
      </div>

      <SearchBar category={cat} initial={q} />

      {items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__title">
            {q ? '검색 결과가 없습니다' : '아직 작성된 글이 없어요'}
          </div>
          <p>{q ? '다른 키워드로 다시 시도해보세요.' : '첫 번째 러너가 되어 이야기를 시작해보세요.'}</p>
        </div>
      ) : (
        <>
          <ul className="post-list">
            {items.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${cat}/${p.id}`} className="post-list__item">
                  <div className="post-list__title">{p.title}</div>
                  {(p.run_distance_km || p.run_pace || p.run_type) && (
                    <div className="run-meta">
                      {p.run_distance_km && (
                        <span className="run-badge run-badge--dist">📍 {p.run_distance_km}km</span>
                      )}
                      {p.run_pace && (
                        <span className="run-badge run-badge--pace">⚡ {p.run_pace}/km</span>
                      )}
                      {p.run_type && (
                        <span className="run-badge run-badge--type">{p.run_type}</span>
                      )}
                    </div>
                  )}
                  <div className="post-list__preview">{htmlToPreview(p.body, 100)}</div>
                  <div className="post-list__meta">
                    <span>{p.author_name}</span>
                    <TimeAgo date={p.created_at} className="dot-sep" />
                    <span className="dot-sep">댓글 {p.comment_count ?? 0}</span>
                    <span className="dot-sep">♡ {p.like_count ?? 0}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="페이지 탐색">
              {page > 1 ? (
                <Link href={`/posts/${cat}?page=${page - 1}${baseQuery}`} className="btn btn--ghost">
                  ← 이전
                </Link>
              ) : (
                <span className="btn btn--ghost is-disabled">← 이전</span>
              )}
              <span className="muted pagination__indicator">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={`/posts/${cat}?page=${page + 1}${baseQuery}`} className="btn btn--ghost">
                  다음 →
                </Link>
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

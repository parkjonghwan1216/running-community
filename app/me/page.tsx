import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { findById, getUserStats } from '@/lib/repositories/users';
import { listPostsByAuthor } from '@/lib/repositories/posts';
import { listCommentsByAuthor } from '@/lib/repositories/comments';
import { listRacesByCreator } from '@/lib/repositories/races';
import TimeAgo from '@/components/TimeAgo';
import { htmlToPreview } from '@/lib/sanitize';
import ProfileEditor from './ProfileEditor';

export const metadata: Metadata = { title: '마이페이지' };

const PER_PAGE = 10;

type Tab = 'posts' | 'comments' | 'races';

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect('/login');
  const user = findById(session.userId);
  if (!user) redirect('/login');

  const sp = await searchParams;
  const tab = (['posts', 'comments', 'races'].includes(sp.tab ?? '') ? sp.tab : 'posts') as Tab;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const stats = getUserStats(user.id);

  return (
    <>
      <div className="section-head">
        <div>
          <h1>마이페이지</h1>
          <p className="section-head__meta">활동을 한곳에서 확인하세요.</p>
        </div>
      </div>

      <ProfileEditor
        email={user.email}
        initialName={user.display_name}
        initialBio={user.bio ?? ''}
      />

      <div className="profile-stats card" style={{ marginTop: 16 }}>
        <div><strong>{stats.posts}</strong><span>글</span></div>
        <div><strong>{stats.comments}</strong><span>댓글</span></div>
        <div><strong>{stats.races}</strong><span>대회</span></div>
        <div><strong>{stats.likes_received}</strong><span>받은 좋아요</span></div>
      </div>

      <nav className="tabs" role="tablist" style={{ marginTop: 24 }}>
        <Link href="/me?tab=posts" role="tab" aria-selected={tab === 'posts'} className={`tabs__tab${tab === 'posts' ? ' is-active' : ''}`}>내 글 ({stats.posts})</Link>
        <Link href="/me?tab=comments" role="tab" aria-selected={tab === 'comments'} className={`tabs__tab${tab === 'comments' ? ' is-active' : ''}`}>내 댓글 ({stats.comments})</Link>
        <Link href="/me?tab=races" role="tab" aria-selected={tab === 'races'} className={`tabs__tab${tab === 'races' ? ' is-active' : ''}`}>등록 대회 ({stats.races})</Link>
        <Link href="/me/shoes" className="tabs__tab">러닝화 보유함</Link>
      </nav>

      <section style={{ marginTop: 16 }}>
        {tab === 'posts' && <PostsTab userId={user.id} page={page} />}
        {tab === 'comments' && <CommentsTab userId={user.id} page={page} />}
        {tab === 'races' && <RacesTab userId={user.id} />}
      </section>
    </>
  );
}

function Pager({
  page,
  total,
  perPage,
  base,
}: {
  page: number;
  total: number;
  perPage: number;
  base: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="페이지">
      {page > 1 ? (
        <Link href={`${base}&page=${page - 1}`} className="btn btn--ghost">← 이전</Link>
      ) : (
        <span className="btn btn--ghost is-disabled">← 이전</span>
      )}
      <span className="muted pagination__indicator">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={`${base}&page=${page + 1}`} className="btn btn--ghost">다음 →</Link>
      ) : (
        <span className="btn btn--ghost is-disabled">다음 →</span>
      )}
    </nav>
  );
}

async function PostsTab({ userId, page }: { userId: number; page: number }) {
  const { items, total, perPage } = listPostsByAuthor(userId, page, PER_PAGE);
  if (items.length === 0) return <div className="card empty-state"><p>아직 작성한 글이 없습니다.</p></div>;
  return (
    <>
      <ul className="post-list">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.category}/${p.id}`} className="post-list__item">
              <div className="post-list__title">{p.title}</div>
              <div className="post-list__preview">{htmlToPreview(p.body, 100)}</div>
              <div className="post-list__meta">
                <span className="chip" style={{ fontSize: 11 }}>
                  {p.category === 'training' ? '훈련방법' : '자유'}
                </span>
                <TimeAgo date={p.created_at} className="dot-sep" />
                <span className="dot-sep">댓글 {p.comment_count ?? 0}</span>
                <span className="dot-sep">♡ {p.like_count ?? 0}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} total={total} perPage={perPage} base="/me?tab=posts" />
    </>
  );
}

async function CommentsTab({ userId, page }: { userId: number; page: number }) {
  const { items, total, perPage } = listCommentsByAuthor(userId, page, PER_PAGE);
  if (items.length === 0) return <div className="card empty-state"><p>아직 작성한 댓글이 없습니다.</p></div>;
  return (
    <>
      <ul className="post-list">
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/posts/${c.post_category}/${c.post_id}`} className="post-list__item">
              <div className="post-list__title">{c.body}</div>
              <div className="post-list__meta">
                <span className="muted">↳ {c.post_title}</span>
                <TimeAgo date={c.created_at} className="dot-sep" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} total={total} perPage={perPage} base="/me?tab=comments" />
    </>
  );
}

async function RacesTab({ userId }: { userId: number }) {
  const races = listRacesByCreator(userId);
  if (races.length === 0) return <div className="card empty-state"><p>아직 등록한 대회가 없습니다.</p></div>;
  return (
    <ul className="post-list">
      {races.map((r) => (
        <li key={r.id}>
          <Link href={`/races/${r.id}`} className="post-list__item">
            <div className="post-list__title">{r.name}</div>
            <div className="post-list__meta">
              <span>{r.race_date}</span>
              <span className="dot-sep">{r.location}</span>
              <span className="dot-sep">{r.distance_km}km</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

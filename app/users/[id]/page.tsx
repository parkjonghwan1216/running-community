import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findById, getUserStats } from '@/lib/repositories/users';
import { listPostsByAuthor } from '@/lib/repositories/posts';
import { htmlToPreview } from '@/lib/sanitize';
import TimeAgo from '@/components/TimeAgo';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = findById(Number(id));
  if (!user) return { title: '사용자를 찾을 수 없음' };
  return { title: `${user.display_name} 님의 프로필` };
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const user = findById(Number(id));
  if (!user) notFound();
  const stats = getUserStats(user.id);
  const { items } = listPostsByAuthor(user.id, 1, 10);

  return (
    <>
      <div className="profile-card card card--pad-lg">
        <div className="profile-card__head">
          <div className="profile-avatar">{user.display_name.slice(0, 1)}</div>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>{user.display_name}</h1>
            <div className="muted" style={{ fontSize: 14 }}>
              가입일 <TimeAgo date={user.created_at} />
            </div>
          </div>
        </div>
        {user.bio && <p className="profile-bio">{user.bio}</p>}
        <div className="profile-stats">
          <div><strong>{stats.posts}</strong><span>글</span></div>
          <div><strong>{stats.comments}</strong><span>댓글</span></div>
          <div><strong>{stats.races}</strong><span>등록 대회</span></div>
          <div><strong>{stats.likes_received}</strong><span>받은 좋아요</span></div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>최근 글</h2>
      {items.length === 0 ? (
        <div className="card empty-state"><p>아직 작성한 글이 없습니다.</p></div>
      ) : (
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
                  <span className="dot-sep">좋아요 {p.like_count ?? 0}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

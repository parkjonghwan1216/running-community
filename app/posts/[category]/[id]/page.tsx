import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPost } from '@/lib/repositories/posts';
import { listByPost } from '@/lib/repositories/comments';
import { hasLiked } from '@/lib/repositories/likes';
import { getSession } from '@/lib/session';
import { sanitizePostHtml, htmlToPreview } from '@/lib/sanitize';
import { linkGlossaryTerms } from '@/lib/glossary-linker';
import { listGlossary } from '@/lib/repositories/glossary';
import TimeAgo from '@/components/TimeAgo';
import CommentSection from './CommentSection';
import PostActions from './PostActions';
import LikeButton from './LikeButton';

type Props = {
  params: Promise<{ category: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = getPost(Number(id));
  if (!post) return { title: '글을 찾을 수 없음' };
  return {
    title: post.title,
    description: htmlToPreview(post.body, 150),
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { category, id } = await params;
  const post = getPost(Number(id));
  if (!post || post.category !== category) notFound();
  const comments = listByPost(post.id);
  const session = await getSession();
  const currentUserId = session.userId ?? null;
  const isAuthor = currentUserId === post.author_id;
  const safeHtml = linkGlossaryTerms(sanitizePostHtml(post.body), listGlossary());
  const liked = currentUserId ? hasLiked(currentUserId, post.id) : false;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/posts/${category}`} className="muted" style={{ fontSize: 14 }}>
          ← {category === 'training' ? '훈련방법' : '자유게시판'} 목록
        </Link>
      </div>

      <article className="article">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="chip">
            {category === 'training' ? '훈련방법' : '자유게시판'}
          </span>
          {isAuthor && <PostActions postId={post.id} category={category} />}
        </div>
        <h1 className="article__title">{post.title}</h1>
        <div className="article__meta">
          <Link href={`/users/${post.author_id}`} className="article__author">
            {post.author_name}
          </Link>
          <TimeAgo date={post.created_at} className="dot-sep" />
          {post.updated_at !== post.created_at && (
            <span className="dot-sep soft">수정됨</span>
          )}
        </div>

        {(post.run_distance_km || post.run_pace || post.run_type) && (
          <div className="run-card">
            <div className="run-card__label">🏃 오늘의 런</div>
            <div className="run-card__stats">
              {post.run_distance_km && (
                <div className="run-card__stat">
                  <span className="run-card__value">{post.run_distance_km}</span>
                  <span className="run-card__unit">km</span>
                </div>
              )}
              {post.run_pace && (
                <div className="run-card__stat">
                  <span className="run-card__value">{post.run_pace}</span>
                  <span className="run-card__unit">/km</span>
                </div>
              )}
              {post.run_type && (
                <div className="run-card__stat">
                  <span className="run-badge run-badge--type" style={{ fontSize: 13 }}>{post.run_type}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rich-content" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        <div className="article__like-row">
          <LikeButton
            postId={post.id}
            initialCount={post.like_count ?? 0}
            initialLiked={liked}
            loggedIn={currentUserId !== null}
          />
        </div>

        <section className="comments">
          <h2 style={{ marginBottom: 14 }}>댓글 {comments.length}개</h2>
          <CommentSection
            postId={post.id}
            initialComments={comments}
            currentUserId={currentUserId}
          />
        </section>
      </article>
    </>
  );
}

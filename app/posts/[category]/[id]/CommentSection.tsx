'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import TimeAgo from '@/components/TimeAgo';

interface Comment {
  id: number;
  body: string;
  parent_id: number | null;
  author_id?: number;
  author_name?: string;
  created_at: string;
}

export default function CommentSection({
  postId,
  initialComments,
  currentUserId,
}: {
  postId: number;
  initialComments: Comment[];
  currentUserId: number | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const parents = comments.filter((c) => c.parent_id === null);
    const replies = new Map<number, Comment[]>();
    for (const c of comments) {
      if (c.parent_id !== null) {
        const arr = replies.get(c.parent_id) ?? [];
        arr.push(c);
        replies.set(c.parent_id, arr);
      }
    }
    return { parents, replies };
  }, [comments]);

  async function postComment(text: string, parentId?: number) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parentId ? { body: text, parentId } : { body: text }),
    });
    if (res.status === 401) {
      setError('로그인이 필요합니다.');
      return null;
    }
    if (!res.ok) {
      toast.error('등록에 실패했습니다');
      return null;
    }
    const created: Comment = await res.json();
    setComments((cs) => [...cs, created]);
    return created;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await postComment(body);
    if (ok) {
      setBody('');
      toast.success('댓글이 등록되었습니다');
    }
  }

  async function onSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (replyTo === null) return;
    const ok = await postComment(replyBody, replyTo);
    if (ok) {
      setReplyBody('');
      setReplyTo(null);
      toast.success('답글이 등록되었습니다');
    }
  }

  async function onDelete(id: number) {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setComments((cs) => cs.filter((c) => c.id !== id && c.parent_id !== id));
      toast.success('삭제되었습니다');
    } else {
      toast.error('삭제에 실패했습니다');
    }
  }

  function CommentBody({ c, isReply }: { c: Comment; isReply?: boolean }) {
    const mine = currentUserId !== null && c.author_id === currentUserId;
    return (
      <>
        <div className="comment__head">
          {c.author_id ? (
            <Link href={`/users/${c.author_id}`} className="comment__author">
              {c.author_name}
            </Link>
          ) : (
            <strong>{c.author_name}</strong>
          )}
          <TimeAgo date={c.created_at} />
          <div className="comment__actions">
            {!isReply && currentUserId !== null && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyBody('');
                }}
              >
                답글
              </button>
            )}
            {mine && (
              <button type="button" className="link-btn" onClick={() => onDelete(c.id)}>
                삭제
              </button>
            )}
          </div>
        </div>
        <div className="comment__body">{c.body}</div>
      </>
    );
  }

  return (
    <>
      {grouped.parents.length > 0 && (
        <ul className="comments__list">
          {grouped.parents.map((c) => (
            <li key={c.id} className="comment">
              <CommentBody c={c} />
              {(grouped.replies.get(c.id) ?? []).length > 0 && (
                <ul className="comments__replies">
                  {(grouped.replies.get(c.id) ?? []).map((r) => (
                    <li key={r.id} className="comment comment--reply">
                      <CommentBody c={r} isReply />
                    </li>
                  ))}
                </ul>
              )}
              {replyTo === c.id && (
                <form onSubmit={onSubmitReply} className="comment-form comment-form--reply">
                  <input
                    className="input"
                    placeholder={`@${c.author_name}에게 답글…`}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="submit" className="btn btn--primary">등록</button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyBody('');
                    }}
                  >
                    취소
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {currentUserId === null ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          댓글을 남기려면 <Link href="/login" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>로그인</Link>이 필요해요.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="comment-form">
          <input
            className="input"
            placeholder="댓글을 남겨보세요"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--primary">등록</button>
        </form>
      )}
      {error && <div className="notice--error">{error}</div>}
    </>
  );
}

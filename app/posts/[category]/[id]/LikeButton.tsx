'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
  loggedIn,
}: {
  postId: number;
  initialCount: number;
  initialLiked: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      const j = (await res.json()) as { liked: boolean; count: number };
      setLiked(j.liked);
      setCount(j.count);
    } else {
      toast.error('처리에 실패했습니다');
    }
  }

  return (
    <button
      type="button"
      className={`like-btn${liked ? ' is-liked' : ''}`}
      onClick={onClick}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
    >
      <span aria-hidden>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  );
}

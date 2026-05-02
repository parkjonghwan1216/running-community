'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PostActions({ postId, category }: { postId: number; category: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm('이 글을 정말 삭제할까요? 되돌릴 수 없습니다.')) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('글이 삭제되었습니다');
      router.push(`/posts/${category}`);
      router.refresh();
    } else {
      toast.error('삭제에 실패했습니다');
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <Link href={`/posts/${category}/${postId}/edit`} className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 13 }}>
        수정
      </Link>
      <button
        type="button"
        className="btn btn--ghost"
        style={{ padding: '6px 12px', fontSize: 13, color: 'var(--danger)' }}
        onClick={onDelete}
        disabled={busy}
      >
        {busy ? '삭제 중…' : '삭제'}
      </button>
    </div>
  );
}

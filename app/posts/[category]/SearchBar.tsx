'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({
  category,
  initial,
}: {
  category: 'free' | 'training';
  initial: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/posts/${category}?q=${encodeURIComponent(v)}` : `/posts/${category}`);
  }

  return (
    <form onSubmit={submit} className="search-bar">
      <input
        className="input"
        placeholder="제목·본문 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setQ('');
            router.push(`/posts/${category}`);
          }}
        >
          지우기
        </button>
      )}
      <button type="submit" className="btn btn--primary">검색</button>
    </form>
  );
}

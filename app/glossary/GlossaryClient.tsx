'use client';
import { useState } from 'react';

interface Term {
  id: number;
  term: string;
  definition: string;
}

export default function GlossaryClient({ initialItems }: { initialItems: Term[] }) {
  const [items, setItems] = useState<Term[]>(initialItems);
  const [q, setQ] = useState('');

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = q.trim() ? `/api/glossary?q=${encodeURIComponent(q)}` : '/api/glossary';
    const res = await fetch(url);
    if (res.ok) setItems(await res.json());
  }

  return (
    <>
      <form onSubmit={onSearch} className="search-bar">
        <input
          className="input"
          placeholder="용어 또는 정의로 검색 (예: LSD, 케이던스)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn--ghost">검색</button>
      </form>
      {items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__title">검색 결과가 없습니다</div>
          <p>다른 키워드로 다시 시도해보세요.</p>
        </div>
      ) : (
        <ul className="glossary-grid">
          {items.map((t) => (
            <li key={t.id} className="term-card">
              <div className="term-card__term">{t.term}</div>
              <div className="term-card__def">{t.definition}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

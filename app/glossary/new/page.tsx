'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTermPage() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch('/api/glossary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term, definition }),
    });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (res.status === 409) {
      setError('이미 등록된 용어입니다.');
      setSubmitting(false);
      return;
    }
    if (res.ok) router.push('/glossary');
    else {
      setError('등록에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1>새 용어 등록</h1>
          <p className="section-head__meta">사전을 함께 풍성하게 만들어주세요.</p>
        </div>
      </div>

      <div className="card card--pad-lg" style={{ maxWidth: 640 }}>
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label">용어</label>
            <input
              className="input"
              placeholder="예: LSD, VO2max, 케이던스"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label">정의</label>
            <textarea
              className="textarea"
              placeholder="용어를 처음 보는 러너도 이해할 수 있도록 풀어 적어주세요"
              rows={6}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
            />
          </div>
          {error && <div className="notice--error">{error}</div>}
          <div className="form__actions">
            <Link href="/glossary" className="btn btn--ghost">취소</Link>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? '등록 중…' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

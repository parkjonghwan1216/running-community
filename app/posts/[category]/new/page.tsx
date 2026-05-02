'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RichEditor from '@/components/RichEditor';

const RUN_TYPES = ['LSD', '인터벌', '템포런', '파틀렉', '회복런', '레이스', '빌드업', '기타'] as const;

export default function NewPostPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showRun, setShowRun] = useState(false);
  const [runDist, setRunDist] = useState('');
  const [runPace, setRunPace] = useState('');
  const [runType, setRunType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.replace(/<[^>]*>/g, '').trim()) {
      setError('본문을 입력해주세요.');
      return;
    }
    if (showRun && runPace && !/^\d+:\d{2}$/.test(runPace)) {
      setError('페이스는 "5:30" 형식으로 입력해주세요.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload: Record<string, unknown> = { category: params.category, title, body };
    if (showRun) {
      if (runDist) payload.runDistanceKm = parseFloat(runDist);
      if (runPace) payload.runPace = runPace;
      if (runType) payload.runType = runType;
    }
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) {
      const post = await res.json();
      router.push(`/posts/${params.category}/${post.id}`);
    } else {
      setError('작성에 실패했습니다. 입력 내용을 확인해주세요.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1>새 글 작성</h1>
          <p className="section-head__meta">{params.category === 'training' ? '훈련방법' : '자유게시판'}</p>
        </div>
      </div>

      <div className="card card--pad-lg">
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label">제목</label>
            <input
              className="input"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label">본문</label>
            <RichEditor value={body} onChange={setBody} placeholder="러너들과 나누고 싶은 이야기를 적어주세요…" />
          </div>

          <div className="run-attach">
            <button
              type="button"
              className={`run-attach__toggle ${showRun ? 'is-active' : ''}`}
              onClick={() => setShowRun((v) => !v)}
            >
              <span className="run-attach__icon">🏃</span>
              오늘 달린 기록 첨부
              <span className="run-attach__arrow">{showRun ? '▲' : '▼'}</span>
            </button>

            {showRun && (
              <div className="run-attach__fields">
                <div className="run-attach__row">
                  <div className="field">
                    <label className="field__label">거리 (km)</label>
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="300"
                      placeholder="10.5"
                      value={runDist}
                      onChange={(e) => setRunDist(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label">페이스 (/km)</label>
                    <input
                      className="input"
                      placeholder="5:30"
                      value={runPace}
                      onChange={(e) => setRunPace(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label">훈련 종류</label>
                    <select
                      className="input"
                      value={runType}
                      onChange={(e) => setRunType(e.target.value)}
                    >
                      <option value="">선택 안함</option>
                      {RUN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <div className="notice--error">{error}</div>}
          <div className="form__actions">
            <Link href={`/posts/${params.category}`} className="btn btn--ghost">취소</Link>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? '등록 중…' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

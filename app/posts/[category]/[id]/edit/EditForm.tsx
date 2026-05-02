'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RichEditor from '@/components/RichEditor';

const RUN_TYPES = ['LSD', '인터벌', '템포런', '파틀렉', '회복런', '레이스', '빌드업', '기타'] as const;

export default function EditForm({
  postId,
  category,
  initialTitle,
  initialBody,
  initialRunDistanceKm,
  initialRunPace,
  initialRunType,
}: {
  postId: number;
  category: string;
  initialTitle: string;
  initialBody: string;
  initialRunDistanceKm?: number | null;
  initialRunPace?: string | null;
  initialRunType?: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [showRun, setShowRun] = useState(
    !!(initialRunDistanceKm || initialRunPace || initialRunType),
  );
  const [runDist, setRunDist] = useState(initialRunDistanceKm?.toString() ?? '');
  const [runPace, setRunPace] = useState(initialRunPace ?? '');
  const [runType, setRunType] = useState(initialRunType ?? '');
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
    const payload: Record<string, unknown> = { title, body };
    if (showRun) {
      payload.runDistanceKm = runDist ? parseFloat(runDist) : null;
      payload.runPace = runPace || null;
      payload.runType = runType || null;
    } else {
      payload.runDistanceKm = null;
      payload.runPace = null;
      payload.runType = null;
    }
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push(`/posts/${category}/${postId}`);
      router.refresh();
    } else {
      setError('수정에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div className="card card--pad-lg">
      <form onSubmit={onSubmit} className="form">
        <div className="field">
          <label className="field__label">제목</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label className="field__label">본문</label>
          <RichEditor value={body} onChange={setBody} />
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
                  <input className="input" type="number" step="0.1" min="0.1" max="300"
                    placeholder="10.5" value={runDist} onChange={(e) => setRunDist(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field__label">페이스 (/km)</label>
                  <input className="input" placeholder="5:30" value={runPace}
                    onChange={(e) => setRunPace(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field__label">훈련 종류</label>
                  <select className="input" value={runType} onChange={(e) => setRunType(e.target.value)}>
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
          <Link href={`/posts/${category}/${postId}`} className="btn btn--ghost">취소</Link>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

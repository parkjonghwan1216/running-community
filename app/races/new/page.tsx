'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewRacePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    raceDate: '',
    location: '',
    distanceKm: '',
    description: '',
    registrationUrl: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      raceDate: form.raceDate,
      location: form.location,
      distanceKm: Number(form.distanceKm),
    };
    if (form.description) payload.description = form.description;
    if (form.registrationUrl) payload.registrationUrl = form.registrationUrl;

    const res = await fetch('/api/races', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (res.ok) router.push('/races');
    else {
      setError('등록에 실패했습니다.');
      setSubmitting(false);
    }
  }

  function bind<K extends keyof typeof form>(key: K) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [key]: e.target.value }),
    };
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1>대회 등록</h1>
          <p className="section-head__meta">다른 러너에게 새로운 대회를 공유합니다.</p>
        </div>
      </div>

      <div className="card card--pad-lg" style={{ maxWidth: 640 }}>
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label">대회명</label>
            <input className="input" placeholder="예: 2026 서울 마라톤" required {...bind('name')} />
          </div>
          <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field__label">날짜</label>
              <input className="input" type="date" required {...bind('raceDate')} />
            </div>
            <div>
              <label className="field__label">거리 (km)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="42.195"
                required
                {...bind('distanceKm')}
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">장소</label>
            <input className="input" placeholder="예: 서울 광화문" required {...bind('location')} />
          </div>
          <div className="field">
            <label className="field__label">설명 (선택)</label>
            <textarea className="textarea" placeholder="대회 코스, 참가 조건 등을 적어주세요" rows={4} {...bind('description')} />
          </div>
          <div className="field">
            <label className="field__label">참가 신청 URL (선택)</label>
            <input className="input" placeholder="https://" {...bind('registrationUrl')} />
          </div>
          {error && <div className="notice--error">{error}</div>}
          <div className="form__actions">
            <Link href="/races" className="btn btn--ghost">취소</Link>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? '등록 중…' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

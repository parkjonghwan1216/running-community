'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface GpxMeta {
  path: string;
  name: string | null;
  distanceKm: number;
  elevationM: number;
  geojson: object;
}

export default function NewCourseForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [gpxMeta, setGpxMeta] = useState<GpxMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/gpx', { method: 'POST', body: form });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? 'GPX 업로드 실패');
        return;
      }
      const meta: GpxMeta = await res.json();
      setGpxMeta(meta);
      if (!title && meta.name) setTitle(meta.name);
      toast.success('GPX 파일이 분석되었습니다');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gpxMeta) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          gpxPath: gpxMeta.path,
          distanceKm: gpxMeta.distanceKm || undefined,
          elevationM: gpxMeta.elevationM || undefined,
          geojson: JSON.stringify(gpxMeta.geojson),
        }),
      });
      if (!res.ok) {
        toast.error('코스 등록 실패');
        return;
      }
      const course = await res.json();
      toast.success('코스가 등록되었습니다');
      router.push(`/courses/${course.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ maxWidth: 640 }}>
      <div className="field">
        <label className="field__label">GPX 파일 *</label>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml,text/xml"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '분석 중…' : 'GPX 파일 선택'}
          </button>
          {gpxMeta && (
            <span className="chip chip--sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {gpxMeta.distanceKm} km · ↑ {gpxMeta.elevationM} m
            </span>
          )}
        </div>
        {!gpxMeta && <p className="field__hint">GPS 기기나 앱에서 내보낸 .gpx 파일을 올려주세요 (최대 5MB)</p>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="title">제목 *</label>
        <input
          id="title"
          className="input"
          placeholder="예: 남산 야간 10k 코스"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="desc">설명</label>
        <textarea
          id="desc"
          className="textarea"
          placeholder="코스 특징, 난이도, 주의사항 등을 적어주세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
        />
      </div>

      <div className="form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!gpxMeta || !title.trim() || submitting}
        >
          {submitting ? '등록 중…' : '코스 등록'}
        </button>
      </div>
    </form>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProfileEditor({
  email,
  initialName,
  initialBio,
}: {
  email: string;
  initialName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error('닉네임을 입력하세요');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: name.trim(), bio: bio.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('프로필이 저장되었습니다');
      setEditing(false);
      router.refresh();
    } else {
      toast.error('저장에 실패했습니다');
    }
  }

  return (
    <div className="card card--pad-lg">
      <div className="field__label" style={{ marginBottom: 4 }}>이메일</div>
      <div className="muted" style={{ marginBottom: 14 }}>{email}</div>
      {!editing ? (
        <>
          <div className="field__label" style={{ marginBottom: 4 }}>닉네임</div>
          <div style={{ marginBottom: 14, fontWeight: 600, fontSize: 16 }}>{initialName}</div>
          <div className="field__label" style={{ marginBottom: 4 }}>자기소개</div>
          <div style={{ marginBottom: 16, color: initialBio ? 'inherit' : 'var(--text-soft)' }}>
            {initialBio || '아직 소개가 없습니다.'}
          </div>
          <button className="btn btn--ghost" onClick={() => setEditing(true)}>프로필 편집</button>
        </>
      ) : (
        <>
          <div className="field">
            <label className="field__label">닉네임</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field__label">자기소개 ({bio.length}/500)</label>
            <textarea
              className="textarea"
              rows={4}
              maxLength={500}
              placeholder="달리기 경력, 목표, 좋아하는 코스 등 자유롭게"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setName(initialName);
                setBio(initialBio);
                setEditing(false);
              }}
            >
              취소
            </button>
          </div>
        </>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.ok) {
      router.refresh();
      router.push('/');
    } else if (res.status === 409) {
      setError('이미 사용 중인 이메일입니다.');
      setSubmitting(false);
    } else {
      setError('가입에 실패했습니다. 입력 내용을 확인해주세요.');
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>러너 가족이 되어주세요</h1>
        <p className="auth-card__sub">이메일로 30초 만에 가입할 수 있어요.</p>
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label">이메일</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label">비밀번호</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label">닉네임</label>
            <input
              className="input"
              placeholder="러너 누구든 환영해요"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          {error && <div className="notice--error">{error}</div>}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? '가입 중…' : '가입하기'}
          </button>
        </form>
        <div className="auth-card__foot">
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.refresh();
      router.push('/');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>다시 만나서 반가워요</h1>
        <p className="auth-card__sub">러너 계정으로 로그인하세요.</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="notice--error">{error}</div>}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <div className="auth-card__foot">
          아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

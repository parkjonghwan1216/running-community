'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 운영 환경에서는 logger/Sentry로 교체 권장
    if (typeof window !== 'undefined') {
      window.console.error('app error:', error);
    }
  }, [error]);

  return (
    <div className="card card--pad-lg empty-state" style={{ padding: '72px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16, color: 'var(--danger)' }}>!</div>
      <div className="empty-state__title" style={{ fontSize: 22 }}>오류가 발생했습니다</div>
      <p style={{ marginBottom: 24 }}>
        잠시 후 다시 시도해주세요. 문제가 계속되면 새로고침 또는 홈으로 이동해보세요.
      </p>
      {error.digest && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
          오류 코드: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" onClick={reset} className="btn btn--primary">
          다시 시도
        </button>
        <Link href="/" className="btn btn--ghost">홈으로</Link>
      </div>
    </div>
  );
}

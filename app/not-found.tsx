import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card card--pad-lg empty-state" style={{ padding: '72px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 16, color: 'var(--accent)' }}>404</div>
      <div className="empty-state__title" style={{ fontSize: 22 }}>페이지를 찾을 수 없습니다</div>
      <p style={{ marginBottom: 24 }}>
        요청하신 페이지가 삭제됐거나 주소가 변경되었을 수 있어요.
      </p>
      <Link href="/" className="btn btn--primary btn--lg">홈으로 돌아가기</Link>
    </div>
  );
}

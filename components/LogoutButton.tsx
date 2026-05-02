'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    router.push('/');
  }
  return (
    <button type="button" className="btn btn--ghost" onClick={logout}>
      로그아웃
    </button>
  );
}

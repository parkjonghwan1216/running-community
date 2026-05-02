import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { listShoes } from '@/lib/repositories/shoes';
import ShoesClient from './ShoesClient';

export const metadata: Metadata = { title: '러닝화 보유함' };

export default async function ShoesPage() {
  const session = await getSession();
  if (!session.userId) redirect('/login');

  const shoes = listShoes(session.userId);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <a href="/me" className="muted" style={{ fontSize: 14 }}>← 마이페이지</a>
      </div>
      <ShoesClient initial={shoes} />
    </>
  );
}

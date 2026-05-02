import Link from 'next/link';
import GlossaryClient from './GlossaryClient';
import { listGlossary } from '@/lib/repositories/glossary';

export default async function GlossaryPage() {
  const initial = listGlossary();
  return (
    <>
      <div className="section-head">
        <div>
          <h1>러닝 용어 사전</h1>
          <p className="section-head__meta">총 {initial.length}개 용어 · 키워드로 빠르게 검색하세요</p>
        </div>
        <Link href="/glossary/new" className="btn btn--primary">용어 등록</Link>
      </div>
      <GlossaryClient initialItems={initial} />
    </>
  );
}

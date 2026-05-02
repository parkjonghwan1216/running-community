import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import NewCourseForm from './NewCourseForm';

export const metadata: Metadata = { title: '코스 등록' };

export default async function NewCoursePage() {
  const session = await getSession();
  if (!session.userId) redirect('/login');

  return (
    <>
      <div className="section-head">
        <div>
          <h1>코스 등록</h1>
          <p className="section-head__meta">GPX 파일을 업로드하면 지도가 자동으로 생성됩니다.</p>
        </div>
      </div>
      <NewCourseForm />
    </>
  );
}

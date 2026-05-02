import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCourse } from '@/lib/repositories/courses';
import { getSession } from '@/lib/session';
import TimeAgo from '@/components/TimeAgo';
import CourseMap from '@/components/CourseMap';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(Number(id));
  if (!course) return { title: '코스를 찾을 수 없음' };
  return { title: course.title };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const course = getCourse(Number(id));
  if (!course) notFound();

  const session = await getSession();
  const isAuthor = session.userId === course.author_id;
  const geojson = course.geojson ? JSON.parse(course.geojson) : null;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/courses" className="muted" style={{ fontSize: 14 }}>← 코스 목록</Link>
      </div>

      <article className="article">
        <h1 className="article__title">{course.title}</h1>
        <div className="article__meta">
          <Link href={`/users/${course.author_id}`} className="article__author">
            {course.author_name}
          </Link>
          <TimeAgo date={course.created_at} className="dot-sep" />
          {isAuthor && (
            <DeleteCourseButton courseId={course.id} />
          )}
        </div>

        <div className="course-stats">
          {course.distance_km != null && (
            <div className="course-stat">
              <strong>{course.distance_km}</strong>
              <span>km</span>
            </div>
          )}
          {course.elevation_m != null && (
            <div className="course-stat">
              <strong>{course.elevation_m}</strong>
              <span>m 상승</span>
            </div>
          )}
        </div>

        {geojson ? (
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <CourseMap geojson={geojson} />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>
            지도 데이터가 없습니다.
          </div>
        )}

        {course.description && (
          <div style={{ marginTop: 20, lineHeight: 1.75 }}>{course.description}</div>
        )}

        <div style={{ marginTop: 24 }}>
          <a
            href={course.gpx_path}
            download
            className="btn btn--ghost"
          >
            GPX 파일 다운로드
          </a>
        </div>
      </article>
    </>
  );
}

function DeleteCourseButton({ courseId }: { courseId: number }) {
  return (
    <form
      action={async () => {
        'use server';
        const { getSession } = await import('@/lib/session');
        const { deleteCourse } = await import('@/lib/repositories/courses');
        const { redirect } = await import('next/navigation');
        const s = await getSession();
        const c = await import('@/lib/repositories/courses').then((m) => m.getCourse(courseId));
        if (!c || c.author_id !== s.userId) return;
        deleteCourse(courseId);
        redirect('/courses');
      }}
      style={{ display: 'inline' }}
    >
      <button type="submit" className="link-btn" style={{ color: 'var(--danger)', marginLeft: 12 }}>
        삭제
      </button>
    </form>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createCourse, listCourses } from '@/lib/repositories/courses';

const schema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  gpxPath: z.string().startsWith('/uploads/gpx/'),
  distanceKm: z.number().nonnegative().optional(),
  elevationM: z.number().nonnegative().optional(),
  geojson: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1') || 1;
  const { items, total } = listCourses(Math.max(1, page), 20);
  return NextResponse.json({ items, total });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '입력이 올바르지 않습니다' }, { status: 400 });
  }

  const course = createCourse({ authorId: session.userId, ...parsed.data });
  return NextResponse.json(course, { status: 201 });
}

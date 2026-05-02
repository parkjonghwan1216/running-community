import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getSession } from '@/lib/session';
import { getCourse, deleteCourse } from '@/lib/repositories/courses';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = getCourse(Number(id));
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(course);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const course = getCourse(Number(id));
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (course.author_id !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const gpxPath = deleteCourse(Number(id));
  if (gpxPath) {
    const fullPath = path.join(process.cwd(), 'public', gpxPath);
    await fs.unlink(fullPath).catch(() => {});
  }

  return new NextResponse(null, { status: 204 });
}

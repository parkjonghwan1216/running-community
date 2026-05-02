import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getSession } from '@/lib/session';
import { parseGpx } from '@/lib/gpx-parser';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'gpx');

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '파일이 너무 큽니다 (최대 5MB)' }, { status: 400 });
  }

  const text = await file.text();
  if (!text.includes('<gpx') && !text.includes('<trk')) {
    return NextResponse.json({ error: 'GPX 파일이 아닙니다' }, { status: 400 });
  }

  const parsed = parseGpx(text);
  if (parsed.geojson && (parsed.geojson as { geometry: { coordinates: unknown[] } }).geometry.coordinates.length === 0) {
    return NextResponse.json({ error: 'GPX에 트랙 데이터가 없습니다' }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.gpx`;
  const dest = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(dest, text, 'utf8');

  return NextResponse.json({
    path: `/uploads/gpx/${filename}`,
    name: parsed.name,
    distanceKm: parsed.distanceKm,
    elevationM: parsed.elevationGainM,
    geojson: parsed.geojson,
  });
}

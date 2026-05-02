import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { getSession } from '@/lib/session';

const ALLOWED_INPUT = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15MB pre-resize
const MAX_DIMENSION = 1600;
const QUALITY = 82;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: 'too_large', max: MAX_INPUT_BYTES }, { status: 413 });
  }
  if (!ALLOWED_INPUT.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type', type: file.type }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === 'image/gif';

  let outBuf: Buffer;
  let ext: 'webp' | 'gif';
  try {
    if (isGif) {
      // Keep GIF as-is (animated). Optionally cap size; basic pass-through.
      outBuf = buf;
      ext = 'gif';
    } else {
      outBuf = await sharp(buf, { failOn: 'error' })
        .rotate() // honor EXIF then strip (default sharp drops metadata)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      ext = 'webp';
    }
  } catch {
    return NextResponse.json({ error: 'invalid_image' }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), outBuf);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    size: outBuf.length,
    originalSize: file.size,
  });
}

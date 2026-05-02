import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PostUpdateSchema } from '@/lib/schemas';
import { deletePost, getPost, updatePost } from '@/lib/repositories/posts';
import { getSession } from '@/lib/session';
import { extractUploadPaths, sanitizePostHtml } from '@/lib/sanitize';

interface Ctx { params: Promise<{ id: string }> }

async function purgePaths(paths: string[]): Promise<void> {
  await Promise.all(
    paths.map(async (p) => {
      try {
        const safe = path.posix.normalize(p);
        if (!safe.startsWith('/uploads/')) return;
        const filename = safe.slice('/uploads/'.length);
        if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return;
        await fs.unlink(path.join(process.cwd(), 'public', 'uploads', filename));
      } catch {
        // ignore — file may already be missing
      }
    }),
  );
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const post = getPost(Number(id));
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PostUpdateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const previous = getPost(Number(id));
  const sanitized = {
    ...parsed.data,
    ...(parsed.data.body !== undefined ? { body: sanitizePostHtml(parsed.data.body) } : {}),
  };
  const result = updatePost(Number(id), session.userId, {
    title: sanitized.title,
    body: sanitized.body,
    runDistanceKm: sanitized.runDistanceKm,
    runPace: sanitized.runPace,
    runType: sanitized.runType,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.reason === 'not_found' ? 404 : 403 },
    );
  }

  if (previous && sanitized.body !== undefined) {
    const before = new Set(extractUploadPaths(previous.body));
    const after = new Set(extractUploadPaths(sanitized.body));
    const dropped = [...before].filter((p) => !after.has(p));
    if (dropped.length) await purgePaths(dropped);
  }

  return NextResponse.json(getPost(Number(id)));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const result = deletePost(Number(id), session.userId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.reason === 'not_found' ? 404 : 403 },
    );
  }
  if (result.body) await purgePaths(extractUploadPaths(result.body));
  return new NextResponse(null, { status: 204 });
}

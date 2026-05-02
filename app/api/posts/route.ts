import { NextRequest, NextResponse } from 'next/server';
import { PostCategory, PostCreateSchema } from '@/lib/schemas';
import { createPost, listPosts } from '@/lib/repositories/posts';
import { getSession } from '@/lib/session';
import { sanitizePostHtml } from '@/lib/sanitize';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryRaw = searchParams.get('category') ?? 'free';
  const cat = PostCategory.safeParse(categoryRaw);
  if (!cat.success) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
  }
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  return NextResponse.json(listPosts(cat.data, page));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PostCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
  }
  const post = createPost({
    category: parsed.data.category,
    authorId: session.userId,
    title: parsed.data.title,
    body: sanitizePostHtml(parsed.data.body),
    runDistanceKm: parsed.data.runDistanceKm,
    runPace: parsed.data.runPace,
    runType: parsed.data.runType,
  });
  return NextResponse.json(post, { status: 201 });
}

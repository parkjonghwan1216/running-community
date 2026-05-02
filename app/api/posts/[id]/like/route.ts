import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { toggleLike } from '@/lib/repositories/likes';
import { getPost } from '@/lib/repositories/posts';

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const post = getPost(Number(id));
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const result = toggleLike(session.userId, post.id);
  return NextResponse.json(result);
}

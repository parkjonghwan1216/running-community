import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createComment, getComment, listByPost } from '@/lib/repositories/comments';
import { getPost } from '@/lib/repositories/posts';
import { getSession } from '@/lib/session';

const Schema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.number().int().positive().optional(),
});

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json(listByPost(Number(id)));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const post = getPost(Number(id));
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  let parentId: number | null = null;
  if (parsed.data.parentId) {
    const parent = getComment(parsed.data.parentId);
    if (!parent || parent.post_id !== post.id) {
      return NextResponse.json({ error: 'invalid_parent' }, { status: 400 });
    }
    // enforce single-level: if parent itself is a reply, attach to root
    parentId = parent.parent_id ?? parent.id;
  }
  const created = createComment(post.id, session.userId, parsed.data.body, parentId);
  return NextResponse.json(created, { status: 201 });
}

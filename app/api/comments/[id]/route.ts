import { NextRequest, NextResponse } from 'next/server';
import { deleteComment } from '@/lib/repositories/comments';
import { getSession } from '@/lib/session';

interface Ctx { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const ok = deleteComment(Number(id), session.userId);
  if (!ok) return NextResponse.json({ error: 'forbidden_or_not_found' }, { status: 403 });
  return new NextResponse(null, { status: 204 });
}

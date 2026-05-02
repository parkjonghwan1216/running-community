import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createShoe, listShoes } from '@/lib/repositories/shoes';

const schema = z.object({
  brand: z.string().min(1).max(60),
  model: z.string().min(1).max(100),
  color: z.string().max(40).optional(),
  boughtAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  kmInitial: z.number().nonnegative().max(10000).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(listShoes(session.userId));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '입력이 올바르지 않습니다' }, { status: 400 });
  }

  const shoe = createShoe({ ownerId: session.userId, ...parsed.data });
  return NextResponse.json(shoe, { status: 201 });
}

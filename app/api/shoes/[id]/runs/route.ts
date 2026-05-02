import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { getShoe, addRun, listRuns } from '@/lib/repositories/shoes';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  km: z.number().positive().max(300),
  runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
});

export async function GET(_: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const shoe = getShoe(Number(id));
  if (!shoe || shoe.owner_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(listRuns(Number(id)));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const shoe = getShoe(Number(id));
  if (!shoe || shoe.owner_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '입력이 올바르지 않습니다' }, { status: 400 });
  }

  addRun(Number(id), parsed.data.km, parsed.data.runDate, parsed.data.note);
  return NextResponse.json({ ok: true }, { status: 201 });
}

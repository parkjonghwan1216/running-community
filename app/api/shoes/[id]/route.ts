import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getShoe, retireShoe, deleteShoe } from '@/lib/repositories/shoes';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const shoe = getShoe(Number(id));
  if (!shoe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (shoe.owner_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  deleteShoe(Number(id));
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const shoe = getShoe(Number(id));
  if (!shoe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (shoe.owner_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action } = await req.json();
  if (action === 'retire') {
    retireShoe(Number(id));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

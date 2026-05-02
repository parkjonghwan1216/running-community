import { NextRequest, NextResponse } from 'next/server';
import { RaceCreateSchema } from '@/lib/schemas';
import { createRace, listRaces } from '@/lib/repositories/races';
import { getSession } from '@/lib/session';

export async function GET() {
  return NextResponse.json(listRaces());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = RaceCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
  }
  const race = createRace({ ...parsed.data, createdBy: session.userId });
  return NextResponse.json(race, { status: 201 });
}

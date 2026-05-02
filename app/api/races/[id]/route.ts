import { NextRequest, NextResponse } from 'next/server';
import { getRace } from '@/lib/repositories/races';

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const race = getRace(Number(id));
  if (!race) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(race);
}

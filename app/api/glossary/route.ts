import { NextRequest, NextResponse } from 'next/server';
import { GlossaryCreateSchema } from '@/lib/schemas';
import { createGlossary, findTerm, listGlossary } from '@/lib/repositories/glossary';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  return NextResponse.json(listGlossary(q));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = GlossaryCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (findTerm(parsed.data.term)) {
    return NextResponse.json({ error: 'term_exists' }, { status: 409 });
  }
  const created = createGlossary(parsed.data.term, parsed.data.definition, session.userId);
  return NextResponse.json(created, { status: 201 });
}

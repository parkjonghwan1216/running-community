import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { updateProfile } from '@/lib/repositories/users';

const PatchSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const updated = updateProfile(session.userId, parsed.data);
  if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (parsed.data.displayName) {
    session.displayName = updated.display_name;
    await session.save();
  }
  return NextResponse.json({
    displayName: updated.display_name,
    bio: updated.bio,
  });
}

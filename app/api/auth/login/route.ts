import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/schemas';
import { verifyPassword } from '@/lib/auth';
import { findByEmail } from '@/lib/repositories/users';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const user = findByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.displayName = user.display_name;
  await session.save();
  return NextResponse.json({ id: user.id, email: user.email, displayName: user.display_name });
}

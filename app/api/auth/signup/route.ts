import { NextRequest, NextResponse } from 'next/server';
import { SignupSchema } from '@/lib/schemas';
import { hashPassword } from '@/lib/auth';
import { createUser, findByEmail } from '@/lib/repositories/users';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, displayName } = parsed.data;
  if (findByEmail(email)) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 });
  }
  const user = createUser(email, await hashPassword(password), displayName);
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.displayName = user.display_name;
  await session.save();
  return NextResponse.json({ id: user.id, email: user.email, displayName: user.display_name }, { status: 201 });
}

import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: number;
  email?: string;
  displayName?: string;
}

const sessionPassword =
  process.env.SESSION_PASSWORD ??
  'dev-only-insecure-password-change-me-please-32chars-min';

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: 'running_community_session',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

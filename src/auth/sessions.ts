import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { AppContext } from '../app';
import { sessions } from '../db/schema';
import { randomToken, sha256Hex } from './tokens';
import { findCurrentUser, type CurrentUser } from './users';

const SESSION_DAYS = 30;

const isHttps = (c: AppContext) => new URL(c.req.url).protocol === 'https:';

/** `__Host-` cookies must be Secure, so plain-http local development uses a plain name. */
const cookieName = (c: AppContext) => (isHttps(c) ? '__Host-caten_session' : 'caten_session');

export async function startSession(c: AppContext, userId: number) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await drizzle(c.env.DB)
    .insert(sessions)
    .values({ id: await sha256Hex(token), userId, expiresAt: expiresAt.toISOString() });
  setCookie(c, cookieName(c), token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Lax',
    path: '/',
    expires: expiresAt,
  });
}

/** The signed-in member, or null. An expired session is removed. */
export async function loadCurrentUser(c: AppContext): Promise<CurrentUser | null> {
  const token = getCookie(c, cookieName(c));
  if (!token) return null;
  const id = await sha256Hex(token);
  const row = await findCurrentUser(c.env.DB, id);
  if (!row) return null;
  if (Date.parse(row.expiresAt) <= Date.now()) {
    await drizzle(c.env.DB).delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return { id: row.id, email: row.email, isAdmin: row.isAdmin, name: row.name };
}

export async function endSession(c: AppContext) {
  const token = getCookie(c, cookieName(c));
  if (token) {
    await drizzle(c.env.DB)
      .delete(sessions)
      .where(eq(sessions.id, await sha256Hex(token)));
  }
  deleteCookie(c, cookieName(c), { path: '/', secure: isHttps(c) });
}

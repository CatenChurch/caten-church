import { env } from 'cloudflare:test';
import { exports } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { sha256Hex } from '../src/auth/tokens';
import * as schema from '../src/db/schema';

export const BASE = 'http://caten.test';

export function get(path: string, cookie?: string) {
  return exports.default.fetch(
    new Request(`${BASE}${path}`, {
      redirect: 'manual',
      headers: cookie ? { Cookie: cookie } : {},
    }),
  );
}

/** Submits a form the way a browser on this site would (same-origin, url-encoded). */
export function post(path: string, fields: Record<string, string> = {}, cookie?: string) {
  return exports.default.fetch(
    new Request(`${BASE}${path}`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: BASE,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: new URLSearchParams(fields),
    }),
  );
}

/** A session cookie for this member, as if they had just signed in. */
export async function signInAs(userId: number, expiresAt = hoursFromNow(1)) {
  const token = `token-${userId}-${crypto.randomUUID()}`;
  await db()
    .insert(schema.sessions)
    .values({ id: await sha256Hex(token), userId, expiresAt });
  return `caten_session=${token}`;
}

/** The value a response sets for a cookie, or undefined. */
export function setCookieValue(response: Response, name: string) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(';');
    const [key, ...rest] = pair!.split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

/** The one-time message a response leaves for the next page. */
export function flashOf(response: Response) {
  const value = setCookieValue(response, 'flash');
  return value
    ? (JSON.parse(decodeURIComponent(value)) as { type: string; message: string })
    : null;
}

export const db = () => drizzle(env.DB);

export async function createUser(name: string) {
  const [user] = await db()
    .insert(schema.users)
    .values({ email: `${name}@example.com` })
    .returning();
  await db().insert(schema.profiles).values({ userId: user!.id, name });
  return user!;
}

export async function createWeekly(values: Partial<typeof schema.weeklies.$inferInsert> = {}) {
  const [weekly] = await db()
    .insert(schema.weeklies)
    .values({ title: '主日週報', issue: 1, publishedAt: '2026-01-04T01:00:00.000Z', ...values })
    .returning();
  return weekly!;
}

const HOUR = 3_600_000;
function at(offsetHours: number) {
  return new Date(Date.now() + offsetHours * HOUR).toISOString();
}

/** An event whose registration is open now unless the offsets say otherwise. */
export async function createEvent(values: Partial<typeof schema.events.$inferInsert> = {}) {
  const [event] = await db()
    .insert(schema.events)
    .values({
      name: '夏令營',
      description: '三天兩夜',
      maxSignUpNumber: 30,
      signUpBegin: at(-24),
      signUpEnd: at(24),
      start: at(48),
      over: at(72),
      ...values,
    })
    .returning();
  return event!;
}

export const hoursFromNow = at;

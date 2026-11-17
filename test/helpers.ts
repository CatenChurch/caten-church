import { env } from 'cloudflare:test';
import { exports } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../src/db/schema';

export const BASE = 'http://caten.test';

export function get(path: string) {
  return exports.default.fetch(new Request(`${BASE}${path}`, { redirect: 'manual' }));
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
const at = (offsetHours: number) => new Date(Date.now() + offsetHours * HOUR).toISOString();

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

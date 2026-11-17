import { count, desc, eq, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { weeklies } from '../db/schema';

export type Weekly = typeof weeklies.$inferSelect;

export const WEEKLIES_PER_PAGE = 25;

export async function listWeeklies(d1: D1Database, page: number) {
  const db = drizzle(d1);
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(weeklies)
      .orderBy(desc(weeklies.id))
      .limit(WEEKLIES_PER_PAGE)
      .offset((page - 1) * WEEKLIES_PER_PAGE),
    db.select({ total: count() }).from(weeklies),
  ]);
  const total = totals[0]?.total ?? 0;
  return { rows, totalPages: Math.max(1, Math.ceil(total / WEEKLIES_PER_PAGE)) };
}

export async function findWeekly(d1: D1Database, id: number): Promise<Weekly | undefined> {
  const rows = await drizzle(d1).select().from(weeklies).where(eq(weeklies.id, id)).limit(1);
  return rows[0];
}

/** The newest weekly that is already published. */
export async function findLatestWeekly(d1: D1Database, now = new Date()) {
  const rows = await drizzle(d1)
    .select()
    .from(weeklies)
    .where(lte(weeklies.publishedAt, now.toISOString()))
    .orderBy(desc(weeklies.id))
    .limit(1);
  return rows[0];
}

export async function countWeeklyView(d1: D1Database, id: number) {
  await drizzle(d1)
    .update(weeklies)
    .set({ viewedCount: sql`${weeklies.viewedCount} + 1` })
    .where(eq(weeklies.id, id));
}

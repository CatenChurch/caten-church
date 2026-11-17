import { and, count, desc, eq, getTableColumns, gte, lt, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { events } from '../db/schema';

export const EXPIRED_EVENTS_PER_PAGE = 6;

const eventWithCount = {
  ...getTableColumns(events),
  // Written out by hand: Drizzle drops the table name from interpolated columns here, which
  // would compare event_users.event_id with event_users.id.
  participantsCount: sql<number>`(select count(*) from event_users where event_users.event_id = events.id)`,
};

export type EventSummary = Awaited<ReturnType<typeof listOpenEvents>>[number];

/** Events whose registration window contains `now`. */
export function listOpenEvents(d1: D1Database, now = new Date()) {
  const iso = now.toISOString();
  return drizzle(d1)
    .select(eventWithCount)
    .from(events)
    .where(and(lte(events.signUpBegin, iso), gte(events.signUpEnd, iso)))
    .orderBy(desc(events.id));
}

/** Events whose registration has closed, newest first. */
export async function listExpiredEvents(d1: D1Database, page: number, now = new Date()) {
  const db = drizzle(d1);
  const expired = lt(events.signUpEnd, now.toISOString());
  const [rows, totals] = await Promise.all([
    db
      .select(eventWithCount)
      .from(events)
      .where(expired)
      .orderBy(desc(events.id))
      .limit(EXPIRED_EVENTS_PER_PAGE)
      .offset((page - 1) * EXPIRED_EVENTS_PER_PAGE),
    db.select({ total: count() }).from(events).where(expired),
  ]);
  const total = totals[0]?.total ?? 0;
  return { rows, totalPages: Math.max(1, Math.ceil(total / EXPIRED_EVENTS_PER_PAGE)) };
}

export async function findEvent(d1: D1Database, id: number) {
  const rows = await drizzle(d1)
    .select(eventWithCount)
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return rows[0];
}

/** What visitors see for the head count: hidden when the organizer turned it off. */
export function shownParticipantsCount(event: EventSummary) {
  return event.showParticipants ? String(event.participantsCount) : '?';
}

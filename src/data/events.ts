import { asc, count, desc, eq, gte, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { events } from '../db/schema';
import { fromTaipeiInput } from '../format';

export type Event = typeof events.$inferSelect;

export const PAST_EVENTS_PER_PAGE = 6;

/** Events that have not ended yet, soonest first. */
export function listUpcomingEvents(d1: D1Database, now = new Date()) {
  return drizzle(d1)
    .select()
    .from(events)
    .where(gte(events.over, now.toISOString()))
    .orderBy(asc(events.start), asc(events.id));
}

/** Events that have ended, most recent first. */
export async function listPastEvents(d1: D1Database, page: number, now = new Date()) {
  const db = drizzle(d1);
  const ended = lt(events.over, now.toISOString());
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(events)
      .where(ended)
      .orderBy(desc(events.start), desc(events.id))
      .limit(PAST_EVENTS_PER_PAGE)
      .offset((page - 1) * PAST_EVENTS_PER_PAGE),
    db.select({ total: count() }).from(events).where(ended),
  ]);
  const total = totals[0]?.total ?? 0;
  return { rows, totalPages: Math.max(1, Math.ceil(total / PAST_EVENTS_PER_PAGE)) };
}

/** Every event, newest first, for the admin list. */
export function listAllEvents(d1: D1Database) {
  return drizzle(d1).select().from(events).orderBy(desc(events.start), desc(events.id));
}

export async function findEvent(d1: D1Database, id: number): Promise<Event | undefined> {
  const rows = await drizzle(d1).select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0];
}

// --- Admin form ---

export interface EventForm {
  name: string;
  description: string;
  content: string;
  /** `datetime-local` values in Taipei time. */
  start: string;
  over: string;
  signupUrl: string;
}
export type EventErrors = Partial<Record<keyof EventForm, string>>;

export function readEventForm(form: Record<string, unknown>): EventForm {
  const str = (key: string) => (typeof form[key] === 'string' ? form[key].trim() : '');
  return {
    name: str('name'),
    description: str('description'),
    content: str('content'),
    start: str('start'),
    over: str('over'),
    signupUrl: str('signupUrl'),
  };
}

/** Checks the form; `values` is what to store when there are no errors. */
export function validateEvent(form: EventForm) {
  const errors: EventErrors = {};
  const start = fromTaipeiInput(form.start);
  const over = fromTaipeiInput(form.over);
  if (!form.name) errors.name = '請填寫活動名稱';
  if (!start) errors.start = '請填寫活動開始時間';
  if (!over) errors.over = '請填寫活動結束時間';
  if (start && over && start >= over) errors.over = '活動結束的時間要比活動開始的時間晚';
  // The link becomes a button on a public page: only https
  if (form.signupUrl && !/^https:\/\/[^\s]+$/.test(form.signupUrl)) {
    errors.signupUrl = '報名表單連結必須以 https:// 開頭';
  }
  if (Object.keys(errors).length > 0 || !start || !over) return { errors, values: null };
  return {
    errors,
    values: {
      name: form.name,
      description: form.description || null,
      content: form.content || null,
      start,
      over,
      signupUrl: form.signupUrl || null,
    },
  };
}

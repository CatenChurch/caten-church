import { and, asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { eventUsers, profiles } from '../db/schema';
import { findProfile, validateProfile, type ProfileInput } from './account';
import type { EventSummary } from './events';

export function isOpenForRegistration(event: EventSummary, now = new Date()) {
  const iso = now.toISOString();
  return event.signUpBegin <= iso && iso <= event.signUpEnd;
}

export async function isRegistered(d1: D1Database, eventId: number, userId: number) {
  const rows = await drizzle(d1)
    .select({ id: eventUsers.id })
    .from(eventUsers)
    .where(and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/** True when the member's profile has everything an event registration needs. */
export async function hasProfileForEvents(d1: D1Database, userId: number) {
  const profile = await findProfile(d1, userId);
  if (!profile) return false;
  const input = Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [key, value === null ? '' : String(value)]),
  ) as unknown as ProfileInput;
  // The terms were accepted when the profile was saved
  return Object.keys(validateProfile(input, { termsAccepted: true, forEvent: true })).length === 0;
}

export type JoinResult = 'joined' | 'closed' | 'full' | 'already_joined' | 'profile_incomplete';

export async function joinEvent(
  d1: D1Database,
  event: EventSummary,
  userId: number,
  remark: string,
  now = new Date(),
): Promise<JoinResult> {
  if (!(await hasProfileForEvents(d1, userId))) return 'profile_incomplete';
  if (!isOpenForRegistration(event, now)) return 'closed';
  if (await isRegistered(d1, event.id, userId)) return 'already_joined';

  // One statement checks the head count and inserts, so two people cannot take the last seat.
  // Nothing to pay or to check in for means those are already done.
  const result = await d1
    .prepare(
      `INSERT INTO event_users (event_id, user_id, remark, paid, arrival)
       SELECT ?1, ?2, ?3, ?4, ?5
       WHERE (SELECT count(*) FROM event_users WHERE event_id = ?1) < ?6
       ON CONFLICT (event_id, user_id) DO NOTHING`,
    )
    .bind(
      event.id,
      userId,
      remark.trim().slice(0, 200) || null,
      event.registrationFee ? 0 : 1,
      event.checkArrival ? 0 : 1,
      event.maxSignUpNumber,
    )
    .run();
  if (result.meta.changes > 0) return 'joined';
  return (await isRegistered(d1, event.id, userId)) ? 'already_joined' : 'full';
}

export type QuitResult = 'quit' | 'closed' | 'not_joined';

export async function quitEvent(
  d1: D1Database,
  event: EventSummary,
  userId: number,
  now = new Date(),
): Promise<QuitResult> {
  if (!isOpenForRegistration(event, now)) return 'closed';
  const deleted = await drizzle(d1)
    .delete(eventUsers)
    .where(and(eq(eventUsers.eventId, event.id), eq(eventUsers.userId, userId)))
    .returning({ id: eventUsers.id });
  return deleted.length > 0 ? 'quit' : 'not_joined';
}

/** Names only: what fellow participants may see of each other. */
export function listParticipantNames(d1: D1Database, eventId: number) {
  return drizzle(d1)
    .select({ name: profiles.name })
    .from(eventUsers)
    .leftJoin(profiles, eq(profiles.userId, eventUsers.userId))
    .where(eq(eventUsers.eventId, eventId))
    .orderBy(asc(eventUsers.id));
}

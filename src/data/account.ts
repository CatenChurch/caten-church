import { desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { events, eventUsers, profiles, subscriptions } from '../db/schema';

export type Profile = typeof profiles.$inferSelect;

export const SEXES = ['男', '女'] as const;

export const PROFILE_LABELS = {
  name: '姓名',
  sex: '性別',
  birth: '生日',
  idNumber: '身分證字號',
  phone: '電話',
  cellphone: '行動電話',
  emergencyContact: '緊急聯絡人電話',
  address: '地址',
  education: '學歷',
} as const;

export type ProfileField = keyof typeof PROFILE_LABELS;
export type ProfileInput = Record<ProfileField, string>;
export type ProfileErrors = Partial<Record<ProfileField | 'terms', string>>;

const FIELDS = Object.keys(PROFILE_LABELS) as ProfileField[];

/** Trimmed text for every profile field from a submitted form. */
export function readProfileForm(form: Record<string, unknown>): ProfileInput {
  return Object.fromEntries(
    FIELDS.map((field) => [field, typeof form[field] === 'string' ? form[field].trim() : '']),
  ) as ProfileInput;
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Same rules as the Rails site: name, sex and birth are always required and the terms must
 * be accepted. `forEvent` adds what an event registration needs (ID number and an emergency
 * contact); outside of that the ID number is optional but must be well-formed when given.
 */
export function validateProfile(
  input: ProfileInput,
  options: { termsAccepted: boolean; forEvent?: boolean },
): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!input.name) errors.name = '請填寫姓名';
  if (!(SEXES as readonly string[]).includes(input.sex)) errors.sex = '請選擇性別';
  if (!input.birth) errors.birth = '請填寫生日';
  else if (!isRealDate(input.birth)) errors.birth = '生日格式應為 2000-01-31';
  else if (input.birth > new Date().toISOString().slice(0, 10)) errors.birth = '生日不能是未來';

  const idNumberOk = /^[a-z][12]\d{8}$/i.test(input.idNumber);
  if (options.forEvent && !input.idNumber) errors.idNumber = '報名活動需要填寫身分證字號';
  else if (input.idNumber && !idNumberOk) {
    errors.idNumber = '身分證字號為 10 碼：第 1 碼英文字母，第 2 碼 1 或 2，後 8 碼數字';
  }
  if (options.forEvent && !input.emergencyContact) {
    errors.emergencyContact = '報名活動需要填寫緊急聯絡人電話';
  }
  if (!options.termsAccepted) errors.terms = '請閱讀並接受隱私條款';
  return errors;
}

export async function findProfile(d1: D1Database, userId: number) {
  const [row] = await drizzle(d1)
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row;
}

export async function saveProfile(d1: D1Database, userId: number, input: ProfileInput) {
  const values = {
    name: input.name,
    sex: input.sex,
    birth: input.birth,
    idNumber: input.idNumber.toUpperCase() || null,
    phone: input.phone || null,
    cellphone: input.cellphone || null,
    emergencyContact: input.emergencyContact || null,
    address: input.address || null,
    education: input.education || null,
  };
  await drizzle(d1)
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...values, updatedAt: new Date().toISOString() },
    });
}

export async function findSubscription(d1: D1Database, userId: number) {
  const [row] = await drizzle(d1)
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  // Members imported without a row get the defaults
  return { newEvents: row?.newEvents ?? false, joinedEvents: row?.joinedEvents ?? true };
}

export async function saveSubscription(
  d1: D1Database,
  userId: number,
  values: { newEvents: boolean; joinedEvents: boolean },
) {
  await drizzle(d1)
    .insert(subscriptions)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { ...values, updatedAt: new Date().toISOString() },
    });
}

/** Events the member registered for, newest first. */
export function listJoinedEvents(d1: D1Database, userId: number) {
  return drizzle(d1)
    .select({
      ...getTableColumns(events),
      participantsCount: sql<number>`(select count(*) from event_users where event_users.event_id = events.id)`,
    })
    .from(eventUsers)
    .innerJoin(events, eq(events.id, eventUsers.eventId))
    .where(eq(eventUsers.userId, userId))
    .orderBy(desc(events.start));
}

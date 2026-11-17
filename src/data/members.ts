import { and, asc, count, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { profiles, users } from '../db/schema';

export const MEMBERS_PER_PAGE = 25;

export interface MemberFilters {
  /** Matches email, name, phone or mobile. */
  q: string;
  sex: string;
  /** Birth month 1-12, or null for any. */
  month: number | null;
  adminsOnly: boolean;
}

export function readMemberFilters(query: Record<string, string | undefined>): MemberFilters {
  const month = Number(query.month);
  return {
    q: (query.q ?? '').trim().slice(0, 100),
    sex: query.sex === '男' || query.sex === '女' ? query.sex : '',
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : null,
    adminsOnly: query.admins === '1',
  };
}

/** The filters as a query string, for pagination and export links. */
export function memberFilterQuery(filters: MemberFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.sex) params.set('sex', filters.sex);
  if (filters.month) params.set('month', String(filters.month));
  if (filters.adminsOnly) params.set('admins', '1');
  return params.toString();
}

const memberColumns = {
  id: users.id,
  email: users.email,
  isAdmin: users.isAdmin,
  lastSignInAt: users.lastSignInAt,
  createdAt: users.createdAt,
  name: profiles.name,
  sex: profiles.sex,
  birth: profiles.birth,
  idNumber: profiles.idNumber,
  phone: profiles.phone,
  cellphone: profiles.cellphone,
  emergencyContact: profiles.emergencyContact,
  address: profiles.address,
  education: profiles.education,
};

export type Member = Awaited<ReturnType<typeof findMember>> & {};

function conditions(filters: MemberFilters): SQL | undefined {
  const parts: (SQL | undefined)[] = [];
  if (filters.q) {
    // `%` and `_` typed by the admin are searched for literally
    const pattern = `%${filters.q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
    const contains = (column: Parameters<typeof like>[0]) =>
      sql`${column} LIKE ${pattern} ESCAPE '\\'`;
    parts.push(
      or(
        contains(users.email),
        contains(profiles.name),
        contains(profiles.phone),
        contains(profiles.cellphone),
      ),
    );
  }
  if (filters.sex) parts.push(eq(profiles.sex, filters.sex));
  if (filters.month) {
    parts.push(sql`substr(${profiles.birth}, 6, 2) = ${String(filters.month).padStart(2, '0')}`);
  }
  if (filters.adminsOnly) parts.push(eq(users.isAdmin, true));
  return parts.length > 0 ? and(...parts) : undefined;
}

/** Members matching the filters; `page` null returns all of them (for the export). */
export async function listMembers(d1: D1Database, filters: MemberFilters, page: number | null) {
  const db = drizzle(d1);
  const where = conditions(filters);
  const base = db
    .select(memberColumns)
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(asc(users.id));
  const [rows, totals] = await Promise.all([
    page === null ? base : base.limit(MEMBERS_PER_PAGE).offset((page - 1) * MEMBERS_PER_PAGE),
    db
      .select({ total: count() })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(where),
  ]);
  const total = totals[0]?.total ?? 0;
  return { rows, total, totalPages: Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE)) };
}

export async function findMember(d1: D1Database, id: number) {
  const [row] = await drizzle(d1)
    .select(memberColumns)
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  return row;
}

export async function setAdmin(d1: D1Database, id: number, isAdmin: boolean) {
  await drizzle(d1)
    .update(users)
    .set({ isAdmin, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));
}

/** Sets or clears a member's email. Returns false when another member already uses it. */
export async function setEmail(d1: D1Database, id: number, email: string | null) {
  const db = drizzle(d1);
  if (email) {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (taken && taken.id !== id) return false;
  }
  await db
    .update(users)
    .set({ email, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));
  return true;
}

/**
 * Folds the account `fromId` into `targetId` and deletes it. Used when one person ended up
 * with two accounts, e.g. an old email/password account and a new one made by signing in
 * with LINE. The target keeps its own profile if it has one; otherwise it takes the other's.
 * Ways to sign in move over. The target does
 * not become an admin through a merge.
 */
export async function mergeMembers(d1: D1Database, targetId: number, fromId: number) {
  if (targetId === fromId) throw new Error('cannot merge a member into itself');
  const [target, from] = await Promise.all([findMember(d1, targetId), findMember(d1, fromId)]);
  if (!target || !from) throw new Error('member not found');
  const targetHasProfile = target.name !== null || target.birth !== null || target.sex !== null;

  const statements = [
    d1.prepare('UPDATE oauth_accounts SET user_id = ?1 WHERE user_id = ?2').bind(targetId, fromId),
  ];
  if (!targetHasProfile) {
    statements.push(
      d1.prepare('DELETE FROM profiles WHERE user_id = ?1').bind(targetId),
      d1.prepare('UPDATE profiles SET user_id = ?1 WHERE user_id = ?2').bind(targetId, fromId),
    );
  }
  // Deleting the old account also removes its sessions and whatever was not moved
  statements.push(d1.prepare('DELETE FROM users WHERE id = ?1').bind(fromId));
  if (!target.email && from.email) {
    statements.push(
      d1.prepare('UPDATE users SET email = ?1 WHERE id = ?2').bind(from.email, targetId),
    );
  }
  // One batch is one transaction: either the whole merge happens or none of it
  await d1.batch(statements);
}

const CSV_COLUMNS: [string, (m: Member) => string | number | null][] = [
  ['編號', (m) => m.id],
  ['Email', (m) => m.email],
  ['姓名', (m) => m.name],
  ['性別', (m) => m.sex],
  ['生日', (m) => m.birth],
  ['身分證字號', (m) => m.idNumber],
  ['電話', (m) => m.phone],
  ['行動電話', (m) => m.cellphone],
  ['緊急聯絡人電話', (m) => m.emergencyContact],
  ['地址', (m) => m.address],
];

function csvCell(value: string | number | null) {
  let text = value === null ? '' : String(value);
  // A leading = + - @ would run as a formula when the file is opened in a spreadsheet
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV with a byte-order mark so Excel reads the Chinese text as UTF-8. */
export function membersCsv(rows: Member[]) {
  const lines = [
    CSV_COLUMNS.map(([header]) => csvCell(header)).join(','),
    ...rows.map((row) => CSV_COLUMNS.map(([, get]) => csvCell(get(row))).join(',')),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
}

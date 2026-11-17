import { and, asc, eq, isNotNull, ne } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { groups, groupUsers, profiles, users } from '../db/schema';

export interface GroupForm {
  name: string;
  introduction: string;
  description: string;
  sequence: string;
  /** Member id of the leader, or empty for none. */
  leaderId: string;
}
export type GroupErrors = Partial<Record<keyof GroupForm, string>>;

export function readGroupForm(form: Record<string, unknown>): GroupForm {
  const str = (key: string) => (typeof form[key] === 'string' ? form[key].trim() : '');
  return {
    name: str('name'),
    introduction: str('introduction'),
    description: str('description'),
    sequence: str('sequence'),
    leaderId: str('leaderId'),
  };
}

/** Members who can be picked as a group leader: everyone with a name on their profile. */
export function listLeaderCandidates(d1: D1Database) {
  return drizzle(d1)
    .select({ id: users.id, name: profiles.name, email: users.email })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(isNotNull(profiles.name))
    .orderBy(asc(profiles.name), asc(users.id));
}

export async function findGroupForEdit(d1: D1Database, id: number) {
  const [row] = await drizzle(d1)
    .select({
      id: groups.id,
      name: groups.name,
      introduction: groups.introduction,
      description: groups.description,
      sequence: groups.sequence,
      leaderId: groupUsers.userId,
    })
    .from(groups)
    .leftJoin(groupUsers, and(eq(groupUsers.groupId, groups.id), eq(groupUsers.role, 'leader')))
    .where(eq(groups.id, id))
    .limit(1);
  return row;
}

/**
 * Checks the form against the database (unique name, existing leader). `values` is what to
 * store when there are no errors; `groupId` is the group being edited, if any.
 */
export async function validateGroup(d1: D1Database, form: GroupForm, groupId: number | null) {
  const db = drizzle(d1);
  const errors: GroupErrors = {};
  if (!form.name) errors.name = '請填寫小組名稱';
  else {
    const [sameName] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(
        groupId === null
          ? eq(groups.name, form.name)
          : and(eq(groups.name, form.name), ne(groups.id, groupId)),
      )
      .limit(1);
    if (sameName) errors.name = '已經有同名的小組';
  }
  if (!form.introduction) errors.introduction = '請填寫簡述';
  if (form.sequence && !/^\d{1,6}$/.test(form.sequence)) errors.sequence = '排序需為數字';

  let leaderId: number | null = null;
  if (form.leaderId) {
    leaderId = /^[1-9]\d{0,14}$/.test(form.leaderId) ? Number(form.leaderId) : null;
    const [leader] =
      leaderId === null
        ? []
        : await db.select({ id: users.id }).from(users).where(eq(users.id, leaderId)).limit(1);
    if (!leader) errors.leaderId = '找不到這位會友';
  }

  if (Object.keys(errors).length > 0) return { errors, values: null };
  return {
    errors,
    values: {
      name: form.name,
      introduction: form.introduction,
      description: form.description || null,
      sequence: form.sequence ? Number(form.sequence) : null,
      leaderId,
    },
  };
}

type GroupValues = NonNullable<Awaited<ReturnType<typeof validateGroup>>['values']>;

/** Makes `leaderId` the only leader of the group (or leaves it without one). */
function leaderStatements(d1: D1Database, groupId: number, leaderId: number | null) {
  const statements = [
    d1
      .prepare(`UPDATE group_users SET role = 'member' WHERE group_id = ?1 AND role = 'leader'`)
      .bind(groupId),
  ];
  if (leaderId !== null) {
    statements.push(
      d1
        .prepare(
          `INSERT INTO group_users (group_id, user_id, role) VALUES (?1, ?2, 'leader')
           ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'leader'`,
        )
        .bind(groupId, leaderId),
    );
  }
  return statements;
}

export async function createGroup(d1: D1Database, values: GroupValues, createrId: number) {
  const { leaderId, ...group } = values;
  const [created] = await drizzle(d1)
    .insert(groups)
    .values({ ...group, createrId })
    .returning({ id: groups.id });
  if (leaderId !== null) await d1.batch(leaderStatements(d1, created!.id, leaderId));
  return created!.id;
}

export async function updateGroup(d1: D1Database, id: number, values: GroupValues) {
  const { leaderId, ...group } = values;
  await drizzle(d1)
    .update(groups)
    .set({ ...group, updatedAt: new Date().toISOString() })
    .where(eq(groups.id, id));
  await d1.batch(leaderStatements(d1, id, leaderId));
}

/** Deletes the group; its memberships go with it. */
export async function deleteGroup(d1: D1Database, id: number) {
  await drizzle(d1).delete(groups).where(eq(groups.id, id));
}

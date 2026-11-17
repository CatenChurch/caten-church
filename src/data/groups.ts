import { and, asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { groups, groupUsers, profiles } from '../db/schema';

const groupWithLeader = {
  id: groups.id,
  name: groups.name,
  introduction: groups.introduction,
  description: groups.description,
  sequence: groups.sequence,
  leaderName: profiles.name,
};

function selectGroups(d1: D1Database) {
  return drizzle(d1)
    .select(groupWithLeader)
    .from(groups)
    .leftJoin(groupUsers, and(eq(groupUsers.groupId, groups.id), eq(groupUsers.role, 'leader')))
    .leftJoin(profiles, eq(profiles.userId, groupUsers.userId));
}

export type GroupSummary = Awaited<ReturnType<typeof listGroups>>[number];

export function listGroups(d1: D1Database) {
  return selectGroups(d1).orderBy(asc(groups.sequence), asc(groups.id));
}

export async function findGroup(d1: D1Database, id: number) {
  const rows = await selectGroups(d1).where(eq(groups.id, id)).limit(1);
  return rows[0];
}

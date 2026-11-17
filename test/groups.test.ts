import { describe, expect, it } from 'vitest';
import { groups, groupUsers } from '../src/db/schema';
import { createUser, db, get } from './helpers';

describe('groups', () => {
  it('lists groups by sequence with the leader, not ordinary members', async () => {
    const leader = await createUser('王組長');
    const member = await createUser('陳組員');
    const [second, first] = await db()
      .insert(groups)
      .values([
        { name: '喜樂小組', introduction: '週五晚上', sequence: 2 },
        { name: '恩典小組', introduction: '週三晚上', sequence: 1 },
      ])
      .returning();
    await db()
      .insert(groupUsers)
      .values([
        { groupId: first!.id, userId: member.id, role: 'member' },
        { groupId: first!.id, userId: leader.id, role: 'leader' },
      ]);

    const html = await (await get('/groups')).text();
    expect(html.indexOf('恩典小組')).toBeLessThan(html.indexOf('喜樂小組'));
    expect(html).toContain('王組長');
    expect(html).not.toContain('陳組員');
    // One row per group even though the first group has two members
    expect(html.match(/恩典小組/g)).toHaveLength(1);
    expect(html).toContain(`/groups/${second!.id}`);
  });

  it('shows a group with its multi-line description', async () => {
    const [group] = await db()
      .insert(groups)
      .values({
        name: '青年團契',
        introduction: '歡迎青年',
        description: '第一段\n第二行\n\n第二段',
      })
      .returning();
    const html = await (await get(`/groups/${group!.id}`)).text();
    expect(html).toContain('<p>第一段<br/>第二行</p><p>第二段</p>');
  });

  it('returns 404 for a missing group', async () => {
    expect((await get('/groups/42')).status).toBe(404);
  });
});

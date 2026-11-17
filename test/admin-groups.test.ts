import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { groups, groupUsers, profiles, users } from '../src/db/schema';
import { db, flashOf, get, post, signInAs } from './helpers';

async function person(name: string | null, isAdmin = false) {
  const [user] = await db()
    .insert(users)
    .values({ email: `${name ?? `u${crypto.randomUUID()}`}@example.com`, isAdmin })
    .returning();
  if (name !== null) await db().insert(profiles).values({ userId: user!.id, name });
  return user!;
}

async function admin() {
  const user = await person('管理員', true);
  return { user, cookie: await signInAs(user.id) };
}

const fields = {
  name: '恩典小組',
  introduction: '週三晚上',
  description: '歡迎加入',
  sequence: '2',
  leaderId: '',
};
const leadersOf = (groupId: number) =>
  db().select().from(groupUsers).where(eq(groupUsers.groupId, groupId));

describe('managing groups', () => {
  it('is for admins only', async () => {
    const member = await person('一般會員');
    const cookie = await signInAs(member.id);
    expect((await get('/admin/groups', cookie)).status).toBe(404);
    expect((await post('/admin/groups', fields, cookie)).status).toBe(404);
    expect((await post('/admin/groups', fields)).status).toBe(302);
    expect(await db().select().from(groups)).toHaveLength(0);
  });

  it('creates a group with a leader and shows it on the public page', async () => {
    const { user, cookie } = await admin();
    const leader = await person('王組長');
    const response = await post(
      '/admin/groups',
      { ...fields, leaderId: String(leader.id) },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('建立小組成功');

    const [group] = await db().select().from(groups);
    expect(group).toMatchObject({
      name: '恩典小組',
      introduction: '週三晚上',
      description: '歡迎加入',
      sequence: 2,
      createrId: user.id,
    });
    expect(await leadersOf(group!.id)).toMatchObject([{ userId: leader.id, role: 'leader' }]);
    expect(await (await get(`/groups/${group!.id}`)).text()).toContain('王組長');
  });

  it('offers only members with a name as leaders', async () => {
    const { cookie } = await admin();
    await person('王組長');
    const nameless = await person(null);
    const html = await (await get('/admin/groups/new', cookie)).text();
    expect(html).toContain('王組長');
    expect(html).not.toContain(`value="${nameless.id}"`);
  });

  it.each([
    [{ name: '' }, '請填寫小組名稱'],
    [{ name: '已存在的小組' }, '已經有同名的小組'],
    [{ introduction: '' }, '請填寫簡述'],
    [{ sequence: '第一' }, '排序需為數字'],
    [{ leaderId: '999' }, '找不到這位會友'],
    [{ leaderId: 'abc' }, '找不到這位會友'],
  ])('rejects %o and keeps what was typed', async (change, message) => {
    const { cookie } = await admin();
    await db().insert(groups).values({ name: '已存在的小組', introduction: 'x' });
    const response = await post('/admin/groups', { ...fields, ...change }, cookie);
    expect(response.status).toBe(422);
    const html = await response.text();
    expect(html).toContain(message);
    expect(html).toContain('歡迎加入');
    expect(await db().select().from(groups)).toHaveLength(1);
  });

  it('changes the leader: the old one stays as a member, there is never more than one', async () => {
    const { cookie } = await admin();
    const first = await person('第一任組長');
    const second = await person('第二任組長');
    await post('/admin/groups', { ...fields, leaderId: String(first.id) }, cookie);
    const [group] = await db().select().from(groups);

    const form = await (await get(`/admin/groups/${group!.id}/edit`, cookie)).text();
    expect(form).toMatch(new RegExp(`value="${first.id}" selected`));

    await post(`/admin/groups/${group!.id}`, { ...fields, leaderId: String(second.id) }, cookie);
    const rows = await leadersOf(group!.id);
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.role === 'leader')).toMatchObject([{ userId: second.id }]);
    expect(rows.find((row) => row.userId === first.id)!.role).toBe('member');
    expect(await (await get('/groups')).text()).toContain('第二任組長');

    // Back to the first: their existing membership is promoted, not duplicated
    await post(`/admin/groups/${group!.id}`, { ...fields, leaderId: String(first.id) }, cookie);
    const again = await leadersOf(group!.id);
    expect(again).toHaveLength(2);
    expect(again.filter((row) => row.role === 'leader')).toMatchObject([{ userId: first.id }]);
  });

  it('can leave a group without a leader', async () => {
    const { cookie } = await admin();
    const leader = await person('王組長');
    await post('/admin/groups', { ...fields, leaderId: String(leader.id) }, cookie);
    const [group] = await db().select().from(groups);
    await post(`/admin/groups/${group!.id}`, fields, cookie);
    expect((await leadersOf(group!.id)).filter((row) => row.role === 'leader')).toHaveLength(0);
  });

  it('keeps its own name when edited, and updates the other fields', async () => {
    const { cookie } = await admin();
    await post('/admin/groups', fields, cookie);
    const [group] = await db().select().from(groups);
    const response = await post(
      `/admin/groups/${group!.id}`,
      { ...fields, introduction: '改到週四', sequence: '' },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('更新小組成功');
    const [updated] = await db().select().from(groups);
    expect(updated).toMatchObject({ name: '恩典小組', introduction: '改到週四', sequence: null });
  });

  it('deletes a group together with its memberships', async () => {
    const { cookie } = await admin();
    const leader = await person('王組長');
    await post('/admin/groups', { ...fields, leaderId: String(leader.id) }, cookie);
    const [group] = await db().select().from(groups);
    const response = await post(`/admin/groups/${group!.id}/delete`, {}, cookie);
    expect(flashOf(response)?.message).toBe('刪除小組成功');
    expect(await db().select().from(groups)).toHaveLength(0);
    expect(await db().select().from(groupUsers)).toHaveLength(0);
    expect((await get(`/groups/${group!.id}`)).status).toBe(404);
    expect((await post('/admin/groups/999/delete', {}, cookie)).status).toBe(404);
  });
});

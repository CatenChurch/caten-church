import { env } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { membersCsv, mergeMembers, type Member } from '../src/data/members';
import {
  events,
  groups,
  groupUsers,
  oauthAccounts,
  profiles,
  sessions,
  users,
} from '../src/db/schema';
import { createEvent, db, flashOf, get, post, signInAs } from './helpers';

async function person(
  name: string | null,
  options: Partial<typeof profiles.$inferInsert> & {
    email?: string | null;
    isAdmin?: boolean;
  } = {},
) {
  const { email, isAdmin, ...profile } = options;
  const [user] = await db()
    .insert(users)
    .values({
      email: email === undefined ? `${name ?? 'noname'}@example.com` : email,
      isAdmin: isAdmin ?? false,
    })
    .returning();
  if (name !== null) {
    await db()
      .insert(profiles)
      .values({ userId: user!.id, name, sex: '男', birth: '1990-03-09', ...profile });
  }
  return user!;
}

async function admin() {
  const user = await person('管理員', { isAdmin: true, email: 'admin@example.com' });
  return { user, cookie: await signInAs(user.id) };
}

const userRow = async (id: number) => (await db().select().from(users).where(eq(users.id, id)))[0];

describe('member list', () => {
  it('is for admins only, including the export', async () => {
    const member = await person('一般會員');
    const cookie = await signInAs(member.id);
    for (const path of ['/admin/members', '/admin/members.csv', `/admin/members/${member.id}`]) {
      expect((await get(path, cookie)).status).toBe(404);
      expect((await get(path)).status).toBe(302);
    }
  });

  it('searches by email, name or phone and treats % and _ literally', async () => {
    const { cookie } = await admin();
    await person('王小明', { cellphone: '0912345678' });
    await person('陳大華', { phone: '076178379', email: 'hua@example.com' });
    await person('100%_努力');

    const names = async (query: string) => {
      const page = await (await get(`/admin/members?${query}`, cookie)).text();
      // Only the result rows: the menu also shows the signed-in admin's name
      const html = page.slice(page.indexOf('<tbody>'), page.indexOf('</tbody>'));
      return ['王小明', '陳大華', '100%_努力', '管理員'].filter((name) => html.includes(`${name}`));
    };
    expect(await names('q=' + encodeURIComponent('小明'))).toEqual(['王小明']);
    expect(await names('q=0912')).toEqual(['王小明']);
    expect(await names('q=hua@')).toEqual(['陳大華']);
    expect(await names('q=' + encodeURIComponent('%_'))).toEqual(['100%_努力']);
    expect(await names('q=' + encodeURIComponent('%'))).toEqual(['100%_努力']);
    expect(await names('q=nobody')).toEqual([]);
  });

  it('filters by sex, birth month and admins', async () => {
    const { cookie } = await admin();
    await person('十二月女生', { sex: '女', birth: '1990-12-03' });
    await person('十二月男生', { sex: '男', birth: '1985-12-20' });
    await person('五月女生', { sex: '女', birth: '2000-05-05' });

    const html = await (
      await get(`/admin/members?sex=${encodeURIComponent('女')}&month=12`, cookie)
    ).text();
    expect(html).toContain('十二月女生');
    expect(html).not.toContain('十二月男生');
    expect(html).not.toContain('五月女生');
    expect(html).toContain('共 1 位');

    const admins = await (await get('/admin/members?admins=1', cookie)).text();
    expect(admins).toContain('共 1 位');
    // A nonsense month is ignored rather than matching nothing
    expect(await (await get('/admin/members?month=13', cookie)).text()).toContain('共 4 位');
  });

  it('keeps the filters on the page links and the export link', async () => {
    const { cookie } = await admin();
    for (let i = 0; i < 26; i += 1) await person(`會友${i}`, { sex: '女' });
    const html = await (await get(`/admin/members?sex=${encodeURIComponent('女')}`, cookie)).text();
    expect(html).toContain('共 26 位');
    expect(html).toContain('href="/admin/members?sex=%E5%A5%B3&amp;page=2"');
    expect(html).toContain('href="/admin/members.csv?sex=%E5%A5%B3"');
    const second = await (
      await get(`/admin/members?sex=${encodeURIComponent('女')}&page=2`, cookie)
    ).text();
    expect(second).toContain('會友25');
    expect(second).not.toContain('會友0<');
  });
});

describe('member export', () => {
  it('downloads the filtered members as CSV that Excel reads as UTF-8', async () => {
    const { cookie } = await admin();
    await person('王小明', {
      sex: '男',
      birth: '1990-12-03',
      idNumber: 'A123456789',
      cellphone: '0912345678',
      address: '高雄市,梓官區 "嘉展路"',
    });
    await person('五月會友', { birth: '2000-05-05' });

    const response = await get('/admin/members.csv?month=12', cookie);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lines = new TextDecoder().decode(bytes.slice(3)).trim().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      '"編號","Email","姓名","性別","生日","身分證字號","電話","行動電話","緊急聯絡人電話","地址"',
    );
    expect(lines[1]).toContain('"王小明","男","1990-12-03","A123456789","","0912345678",""');
    expect(lines[1]).toContain('"高雄市,梓官區 ""嘉展路"""');
  });

  it('defuses cells that a spreadsheet would run as formulas', () => {
    const row = { id: 1, email: '=cmd@example.com', name: '+SUM(A1)', address: '-1', phone: '@x' };
    const csv = membersCsv([row as unknown as Member]);
    expect(csv).toContain(`"'=cmd@example.com"`);
    expect(csv).toContain(`"'+SUM(A1)"`);
    expect(csv).toContain(`"'-1"`);
    expect(csv).toContain(`"'@x"`);
  });
});

describe('member page', () => {
  it('shows the profile and how the member signs in', async () => {
    const { cookie } = await admin();
    const member = await person('王小明', { idNumber: 'A123456789', address: '高雄市' });
    await db()
      .insert(oauthAccounts)
      .values({ userId: member.id, provider: 'google', providerUserId: 'g-1' });
    const html = await (await get(`/admin/members/${member.id}`, cookie)).text();
    for (const text of ['王小明', 'A123456789', '高雄市', 'Google', '設為管理員']) {
      expect(html).toContain(text);
    }
    expect((await get('/admin/members/999', cookie)).status).toBe(404);
  });

  it('corrects a member’s details and email', async () => {
    const { cookie } = await admin();
    const member = await person('王小名', { email: null });
    const response = await post(
      `/admin/members/${member.id}`,
      {
        email: ' Ming@Example.com ',
        name: '王小明',
        sex: '男',
        birth: '1990-03-09',
        address: '高雄市',
      },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('更新會友資料成功');
    expect((await userRow(member.id))!.email).toBe('ming@example.com');
    const [profile] = await db().select().from(profiles).where(eq(profiles.userId, member.id));
    expect(profile).toMatchObject({ name: '王小明', address: '高雄市' });
  });

  it.each([
    [{ email: 'not-an-email' }, 'Email 格式不正確'],
    [{ email: 'taken@example.com' }, '這個 email 已經是另一位會友的帳號'],
    [{ name: '' }, '請填寫姓名'],
    [{ idNumber: '123' }, '身分證字號為 10 碼'],
  ])('rejects %o without changing anything', async (change, message) => {
    const { cookie } = await admin();
    await person('別人', { email: 'taken@example.com' });
    const member = await person('王小明', { email: 'ming@example.com' });
    const response = await post(
      `/admin/members/${member.id}`,
      { email: 'ming@example.com', name: '王小明', sex: '男', birth: '1990-03-09', ...change },
      cookie,
    );
    expect(response.status).toBe(422);
    expect(await response.text()).toContain(message);
    expect((await userRow(member.id))!.email).toBe('ming@example.com');
    const [profile] = await db().select().from(profiles).where(eq(profiles.userId, member.id));
    expect(profile!.name).toBe('王小明');
  });
});

describe('admin rights', () => {
  it('grants and removes admin rights', async () => {
    const { cookie } = await admin();
    const member = await person('王小明');
    const granted = await post(`/admin/members/${member.id}/admin`, { admin: '1' }, cookie);
    expect(flashOf(granted)?.message).toBe('王小明 已成為管理員');
    expect((await userRow(member.id))!.isAdmin).toBe(true);
    expect((await get('/admin', await signInAs(member.id))).status).toBe(200);

    await post(`/admin/members/${member.id}/admin`, { admin: '0' }, cookie);
    expect((await userRow(member.id))!.isAdmin).toBe(false);
  });

  it('does not let admins remove their own rights', async () => {
    const { user, cookie } = await admin();
    const response = await post(`/admin/members/${user.id}/admin`, { admin: '0' }, cookie);
    expect(flashOf(response)).toEqual({ type: 'alert', message: '不能取消自己的管理員身分' });
    expect((await userRow(user.id))!.isAdmin).toBe(true);
  });

  it('cannot be granted by a member to themselves', async () => {
    const member = await person('王小明');
    const response = await post(
      `/admin/members/${member.id}/admin`,
      { admin: '1' },
      await signInAs(member.id),
    );
    expect(response.status).toBe(404);
    expect((await userRow(member.id))!.isAdmin).toBe(false);
  });
});

describe('merging duplicate accounts', () => {
  it('moves sign-in methods, groups and authorship to the kept account and deletes the other', async () => {
    const { cookie } = await admin();
    const kept = await person('王小明', { email: 'ming@example.com' });
    const duplicate = await person(null, { email: null });
    await db()
      .insert(oauthAccounts)
      .values({ userId: duplicate.id, provider: 'line', providerUserId: 'line-1' });
    const [shared, other] = await db()
      .insert(groups)
      .values([
        { name: '恩典小組', introduction: 'a', createrId: duplicate.id },
        { name: '喜樂小組', introduction: 'b' },
      ])
      .returning();
    await db()
      .insert(groupUsers)
      .values([
        { groupId: shared!.id, userId: kept.id, role: 'leader' },
        { groupId: shared!.id, userId: duplicate.id, role: 'member' },
        { groupId: other!.id, userId: duplicate.id, role: 'member' },
      ]);
    const event = await createEvent({ organizerId: duplicate.id });
    await signInAs(duplicate.id);

    const response = await post(
      `/admin/members/${kept.id}/merge`,
      { from: String(duplicate.id) },
      cookie,
    );
    expect(flashOf(response)?.type).toBe('notice');

    expect(await userRow(duplicate.id)).toBeUndefined();
    expect(await db().select().from(oauthAccounts)).toMatchObject([
      { userId: kept.id, provider: 'line' },
    ]);
    const memberships = await db().select().from(groupUsers);
    expect(memberships).toHaveLength(2);
    expect(memberships).toContainEqual(
      expect.objectContaining({ groupId: shared!.id, userId: kept.id, role: 'leader' }),
    );
    expect(memberships).toContainEqual(
      expect.objectContaining({ groupId: other!.id, userId: kept.id }),
    );
    expect((await db().select().from(events).where(eq(events.id, event.id)))[0]!.organizerId).toBe(
      kept.id,
    );
    expect((await db().select().from(groups).where(eq(groups.id, shared!.id)))[0]!.createrId).toBe(
      kept.id,
    );
    // The deleted account can no longer be used
    expect(await db().select().from(sessions).where(eq(sessions.userId, duplicate.id))).toEqual([]);
  });

  it('keeps the profile of the kept account when both have one', async () => {
    const kept = await person('保留的資料', { email: 'a@example.com' });
    const duplicate = await person('被丟棄的資料', { email: 'b@example.com' });
    await mergeMembers(env.DB, kept.id, duplicate.id);
    const rows = await db().select().from(profiles);
    expect(rows).toMatchObject([{ userId: kept.id, name: '保留的資料' }]);
    expect((await userRow(kept.id))!.email).toBe('a@example.com');
  });

  it('takes the profile and email of the other account when the kept one has none', async () => {
    const kept = await person(null, { email: null });
    const duplicate = await person('舊帳號的資料', { email: 'old@example.com', isAdmin: true });
    await mergeMembers(env.DB, kept.id, duplicate.id);
    expect(await db().select().from(profiles)).toMatchObject([
      { userId: kept.id, name: '舊帳號的資料' },
    ]);
    const merged = await userRow(kept.id);
    expect(merged!.email).toBe('old@example.com');
    // Admin rights do not travel with a merge
    expect(merged!.isAdmin).toBe(false);
  });

  it.each([
    ['an account that does not exist', () => '999', '找不到要併進來的帳號'],
    ['something that is not a number', () => 'abc', '找不到要併進來的帳號'],
  ])('refuses %s', async (_label, from, message) => {
    const { cookie } = await admin();
    const kept = await person('王小明');
    const response = await post(`/admin/members/${kept.id}/merge`, { from: from() }, cookie);
    expect(flashOf(response)).toEqual({ type: 'alert', message });
    expect(await db().select().from(users)).toHaveLength(2);
  });

  it('refuses to merge an account into itself or to delete the admin doing the merge', async () => {
    const { user, cookie } = await admin();
    const kept = await person('王小明');
    const self = await post(`/admin/members/${kept.id}/merge`, { from: String(kept.id) }, cookie);
    expect(flashOf(self)?.message).toBe('不能把帳號併進自己');
    const own = await post(`/admin/members/${kept.id}/merge`, { from: String(user.id) }, cookie);
    expect(flashOf(own)?.type).toBe('alert');
    expect(await db().select().from(users)).toHaveLength(2);
  });
});

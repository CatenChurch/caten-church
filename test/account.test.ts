import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { oauthAccounts, profiles, users } from '../src/db/schema';
import { db, flashOf, get, post, signInAs } from './helpers';

async function member() {
  const [user] = await db().insert(users).values({ email: 'me@example.com' }).returning();
  return { user: user!, cookie: await signInAs(user!.id) };
}

const validProfile = {
  name: '王小明',
  sex: '男',
  birth: '1990-03-09',
  idNumber: '',
  phone: '',
  cellphone: '0912345678',
  emergencyContact: '',
  address: '高雄市',
  education: '',
  terms: '1',
};

describe('member area', () => {
  it.each(['/account', '/account/profile', '/account/profile/edit', '/account/logins'])(
    'sends a visitor who is not signed in from %s to the sign-in page',
    async (path) => {
      const response = await get(path);
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(`/login?next=${encodeURIComponent(path)}`);
    },
  );

  it('does not accept a profile from a visitor who is not signed in', async () => {
    const response = await post('/account/profile', validProfile);
    expect(response.status).toBe(302);
    expect(await db().select().from(profiles)).toHaveLength(0);
  });
});

describe('profile', () => {
  it('asks a member without a profile to create one', async () => {
    const { cookie } = await member();
    const response = await get('/account/profile', cookie);
    expect(response.headers.get('location')).toBe('/account/profile/edit');
    expect(flashOf(response)).toEqual({ type: 'alert', message: '尚未建立個人資料' });
    expect(await (await get('/account/profile/edit', cookie)).text()).toContain('建立個人資料');
  });

  it('creates the profile, then shows it', async () => {
    const { user, cookie } = await member();
    const response = await post(
      '/account/profile',
      { ...validProfile, idNumber: 'a123456789' },
      cookie,
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account/profile');
    expect(flashOf(response)?.message).toBe('建立個人資料成功');

    const [saved] = await db().select().from(profiles).where(eq(profiles.userId, user.id));
    expect(saved).toMatchObject({
      name: '王小明',
      sex: '男',
      birth: '1990-03-09',
      idNumber: 'A123456789',
      phone: null,
      cellphone: '0912345678',
    });

    const html = await (await get('/account/profile', cookie)).text();
    expect(html).toContain('0912345678');
    expect(html).toContain('A123456789');
    // The menu now greets the member by name
    expect(html).toMatch(/bi-person me-1"><\/i>王小明/);
  });

  it('updates the existing profile instead of adding a second one', async () => {
    const { user, cookie } = await member();
    await post('/account/profile', validProfile, cookie);
    const response = await post(
      '/account/profile',
      { ...validProfile, name: '王大明', address: '' },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('更新個人資料成功');
    const rows = await db().select().from(profiles).where(eq(profiles.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: '王大明', address: null });
  });

  it.each([
    [{ name: '' }, '請填寫姓名'],
    [{ sex: '其他' }, '請選擇性別'],
    [{ birth: '' }, '請填寫生日'],
    [{ birth: '1990-02-31' }, '生日格式應為'],
    [{ birth: '2999-01-01' }, '生日不能是未來'],
    [{ idNumber: 'A323456789' }, '身分證字號為 10 碼'],
    [{ idNumber: '1234567890' }, '身分證字號為 10 碼'],
    [{ terms: '' }, '請閱讀並接受隱私條款'],
  ])('rejects %o and keeps what was typed', async (change, message) => {
    const { cookie } = await member();
    const response = await post('/account/profile', { ...validProfile, ...change }, cookie);
    expect(response.status).toBe(422);
    const html = await response.text();
    expect(html).toContain(message);
    expect(html).toContain('value="高雄市"');
    expect(await db().select().from(profiles)).toHaveLength(0);
  });

  it('escapes what the member typed', async () => {
    const { cookie } = await member();
    await post(
      '/account/profile',
      { ...validProfile, address: '"><script>alert(1)</script>' },
      cookie,
    );
    const html = await (await get('/account/profile', cookie)).text();
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('never shows or changes the profile of another member', async () => {
    const a = await member();
    await post('/account/profile', { ...validProfile, name: '甲的資料' }, a.cookie);
    const [other] = await db().insert(users).values({ email: 'b@example.com' }).returning();
    const bCookie = await signInAs(other!.id);

    await post('/account/profile', { ...validProfile, name: '乙的資料' }, bCookie);
    const html = await (await get('/account/profile', bCookie)).text();
    expect(html).toContain('乙的資料');
    expect(html).not.toContain('甲的資料');
    const [aProfile] = await db().select().from(profiles).where(eq(profiles.userId, a.user.id));
    expect(aProfile!.name).toBe('甲的資料');
  });
});

describe('ways to sign in', () => {
  it('lists linked providers and offers the configured ones that are not linked yet', async () => {
    const { user, cookie } = await member();
    const before = await (await get('/account/logins', cookie)).text();
    expect(before).toContain('me@example.com');
    expect(before).toContain('href="/auth/google?next=/account/logins"');

    await db()
      .insert(oauthAccounts)
      .values({ userId: user.id, provider: 'google', providerUserId: 'g-1' });
    const after = await (await get('/account/logins', cookie)).text();
    expect(after).toContain('已綁定於');
    expect(after).not.toContain('href="/auth/google');
  });
});

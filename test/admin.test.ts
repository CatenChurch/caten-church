import { env } from 'cloudflare:test';
import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { settingChanges, settings, users, weeklies } from '../src/db/schema';
import { MAX_PDF_BYTES } from '../src/routes/admin';
import { BASE, createWeekly, db, flashOf, get, post, signInAs } from './helpers';

async function signedIn(isAdmin: boolean) {
  const [user] = await db()
    .insert(users)
    .values({ email: isAdmin ? 'admin@example.com' : 'member@example.com', isAdmin })
    .returning();
  return { user: user!, cookie: await signInAs(user!.id) };
}

const PDF = '%PDF-1.4 weekly';

/** Submits the weekly form (multipart, like a browser file upload). */
function postWeekly(
  path: string,
  cookie: string,
  fields: Record<string, string>,
  file?: { content: string | Uint8Array; name?: string; type?: string },
) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  if (file) {
    body.set(
      'pdf',
      new File([file.content], file.name ?? '週報.pdf', { type: file.type ?? 'application/pdf' }),
    );
  }
  return exports.default.fetch(
    new Request(`${BASE}${path}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Origin: BASE, Cookie: cookie },
      body,
    }),
  );
}

const weeklyFields = { title: '主日週報', issue: '121', publishedAt: '2026-11-22T09:00' };

describe('admin access', () => {
  const paths = ['/admin', '/admin/weeklies', '/admin/weeklies/new', '/admin/settings'];

  it.each(paths)('sends a visitor from %s to the sign-in page', async (path) => {
    const response = await get(path);
    expect(response.headers.get('location')).toBe(`/login?next=${encodeURIComponent(path)}`);
  });

  it.each(paths)('hides %s from members who are not admins', async (path) => {
    const { cookie } = await signedIn(false);
    expect((await get(path, cookie)).status).toBe(404);
  });

  it('does not let a member change anything', async () => {
    const { cookie } = await signedIn(false);
    const weekly = await createWeekly();
    expect((await post('/admin/settings', { phone: '0000' }, cookie)).status).toBe(404);
    expect((await post(`/admin/weeklies/${weekly.id}/delete`, {}, cookie)).status).toBe(404);
    expect(
      (await postWeekly('/admin/weeklies', cookie, weeklyFields, { content: PDF })).status,
    ).toBe(404);
    expect(await db().select().from(settings)).toHaveLength(0);
    expect(await db().select().from(weeklies)).toHaveLength(1);
  });

  it('shows the admin link in the menu to admins only', async () => {
    const adminUser = await signedIn(true);
    expect(await (await get('/', adminUser.cookie)).text()).toContain('href="/admin"');
    await db().delete(users);
    const member = await signedIn(false);
    expect(await (await get('/', member.cookie)).text()).not.toContain('href="/admin"');
  });
});

describe('managing weeklies', () => {
  it('creates a weekly, stores the PDF in R2 and serves it at the public address', async () => {
    const { cookie } = await signedIn(true);
    const response = await postWeekly('/admin/weeklies', cookie, weeklyFields, { content: PDF });
    expect(response.status).toBe(302);
    expect(flashOf(response)?.message).toBe('新增週報成功');

    const [weekly] = await db().select().from(weeklies);
    expect(weekly).toMatchObject({
      title: '主日週報',
      issue: 121,
      // 09:00 in Taipei
      publishedAt: '2026-11-22T01:00:00.000Z',
      pdfKey: `weeklies/${weekly!.id}.pdf`,
      pdfFilename: '週報.pdf',
      pdfSize: PDF.length,
    });
    const served = await get(`/weeklies/${weekly!.id}.pdf`);
    expect(served.headers.get('content-type')).toBe('application/pdf');
    expect(await served.text()).toBe(PDF);
  });

  it.each([
    ['a missing title', { title: '' }, { content: PDF }, '請填寫標題'],
    ['a non-numeric issue', { issue: '第三期' }, { content: PDF }, '刊號需為數字'],
    ['a missing publish time', { publishedAt: '' }, { content: PDF }, '請填寫發布時間'],
    ['no PDF', {}, undefined, '需附加檔案'],
    [
      'a file that is not a PDF, whatever it claims to be',
      {},
      { content: '<html>not a pdf</html>', name: 'fake.pdf', type: 'application/pdf' },
      '檔案類型須為 PDF',
    ],
    ['a PDF over the size limit', {}, { content: new Uint8Array(MAX_PDF_BYTES + 1) }, '檔案須小於'],
  ])('rejects %s', async (_label, change, file, message) => {
    const { cookie } = await signedIn(true);
    const response = await postWeekly(
      '/admin/weeklies',
      cookie,
      { ...weeklyFields, ...change },
      file,
    );
    expect(response.status).toBe(422);
    expect(await response.text()).toContain(message);
    expect(await db().select().from(weeklies)).toHaveLength(0);
    expect((await env.FILES.list()).objects).toHaveLength(0);
  });

  it('updates the details and keeps the PDF when no new file is chosen', async () => {
    const { cookie } = await signedIn(true);
    await postWeekly('/admin/weeklies', cookie, weeklyFields, { content: PDF });
    const [created] = await db().select().from(weeklies);

    const form = await (await get(`/admin/weeklies/${created!.id}/edit`, cookie)).text();
    expect(form).toContain('value="2026-11-22T09:00"');

    const response = await postWeekly(`/admin/weeklies/${created!.id}`, cookie, {
      ...weeklyFields,
      title: '改過的標題',
    });
    expect(flashOf(response)?.message).toBe('更新週報成功');
    const [updated] = await db().select().from(weeklies);
    expect(updated).toMatchObject({ title: '改過的標題', pdfKey: created!.pdfKey });
    expect(await (await get(`/weeklies/${created!.id}.pdf`)).text()).toBe(PDF);
  });

  it('replaces the PDF when a new one is uploaded', async () => {
    const { cookie } = await signedIn(true);
    await postWeekly('/admin/weeklies', cookie, weeklyFields, { content: PDF });
    const [created] = await db().select().from(weeklies);
    await postWeekly(`/admin/weeklies/${created!.id}`, cookie, weeklyFields, {
      content: '%PDF-1.7 corrected',
      name: '更正版.pdf',
    });
    const [updated] = await db().select().from(weeklies);
    expect(updated!.pdfFilename).toBe('更正版.pdf');
    expect(await (await get(`/weeklies/${created!.id}.pdf`)).text()).toBe('%PDF-1.7 corrected');
    expect((await env.FILES.list()).objects).toHaveLength(1);
  });

  it('requires a PDF when editing a weekly that has none', async () => {
    const { cookie } = await signedIn(true);
    const weekly = await createWeekly();
    const response = await postWeekly(`/admin/weeklies/${weekly.id}`, cookie, weeklyFields);
    expect(response.status).toBe(422);
    expect(await response.text()).toContain('需附加檔案');
  });

  it('deletes the weekly together with its PDF', async () => {
    const { cookie } = await signedIn(true);
    await postWeekly('/admin/weeklies', cookie, weeklyFields, { content: PDF });
    const [created] = await db().select().from(weeklies);
    const response = await post(`/admin/weeklies/${created!.id}/delete`, {}, cookie);
    expect(flashOf(response)?.message).toBe('刪除週報成功');
    expect(await db().select().from(weeklies)).toHaveLength(0);
    expect((await env.FILES.list()).objects).toHaveLength(0);
    expect((await get(`/weeklies/${created!.id}.pdf`)).status).toBe(404);
  });

  it('returns 404 for a weekly that does not exist', async () => {
    const { cookie } = await signedIn(true);
    expect((await get('/admin/weeklies/999/edit', cookie)).status).toBe(404);
    expect((await post('/admin/weeklies/999/delete', {}, cookie)).status).toBe(404);
  });
});

describe('site settings', () => {
  it('saves a change, shows it on the public site and records who made it', async () => {
    const { user, cookie } = await signedIn(true);
    const response = await post(
      '/admin/settings',
      { phone: '07-1234567', tithingAccount: '99998888' },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('已更新 2 項設定');

    const tithing = await (await get('/tithing')).text();
    expect(tithing).toContain('帳戶：99998888');
    expect(tithing).toContain('07-1234567');

    const log = await db().select().from(settingChanges);
    expect(log).toHaveLength(2);
    expect(log).toContainEqual(
      expect.objectContaining({
        key: 'tithingAccount',
        oldValue: '00141211139150',
        newValue: '99998888',
        userId: user.id,
      }),
    );
    const page = await (await get('/admin/settings', cookie)).text();
    expect(page).toContain('admin@example.com');
    expect(page).toContain('value="99998888"');
  });

  it('does nothing when the submitted values are the current ones', async () => {
    const { cookie } = await signedIn(true);
    const response = await post('/admin/settings', { phone: '076178379' }, cookie);
    expect(flashOf(response)?.message).toBe('沒有變更');
    expect(await db().select().from(settings)).toHaveLength(0);
    expect(await db().select().from(settingChanges)).toHaveLength(0);
  });

  it('goes back to the default when a field is cleared', async () => {
    const { cookie } = await signedIn(true);
    await post('/admin/settings', { phone: '07-1234567' }, cookie);
    await post('/admin/settings', { phone: '  ' }, cookie);
    expect(await db().select().from(settings)).toHaveLength(0);
    expect(await (await get('/tithing')).text()).toContain('076178379');
    expect(await db().select().from(settingChanges)).toHaveLength(2);
  });

  it.each(['javascript:alert(1)', 'http://insecure.example/logo.png', '//evil.example/x.png'])(
    'refuses %s as a link or image address and saves nothing',
    async (value) => {
      const { cookie } = await signedIn(true);
      const response = await post('/admin/settings', { logoUrl: value, phone: '07-1' }, cookie);
      expect(flashOf(response)?.type).toBe('alert');
      expect(await db().select().from(settings)).toHaveLength(0);
    },
  );

  it('ignores fields that are not settings', async () => {
    const { cookie } = await signedIn(true);
    await post('/admin/settings', { isAdmin: '1', unknown: 'x' }, cookie);
    expect(await db().select().from(settings)).toHaveLength(0);
  });
});

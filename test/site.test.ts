import { env } from 'cloudflare:test';
import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { settingChanges, settings, users } from '../src/db/schema';
import { MAX_IMAGE_BYTES } from '../src/routes/admin-images';
import { BASE, createWeekly, db, flashOf, get, signInAs } from './helpers';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const WEBP = new Uint8Array(
  [...'RIFF']
    .map((c) => c.charCodeAt(0))
    .concat(
      [0, 0, 0, 0],
      [...'WEBP'].map((c) => c.charCodeAt(0)),
    ),
);

async function signedIn(isAdmin: boolean) {
  const [user] = await db()
    .insert(users)
    .values({ email: isAdmin ? 'admin@example.com' : 'member@example.com', isAdmin })
    .returning();
  return { user: user!, cookie: await signInAs(user!.id) };
}

function upload(
  cookie: string | undefined,
  key: string,
  content: Uint8Array | string | null,
  path = '/admin/settings/image',
) {
  const body = new FormData();
  body.set('key', key);
  if (content !== null)
    body.set('file', new File([content], 'whatever.png', { type: 'image/png' }));
  return exports.default.fetch(
    new Request(`${BASE}${path}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Origin: BASE, ...(cookie ? { Cookie: cookie } : {}) },
      body,
    }),
  );
}

const stored = async () => (await env.FILES.list()).objects.map((object) => object.key);
const setting = async (key: string) =>
  (await db().select().from(settings)).find((row) => row.key === key)?.value;

describe('uploading site images', () => {
  it('replaces the logo: the page uses the new file and the file is served', async () => {
    const { user, cookie } = await signedIn(true);
    const response = await upload(cookie, 'logoUrl', PNG);
    expect(flashOf(response)).toEqual({ type: 'notice', message: '已更換Logo' });

    const value = (await setting('logoUrl'))!;
    expect(value).toMatch(/^\/site-files\/logoUrl-\d+\.png$/);
    expect(await (await get('/')).text()).toContain(`<img src="${value}"`);

    const file = await get(value);
    expect(file.status).toBe(200);
    expect(file.headers.get('content-type')).toBe('image/png');
    expect(file.headers.get('cache-control')).toContain('immutable');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(PNG);

    expect(await db().select().from(settingChanges)).toMatchObject([
      { key: 'logoUrl', oldValue: '/brand.png', newValue: value, userId: user.id },
    ]);
  });

  it.each([
    ['JPEG', JPEG, 'jpg', 'image/jpeg'],
    ['WebP', WEBP, 'webp', 'image/webp'],
  ])(
    'stores %s by its content, not by the name it was uploaded with',
    async (_l, bytes, ext, type) => {
      const { cookie } = await signedIn(true);
      await upload(cookie, 'heroImageUrl', bytes);
      const value = (await setting('heroImageUrl'))!;
      expect(value.endsWith(`.${ext}`)).toBe(true);
      expect((await get(value)).headers.get('content-type')).toBe(type);
    },
  );

  it('removes the file it replaces, and both on reset to the default', async () => {
    const { cookie } = await signedIn(true);
    await upload(cookie, 'logoUrl', PNG);
    const first = await stored();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await upload(cookie, 'logoUrl', JPEG);
    const second = await stored();
    expect(second).toHaveLength(1);
    expect(second).not.toEqual(first);

    const reset = await upload(cookie, 'logoUrl', null, '/admin/settings/image/reset');
    expect(flashOf(reset)?.message).toBe('Logo已恢復預設');
    expect(await stored()).toEqual([]);
    expect(await setting('logoUrl')).toBeUndefined();
    expect(await (await get('/')).text()).toContain('<img src="/brand.png"');
  });

  it.each([
    [
      'a file that is not an image',
      '<svg onload="alert(1)"></svg>',
      '只接受 PNG、JPEG 或 WebP 圖片',
    ],
    ['an image over the size limit', new Uint8Array(MAX_IMAGE_BYTES + 1), '圖片須小於 2 MB'],
    ['no file', null, '請選擇圖片檔案'],
  ])('refuses %s', async (_label, content, message) => {
    const { cookie } = await signedIn(true);
    const response = await upload(cookie, 'logoUrl', content);
    expect(flashOf(response)).toEqual({ type: 'alert', message });
    expect(await stored()).toEqual([]);
    expect(await setting('logoUrl')).toBeUndefined();
  });

  it('only replaces the three site images, never another setting', async () => {
    const { cookie } = await signedIn(true);
    const response = await upload(cookie, 'tithingAccount', PNG);
    expect(flashOf(response)?.type).toBe('alert');
    expect(await stored()).toEqual([]);
    expect(await db().select().from(settings)).toHaveLength(0);
  });

  it('is for admins only', async () => {
    const member = await signedIn(false);
    expect((await upload(member.cookie, 'logoUrl', PNG)).status).toBe(404);
    expect((await upload(undefined, 'logoUrl', PNG)).status).toBe(302);
    expect(await stored()).toEqual([]);
  });

  it('serves only uploaded site images from /site-files', async () => {
    await env.FILES.put('weeklies/1.pdf', '%PDF-1.4');
    await env.FILES.put('site/secret.txt', 'x');
    for (const path of [
      '/site-files/secret.txt',
      '/site-files/..%2Fweeklies%2F1.pdf',
      '/site-files/logoUrl-1.png',
    ]) {
      expect((await get(path)).status).toBe(404);
    }
  });
});

describe('sitemap and robots', () => {
  it('lists the public pages and published weeklies', async () => {
    const published = await createWeekly();
    const future = await createWeekly({ publishedAt: '2999-01-01T00:00:00.000Z' });

    const response = await get('/sitemap.xml');
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    const xml = await response.text();
    const base = 'https://caten-church.org';
    for (const path of ['/', '/about', '/weeklies', `/weeklies/${published.id}`]) {
      expect(xml).toContain(`<loc>${base}${path}</loc>`);
    }
    expect(xml).not.toContain(`/weeklies/${future.id}<`);
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/events');
    expect(xml).not.toContain('/groups');
    expect(xml).not.toContain('/account');
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps the Google Search Console verification address of the old site', async () => {
    const response = await get('/google9107c43bb8511ce3');
    expect(await response.text()).toBe('google-site-verification: google9107c43bb8511ce3.html');
  });
});

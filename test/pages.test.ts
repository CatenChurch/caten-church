import { describe, expect, it } from 'vitest';
import { settings } from '../src/db/schema';
import { db, get } from './helpers';

describe('static pages', () => {
  it.each([
    ['/', '茄典教會'],
    ['/about', '關於我們'],
    ['/contact', '聯絡我們'],
    ['/tithing', '奉獻方式'],
    ['/term', '個人資料提供告知暨同意書'],
  ])('renders %s', async (path, text) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain(text);
  });

  it('redirects /index to the home page', async () => {
    const response = await get('/index');
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/');
  });

  it('answers the health check', async () => {
    const response = await get('/up');
    expect(await response.text()).toBe('ok');
  });

  it('returns 404 for unknown paths', async () => {
    expect((await get('/nope')).status).toBe(404);
  });
});

describe('site settings', () => {
  it('shows the built-in defaults when the settings table is empty', async () => {
    const html = await (await get('/tithing')).text();
    expect(html).toContain('代碼 619');
    expect(html).toContain('00141211139150');
  });

  it('lets a stored value override the default on every page that uses it', async () => {
    await db()
      .insert(settings)
      .values([
        { key: 'phone', value: '07-1234567' },
        { key: 'siteName', value: '測試教會' },
      ]);

    const tithing = await (await get('/tithing')).text();
    expect(tithing).toContain('07-1234567');
    expect(tithing).not.toContain('076178379');

    const home = await (await get('/')).text();
    expect(home).toContain('<title>測試教會</title>');
    expect(home).toContain('07-1234567');
  });

  it('ignores stored keys the site does not know', async () => {
    await db().insert(settings).values({ key: 'unknown', value: 'x' });
    expect((await get('/')).status).toBe(200);
  });

  it('adds the analytics tag only when a measurement id is set', async () => {
    expect(await (await get('/')).text()).not.toContain('googletagmanager');
    await db().insert(settings).values({ key: 'gaMeasurementId', value: 'G-TEST123' });
    expect(await (await get('/')).text()).toContain('gtag/js?id=G-TEST123');
  });

  it('escapes stored values', async () => {
    await db().insert(settings).values({ key: 'address', value: '<script>alert(1)</script>' });
    const html = await (await get('/contact')).text();
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('search engines', () => {
  it('keeps the preview address out of search results but not the real domain', async () => {
    const { exports } = await import('cloudflare:workers');
    const preview = await get('/');
    expect(preview.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    const official = await exports.default.fetch(new Request('https://caten-church.org/'));
    expect(official.headers.get('x-robots-tag')).toBeNull();
  });
});

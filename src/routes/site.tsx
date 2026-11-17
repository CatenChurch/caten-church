import { desc, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { AppEnv } from '../app';
import { weeklies } from '../db/schema';

/** Machine-facing routes: uploaded site images, the sitemap and search-engine verification. */
export const site = new Hono<AppEnv>();

/** Images an admin uploaded for the site (logo, favicon, page-top background). */
export const SITE_FILE_NAME = /^[a-zA-Z]+-\d+\.(png|jpg|webp)$/;

site.get('/site-files/:name', async (c) => {
  const name = c.req.param('name');
  const object = SITE_FILE_NAME.test(name) ? await c.env.FILES.get(`site/${name}`) : null;
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Length': String(object.size),
      // A new upload gets a new name, so a stored file never changes
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

const xml = (text: string) => text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

site.get('/sitemap.xml', async (c) => {
  const base = (c.env.SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '');
  const db = drizzle(c.env.DB);
  const weeklyRows = await db
    .select({ id: weeklies.id, updatedAt: weeklies.updatedAt })
    .from(weeklies)
    .where(lte(weeklies.publishedAt, new Date().toISOString()))
    .orderBy(desc(weeklies.id));

  const urls: { path: string; lastmod?: string }[] = [
    ...['/', '/about', '/contact', '/tithing', '/term', '/weeklies'].map((path) => ({ path })),
    ...weeklyRows.map((row) => ({ path: `/weeklies/${row.id}`, lastmod: row.updatedAt })),
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        ({ path, lastmod }) =>
          `  <url><loc>${xml(base + path)}</loc>${lastmod ? `<lastmod>${xml(lastmod)}</lastmod>` : ''}</url>\n`,
      )
      .join('') +
    '</urlset>\n';
  return c.body(body, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

// Google Search Console ownership check, at the same address as on the Rails site
site.get('/google9107c43bb8511ce3', (c) =>
  c.text('google-site-verification: google9107c43bb8511ce3.html'),
);

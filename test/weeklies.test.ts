import { env } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { weeklies } from '../src/db/schema';
import { createWeekly, db, get } from './helpers';

async function viewedCount(id: number) {
  const [row] = await db().select().from(weeklies).where(eq(weeklies.id, id));
  return row!.viewedCount;
}

async function createWeeklyWithPdf(body = '%PDF-1.4 test') {
  const weekly = await createWeekly();
  const key = `weeklies/${weekly.id}.pdf`;
  await env.FILES.put(key, body);
  await db()
    .update(weeklies)
    .set({ pdfKey: key, pdfFilename: '第一期 週報.pdf', pdfSize: body.length })
    .where(eq(weeklies.id, weekly.id));
  return weekly;
}

describe('weekly list', () => {
  it('lists weeklies newest first with Taipei publish times', async () => {
    await createWeekly({ title: '第一期', issue: 1 });
    await createWeekly({ title: '第二期', issue: 2, publishedAt: '2026-01-10T16:30:00.000Z' });
    const html = await (await get('/weeklies')).text();
    expect(html.indexOf('第二期')).toBeLessThan(html.indexOf('第一期'));
    expect(html).toContain('2026-01-11 00:30');
  });

  it('paginates 25 per page', async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({
      title: `週報-${String(i + 1).padStart(2, '0')}`,
      issue: i + 1,
      publishedAt: '2026-01-04T01:00:00.000Z',
    }));
    // D1 allows 100 bound parameters per statement
    await db().insert(weeklies).values(rows.slice(0, 13));
    await db().insert(weeklies).values(rows.slice(13));
    const first = await (await get('/weeklies')).text();
    expect(first).toContain('週報-26');
    expect(first).not.toContain('週報-01');
    expect(first).toContain('/weeklies?page=2');

    const second = await (await get('/weeklies?page=2')).text();
    expect(second).toContain('週報-01');
    expect(second).not.toContain('週報-26');
  });

  it('treats a bad page number as page 1', async () => {
    await createWeekly({ title: '唯一一期' });
    expect(await (await get('/weeklies?page=abc')).text()).toContain('唯一一期');
  });
});

describe('weekly page', () => {
  it('shows the weekly and counts the view', async () => {
    const weekly = await createWeekly({ title: '感恩節特刊' });
    const response = await get(`/weeklies/${weekly.id}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('感恩節特刊');
    expect(await viewedCount(weekly.id)).toBe(1);
  });

  it.each(['/weeklies/999', '/weeklies/abc', '/weeklies/0', '/weeklies/1e3', '/weeklies/999.pdf'])(
    'returns 404 for %s',
    async (path) => {
      expect((await get(path)).status).toBe(404);
    },
  );
});

describe('weekly PDF', () => {
  it('streams the PDF from R2 at /weeklies/<id>.pdf and counts the view', async () => {
    const weekly = await createWeeklyWithPdf('%PDF-1.4 hello');
    const response = await get(`/weeklies/${weekly.id}.pdf`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe(
      `inline; filename*=UTF-8''${encodeURIComponent('第一期 週報.pdf')}`,
    );
    expect(await response.text()).toBe('%PDF-1.4 hello');
    expect(await viewedCount(weekly.id)).toBe(1);
  });

  it('sends the reader to the weekly page when there is no PDF', async () => {
    const weekly = await createWeekly();
    const response = await get(`/weeklies/${weekly.id}.pdf`);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`/weeklies/${weekly.id}`);
    expect(await viewedCount(weekly.id)).toBe(0);
  });

  it('does the same when the file is missing from R2', async () => {
    const weekly = await createWeekly({ pdfKey: 'weeklies/missing.pdf' });
    const response = await get(`/weeklies/${weekly.id}.pdf`);
    expect(response.status).toBe(302);
  });
});

describe('latest weekly', () => {
  it('redirects to the newest published weekly, skipping future ones', async () => {
    const published = await createWeekly({ title: '已發布' });
    await createWeekly({ title: '未來', publishedAt: '2999-01-01T00:00:00.000Z' });

    const page = await get('/weeklies/latest');
    expect(page.status).toBe(302);
    expect(page.headers.get('location')).toBe(`/weeklies/${published.id}`);

    const pdf = await get('/weeklies/latest.pdf');
    expect(pdf.headers.get('location')).toBe(`/weeklies/${published.id}.pdf`);
  });

  it('returns 404 when nothing is published', async () => {
    expect((await get('/weeklies/latest')).status).toBe(404);
  });
});

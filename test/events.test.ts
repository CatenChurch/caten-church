import { describe, expect, it } from 'vitest';
import { events, users } from '../src/db/schema';
import { createEvent, db, flashOf, get, hoursFromNow, post, signInAs } from './helpers';

const FORM_URL = 'https://forms.gle/abc123';

describe('event announcements', () => {
  it('separates events that have not ended from past ones', async () => {
    await createEvent({ name: '下週的活動' });
    await createEvent({ name: '正在進行的活動', start: hoursFromNow(-1), over: hoursFromNow(2) });
    await createEvent({ name: '已結束的活動', start: hoursFromNow(-72), over: hoursFromNow(-48) });

    const html = await (await get('/events')).text();
    const upcoming = html.slice(html.indexOf('即將到來的活動'), html.indexOf('過去的活動'));
    const past = html.slice(html.indexOf('過去的活動'));
    expect(upcoming).toContain('下週的活動');
    expect(upcoming).toContain('正在進行的活動');
    expect(upcoming).not.toContain('已結束的活動');
    expect(past).toContain('已結束的活動');
    // Soonest first
    expect(upcoming.indexOf('正在進行的活動')).toBeLessThan(upcoming.indexOf('下週的活動'));
  });

  it('paginates past events 6 per page, most recent first', async () => {
    await db()
      .insert(events)
      .values(
        Array.from({ length: 7 }, (_, i) => ({
          name: `舊活動-${i + 1}`,
          start: hoursFromNow(-1000 + i * 24),
          over: hoursFromNow(-990 + i * 24),
        })),
      );
    const first = await (await get('/events')).text();
    expect(first).toContain('舊活動-7');
    expect(first).not.toContain('舊活動-1<');
    expect(await (await get('/events?page=2')).text()).toContain('舊活動-1<');
  });

  it('links to the sign-up form in a new tab when the event has one', async () => {
    const withForm = await createEvent({ name: '有表單', signupUrl: FORM_URL });
    const without = await createEvent({ name: '沒有表單' });

    const html = await (await get(`/events/${withForm.id}`)).text();
    expect(html).toContain(`href="${FORM_URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(await (await get(`/events/${without.id}`)).text()).not.toContain('前往報名表單');

    const list = await (await get('/events')).text();
    expect(list.match(/開放報名/g)).toHaveLength(1);
  });

  it('stops offering the form once the event has ended', async () => {
    const ended = await createEvent({
      signupUrl: FORM_URL,
      start: hoursFromNow(-72),
      over: hoursFromNow(-48),
    });
    const html = await (await get(`/events/${ended.id}`)).text();
    expect(html).not.toContain(FORM_URL);
    expect(html).toContain('活動已結束');
  });

  it('no longer has registration routes on the site itself', async () => {
    const event = await createEvent();
    expect((await post(`/events/${event.id}/join`)).status).toBe(404);
    expect((await post(`/events/${event.id}/quit`)).status).toBe(404);
    expect((await get(`/events/${event.id}/participants`)).status).toBe(404);
  });

  it('returns 404 for a missing event', async () => {
    expect((await get('/events/42')).status).toBe(404);
  });
});

describe('managing events', () => {
  async function adminCookie() {
    const [user] = await db()
      .insert(users)
      .values({ email: 'admin@example.com', isAdmin: true })
      .returning();
    return { user: user!, cookie: await signInAs(user!.id) };
  }

  const fields = {
    name: '聖誕晚會',
    description: '報佳音與愛宴',
    content: '歡迎邀請家人朋友',
    start: '2026-12-24T18:00',
    over: '2026-12-24T21:00',
    signupUrl: FORM_URL,
  };

  it('is closed to visitors and to members who are not admins', async () => {
    expect((await post('/admin/events', fields)).status).toBe(302);
    const [member] = await db().insert(users).values({ email: 'm@example.com' }).returning();
    expect((await post('/admin/events', fields, await signInAs(member!.id))).status).toBe(404);
    expect(await db().select().from(events)).toHaveLength(0);
  });

  it('creates an event from Taipei times and shows it publicly', async () => {
    const { user, cookie } = await adminCookie();
    const response = await post('/admin/events', fields, cookie);
    expect(flashOf(response)?.message).toBe('新增活動成功');

    const [event] = await db().select().from(events);
    expect(event).toMatchObject({
      name: '聖誕晚會',
      start: '2026-12-24T10:00:00.000Z',
      over: '2026-12-24T13:00:00.000Z',
      signupUrl: FORM_URL,
      organizerId: user.id,
    });
    const page = await (await get(`/events/${event!.id}`)).text();
    expect(page).toContain('2026-12-24 18:00');
    expect(page).toContain(`href="${FORM_URL}"`);
    expect(await (await get('/admin/events', cookie)).text()).toContain('聖誕晚會');
  });

  it.each([
    [{ name: '' }, '請填寫活動名稱'],
    [{ start: '' }, '請填寫活動開始時間'],
    [{ over: 'tomorrow' }, '請填寫活動結束時間'],
    [{ over: '2026-12-24T17:00' }, '活動結束的時間要比活動開始的時間晚'],
    [{ signupUrl: 'javascript:alert(1)' }, '報名表單連結必須以 https:// 開頭'],
    [{ signupUrl: 'http://forms.example/x' }, '報名表單連結必須以 https:// 開頭'],
  ])('rejects %o and keeps what was typed', async (change, message) => {
    const { cookie } = await adminCookie();
    const response = await post('/admin/events', { ...fields, ...change }, cookie);
    expect(response.status).toBe(422);
    const html = await response.text();
    expect(html).toContain(message);
    expect(html).toContain('歡迎邀請家人朋友');
    expect(await db().select().from(events)).toHaveLength(0);
  });

  it('edits an event, including removing the form link', async () => {
    const { cookie } = await adminCookie();
    const event = await createEvent({ signupUrl: FORM_URL });
    const form = await (await get(`/admin/events/${event.id}/edit`, cookie)).text();
    expect(form).toContain(`value="${FORM_URL}"`);

    const response = await post(
      `/admin/events/${event.id}`,
      { ...fields, name: '改名的活動', signupUrl: '' },
      cookie,
    );
    expect(flashOf(response)?.message).toBe('更新活動成功');
    const [updated] = await db().select().from(events);
    expect(updated).toMatchObject({ id: event.id, name: '改名的活動', signupUrl: null });
  });

  it('deletes an event', async () => {
    const { cookie } = await adminCookie();
    const event = await createEvent();
    await post(`/admin/events/${event.id}/delete`, {}, cookie);
    expect(await db().select().from(events)).toHaveLength(0);
    expect((await get(`/events/${event.id}`)).status).toBe(404);
    expect((await post('/admin/events/999/delete', {}, cookie)).status).toBe(404);
  });
});

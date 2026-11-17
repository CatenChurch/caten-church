import { env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventUsers, profiles, subscriptions, users } from '../src/db/schema';
import { runDailyJobs, sendBirthdayList, sendOpeningNotices } from '../src/jobs';
import { sendGridSender, type Mail } from '../src/mail';
import { createEvent, db } from './helpers';

const SITE = 'https://caten-church.org';
const NOW = new Date('2026-11-17T03:00:00.000Z');
const hoursAfterNow = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000).toISOString();

function outbox() {
  const sent: Mail[] = [];
  return {
    sent,
    send: async (mail: Mail) => {
      sent.push(mail);
      return true;
    },
  };
}

async function person(
  name: string,
  options: { email?: string | null; birth?: string; isAdmin?: boolean } = {},
) {
  const email = options.email === undefined ? `${name}@example.com` : options.email;
  const [user] = await db()
    .insert(users)
    .values({ email, isAdmin: options.isAdmin ?? false })
    .returning();
  await db()
    .insert(profiles)
    .values({ userId: user!.id, name, birth: options.birth ?? '1990-03-09' });
  return user!;
}

describe('event reminders', () => {
  it('reminds participants of events starting 24 to 48 hours from now', async () => {
    const member = await person('王小明');
    const tomorrow = await createEvent({ name: '明天的活動', start: hoursAfterNow(30) });
    const today = await createEvent({ name: '今天的活動', start: hoursAfterNow(5) });
    const later = await createEvent({ name: '三天後的活動', start: hoursAfterNow(72) });
    await db()
      .insert(eventUsers)
      .values([tomorrow, today, later].map((event) => ({ eventId: event.id, userId: member.id })));

    const { sent, send } = outbox();
    expect(await sendOpeningNotices(env.DB, send, SITE, NOW)).toEqual({ due: 1, sent: 1 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: '王小明@example.com',
      subject: '茄典教會活動提醒 : 明天的活動',
    });
    expect(sent[0]!.text).toContain('王小明 弟兄姊妹，平安：');
    expect(sent[0]!.text).toContain(`${SITE}/events/${tomorrow.id}`);
    // 30 hours after 11:00 Taipei on the 17th
    expect(sent[0]!.text).toContain('2026-11-18 17:00');
  });

  it('uses the window edges so a daily run announces each event exactly once', async () => {
    const member = await person('甲');
    const atStart = await createEvent({ name: '剛好24小時', start: hoursAfterNow(24) });
    const atEnd = await createEvent({ name: '剛好48小時', start: hoursAfterNow(48) });
    await db()
      .insert(eventUsers)
      .values([
        { eventId: atStart.id, userId: member.id },
        { eventId: atEnd.id, userId: member.id },
      ]);

    const first = outbox();
    await sendOpeningNotices(env.DB, first.send, SITE, NOW);
    expect(first.sent.map((m) => m.subject)).toEqual(['茄典教會活動提醒 : 剛好24小時']);

    const nextDay = outbox();
    await sendOpeningNotices(env.DB, nextDay.send, SITE, new Date(NOW.getTime() + 86_400_000));
    expect(nextDay.sent.map((m) => m.subject)).toEqual(['茄典教會活動提醒 : 剛好48小時']);
  });

  it('skips members who turned the notification off or have no email', async () => {
    const on = await person('有開通知');
    const off = await person('關掉通知');
    const noEmail = await person('沒有信箱', { email: null });
    const noRow = await person('沒有設定列');
    await db()
      .insert(subscriptions)
      .values([
        { userId: on.id, joinedEvents: true },
        { userId: off.id, joinedEvents: false },
      ]);
    const event = await createEvent({ start: hoursAfterNow(30) });
    await db()
      .insert(eventUsers)
      .values([on, off, noEmail, noRow].map((user) => ({ eventId: event.id, userId: user.id })));

    const { sent, send } = outbox();
    await sendOpeningNotices(env.DB, send, SITE, NOW);
    expect(sent.map((m) => m.to).sort()).toEqual([
      '有開通知@example.com',
      '沒有設定列@example.com',
    ]);
  });

  it('escapes the event name in the HTML body', async () => {
    const member = await person('甲');
    const event = await createEvent({ name: '<b>烤肉</b>', start: hoursAfterNow(30) });
    await db().insert(eventUsers).values({ eventId: event.id, userId: member.id });
    const { sent, send } = outbox();
    await sendOpeningNotices(env.DB, send, SITE, NOW);
    expect(sent[0]!.html).toContain('&lt;b&gt;烤肉&lt;/b&gt;');
    expect(sent[0]!.html).not.toContain('<b>烤肉</b>');
  });

  it('counts a failed send as not sent', async () => {
    const member = await person('甲');
    const event = await createEvent({ start: hoursAfterNow(30) });
    await db().insert(eventUsers).values({ eventId: event.id, userId: member.id });
    expect(await sendOpeningNotices(env.DB, async () => false, SITE, NOW)).toEqual({
      due: 1,
      sent: 0,
    });
  });
});

describe('birthday list', () => {
  it('sends admins next month’s birthdays in day order with the age they turn', async () => {
    await person('管理員', { isAdmin: true, birth: '1980-05-05' });
    await person('一般會員', { birth: '1985-06-06' });
    await person('十二月二十日', { birth: '2000-12-20' });
    await person('十二月三日', { birth: '1990-12-03' });
    await person('同一天', { birth: '1970-12-20' });

    const { sent, send } = outbox();
    const result = await sendBirthdayList(env.DB, send, SITE, NOW);
    expect(result).toEqual({ month: 12, people: 3, admins: 1, sent: 1 });
    expect(sent[0]).toMatchObject({
      to: '管理員@example.com',
      subject: '茄典教會會員 12 月份壽星通知',
    });
    const text = sent[0]!.text;
    expect(text.indexOf('12 月 3 號')).toBeLessThan(text.indexOf('12 月 20 號'));
    expect(text).toContain('十二月三日 36 歲');
    expect(text).toContain('十二月二十日 26 歲');
    expect(text).toContain('同一天 56 歲');
    expect(text).not.toContain('一般會員');
    expect(text).toContain(`${SITE}/admin/members?birth_month=12`);
  });

  it('rolls over to January of the next year in December', async () => {
    await person('管理員', { isAdmin: true, birth: '1980-05-05' });
    await person('元旦寶寶', { birth: '2000-01-01' });
    const { sent, send } = outbox();
    const result = await sendBirthdayList(env.DB, send, SITE, new Date('2026-12-25T03:00:00Z'));
    expect(result.month).toBe(1);
    expect(sent[0]!.text).toContain('元旦寶寶 27 歲');
  });

  it('still tells admins when nobody has a birthday', async () => {
    await person('管理員', { isAdmin: true, birth: '1980-05-05' });
    const { sent, send } = outbox();
    await sendBirthdayList(env.DB, send, SITE, NOW);
    expect(sent[0]!.text).toContain('下個月沒有壽星');
  });
});

describe('daily schedule', () => {
  it('sends the birthday list only on the 25th in Taipei time', async () => {
    await person('管理員', { isAdmin: true, birth: '1980-05-05' });
    const quiet = outbox();
    expect((await runDailyJobs(env.DB, quiet.send, SITE, NOW)).birthdays).toBeNull();
    expect(quiet.sent).toHaveLength(0);

    // 20:00 UTC on the 24th is already the 25th in Taipei
    const day25 = outbox();
    const result = await runDailyJobs(env.DB, day25.send, SITE, new Date('2026-11-24T20:00:00Z'));
    expect(result.birthdays?.month).toBe(12);
    expect(day25.sent).toHaveLength(1);
  });
});

describe('SendGrid sender', () => {
  afterEach(() => vi.unstubAllGlobals());

  const mail: Mail = { to: 'a@example.com', subject: '主旨', text: '內文', html: '<p>內文</p>' };

  it('posts the message to SendGrid with the API key and the default sender', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const send = sendGridSender({ ...env, SENDGRID_API_KEY: 'key-123' });
    expect(await send(mail)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.sendgrid.com/v3/mail/send');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer key-123');
    expect(JSON.parse(init.body as string)).toEqual({
      personalizations: [{ to: [{ email: 'a@example.com' }] }],
      from: { name: '茄典教會', email: 'notify@caten-church.org' },
      subject: '主旨',
      content: [
        { type: 'text/plain', value: '內文' },
        { type: 'text/html', value: '<p>內文</p>' },
      ],
    });
  });

  it('reports failure when SendGrid rejects the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 })),
    );
    expect(await sendGridSender({ ...env, SENDGRID_API_KEY: 'bad' })(mail)).toBe(false);
  });

  it('sends nothing without an API key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendGridSender({ ...env, SENDGRID_API_KEY: undefined })(mail)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

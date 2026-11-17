import { env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { profiles, users } from '../src/db/schema';
import { sendBirthdayList } from '../src/jobs';
import { sendGridSender, type Mail } from '../src/mail';
import { db } from './helpers';

const SITE = 'https://caten-church.org';
const NOW = new Date('2026-11-25T03:00:00.000Z');

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

describe('birthday list', () => {
  it('sends admins the birthdays of next month in day order with the age they turn', async () => {
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
    expect(text).toContain(`${SITE}/admin/members?month=12`);
  });

  it('goes only to admins who have an email', async () => {
    await person('有信箱的管理員', { isAdmin: true });
    await person('沒信箱的管理員', { isAdmin: true, email: null });
    await person('一般會員');
    const { sent, send } = outbox();
    await sendBirthdayList(env.DB, send, SITE, NOW);
    expect(sent.map((mail) => mail.to)).toEqual(['有信箱的管理員@example.com']);
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

  it('escapes names in the HTML body and counts failed sends', async () => {
    await person('管理員', { isAdmin: true, birth: '1980-05-05' });
    await person('<b>小明</b>', { birth: '1990-12-03' });
    const { sent, send } = outbox();
    await sendBirthdayList(env.DB, send, SITE, NOW);
    expect(sent[0]!.html).toContain('&lt;b&gt;小明&lt;/b&gt;');
    expect((await sendBirthdayList(env.DB, async () => false, SITE, NOW)).sent).toBe(0);
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

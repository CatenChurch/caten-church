import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { events, eventUsers, profiles, subscriptions, users } from './db/schema';
import { formatDateTime } from './format';
import { escapeHtml, type MailSender } from './mail';

const DAY = 24 * 60 * 60 * 1000;

/** Year, month (1-12) and day of `now` in Taipei. */
function taipeiDate(now: Date) {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })
    .format(now)
    .split('-')
    .map(Number);
  return { year: year!, month: month!, day: day! };
}

/**
 * Reminds everyone registered for an event that starts between 24 and 48 hours from now.
 * Run once a day, so each event is announced exactly once. Members who turned off
 * "joined events" notifications, or have no email, are skipped.
 */
export async function sendOpeningNotices(
  d1: D1Database,
  send: MailSender,
  siteUrl: string,
  now = new Date(),
) {
  const from = new Date(now.getTime() + DAY).toISOString();
  const to = new Date(now.getTime() + 2 * DAY).toISOString();
  const rows = await drizzle(d1)
    .select({
      eventId: events.id,
      eventName: events.name,
      start: events.start,
      email: users.email,
      name: profiles.name,
    })
    .from(events)
    .innerJoin(eventUsers, eq(eventUsers.eventId, events.id))
    .innerJoin(users, eq(users.id, eventUsers.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(
      and(
        gte(events.start, from),
        lt(events.start, to),
        isNotNull(users.email),
        // No stored row means the default, which is on
        sql`coalesce(${subscriptions.joinedEvents}, 1) = 1`,
      ),
    );

  let sent = 0;
  for (const row of rows) {
    const url = `${siteUrl}/events/${row.eventId}`;
    const greeting = `${row.name ?? ''} 弟兄姊妹，平安：`;
    const starts = formatDateTime(row.start);
    const ok = await send({
      to: row.email!,
      subject: `茄典教會活動提醒 : ${row.eventName}`,
      text: `${greeting}\n\n你報名的活動：${row.eventName}\n${url}\n活動將於 ${starts} 開始，\n我們非常期盼能夠見到你!\n\n茄典教會\n`,
      html: `<p>${escapeHtml(greeting)}</p><p style="margin-left: 10px;">你報名的活動：<a href="${escapeHtml(url)}">${escapeHtml(row.eventName)}</a><br>活動將於 ${starts} 開始，<br>我們非常期盼能夠見到你!</p><p>茄典教會</p>`,
    });
    if (ok) sent += 1;
  }
  return { due: rows.length, sent };
}

/** Sends every admin the list of members whose birthday is next month. */
export async function sendBirthdayList(
  d1: D1Database,
  send: MailSender,
  siteUrl: string,
  now = new Date(),
) {
  const today = taipeiDate(now);
  const month = (today.month % 12) + 1;
  const year = month === 1 ? today.year + 1 : today.year;
  const mm = String(month).padStart(2, '0');

  const db = drizzle(d1);
  const [admins, people] = await Promise.all([
    db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.isAdmin, true), isNotNull(users.email))),
    db
      .select({ name: profiles.name, birth: profiles.birth })
      .from(profiles)
      .where(sql`substr(${profiles.birth}, 6, 2) = ${mm}`)
      .orderBy(sql`substr(${profiles.birth}, 9, 2)`, profiles.id),
  ]);

  const lines = people.map((person) => {
    const birthYear = Number(person.birth!.slice(0, 4));
    const day = Number(person.birth!.slice(8, 10));
    return { day, text: `${person.name ?? '（未填姓名）'} ${year - birthYear} 歲` };
  });
  const days = [...new Set(lines.map((line) => line.day))];
  const section = (day: number) => lines.filter((line) => line.day === day).map((l) => l.text);
  const title = `茄典教會${month}月份壽星通知`;
  const link = `${siteUrl}/admin/members?birth_month=${month}`;
  const text =
    `${title}\n\n` +
    (days.length === 0
      ? '下個月沒有壽星。\n'
      : days.map((day) => `${month} 月 ${day} 號\n${section(day).join('\n')}\n`).join('\n')) +
    `\n前往網站查看會員詳情(需要管理員權限) : ${link}\n`;
  const html =
    `<h1>${title}</h1>` +
    (days.length === 0
      ? '<p>下個月沒有壽星。</p>'
      : days
          .map(
            (day) =>
              `<h2>${month} 月 ${day} 號</h2>` +
              section(day)
                .map((line) => `<p>${escapeHtml(line)}</p>`)
                .join(''),
          )
          .join('')) +
    `<p><a href="${escapeHtml(link)}">前往網站查看會員詳情(需要管理員權限)</a></p>`;

  let sent = 0;
  for (const admin of admins) {
    if (
      await send({ to: admin.email!, subject: `茄典教會會員 ${month} 月份壽星通知`, text, html })
    ) {
      sent += 1;
    }
  }
  return { month, people: people.length, admins: admins.length, sent };
}

/** The daily cron: event reminders every day, the birthday list on the 25th (Taipei time). */
export async function runDailyJobs(
  d1: D1Database,
  send: MailSender,
  siteUrl: string,
  now = new Date(),
) {
  const notices = await sendOpeningNotices(d1, send, siteUrl, now);
  const birthdays =
    taipeiDate(now).day === 25 ? await sendBirthdayList(d1, send, siteUrl, now) : null;
  return { notices, birthdays };
}

import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { profiles, users } from './db/schema';
import { escapeHtml, type MailSender } from './mail';

/** Year, month (1-12) and day of `now` in Taipei. */
function taipeiDate(now: Date) {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })
    .format(now)
    .split('-')
    .map(Number);
  return { year: year!, month: month!, day: day! };
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
  const link = `${siteUrl}/admin/members?month=${month}`;
  const text =
    `${title}\n\n` +
    (days.length === 0
      ? '下個月沒有壽星。\n'
      : days.map((day) => `${month} 月 ${day} 號\n${section(day).join('\n')}\n`).join('\n')) +
    `\n前往網站查看會友資料(需要管理員權限) : ${link}\n`;
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
    `<p><a href="${escapeHtml(link)}">前往網站查看會友資料(需要管理員權限)</a></p>`;

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

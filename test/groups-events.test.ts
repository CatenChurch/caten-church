import { describe, expect, it } from 'vitest';
import { events, eventUsers, groups, groupUsers } from '../src/db/schema';
import { createEvent, createUser, db, get, hoursFromNow } from './helpers';

describe('groups', () => {
  it('lists groups by sequence with the leader, not ordinary members', async () => {
    const leader = await createUser('王組長');
    const member = await createUser('陳組員');
    const [second, first] = await db()
      .insert(groups)
      .values([
        { name: '喜樂小組', introduction: '週五晚上', sequence: 2 },
        { name: '恩典小組', introduction: '週三晚上', sequence: 1 },
      ])
      .returning();
    await db()
      .insert(groupUsers)
      .values([
        { groupId: first!.id, userId: member.id, role: 'member' },
        { groupId: first!.id, userId: leader.id, role: 'leader' },
      ]);

    const html = await (await get('/groups')).text();
    expect(html.indexOf('恩典小組')).toBeLessThan(html.indexOf('喜樂小組'));
    expect(html).toContain('王組長');
    expect(html).not.toContain('陳組員');
    // One row per group even though the first group has two members
    expect(html.match(/恩典小組/g)).toHaveLength(1);
    expect(html).toContain(`/groups/${second!.id}`);
  });

  it('shows a group with its multi-line description', async () => {
    const [group] = await db()
      .insert(groups)
      .values({
        name: '青年團契',
        introduction: '歡迎青年',
        description: '第一段\n第二行\n\n第二段',
      })
      .returning();
    const html = await (await get(`/groups/${group!.id}`)).text();
    expect(html).toContain('<p>第一段<br/>第二行</p><p>第二段</p>');
  });

  it('returns 404 for a missing group', async () => {
    expect((await get('/groups/42')).status).toBe(404);
  });
});

describe('events', () => {
  it('separates events open for registration from closed ones', async () => {
    await createEvent({ name: '開放報名的活動' });
    await createEvent({
      name: '已截止的活動',
      signUpBegin: hoursFromNow(-48),
      signUpEnd: hoursFromNow(-1),
    });
    await createEvent({ name: '尚未開放的活動', signUpBegin: hoursFromNow(1) });

    const html = await (await get('/events')).text();
    const openSection = html.slice(html.indexOf('當前的活動'), html.indexOf('過期的活動'));
    const expiredSection = html.slice(html.indexOf('過期的活動'));
    expect(openSection).toContain('開放報名的活動');
    expect(openSection).not.toContain('已截止的活動');
    expect(expiredSection).toContain('已截止的活動');
    expect(html).not.toContain('尚未開放的活動');
  });

  it('paginates closed events 6 per page', async () => {
    await db()
      .insert(events)
      .values(
        Array.from({ length: 7 }, (_, i) => ({
          name: `舊活動-${i + 1}`,
          maxSignUpNumber: 10,
          signUpBegin: hoursFromNow(-100),
          signUpEnd: hoursFromNow(-50),
          start: hoursFromNow(-40),
          over: hoursFromNow(-30),
        })),
      );
    const first = await (await get('/events')).text();
    expect(first).toContain('舊活動-7');
    expect(first).not.toContain('舊活動-1<');
    expect(await (await get('/events?page=2')).text()).toContain('舊活動-1<');
  });

  it('shows the head count, or hides it when the organizer turned it off', async () => {
    const shown = await createEvent({ name: '公開人數' });
    const hidden = await createEvent({ name: '隱藏人數', showParticipants: false });
    const [a, b] = [await createUser('甲'), await createUser('乙')];
    await db()
      .insert(eventUsers)
      .values([
        { eventId: shown.id, userId: a.id },
        { eventId: shown.id, userId: b.id },
        { eventId: hidden.id, userId: a.id },
      ]);

    expect(await (await get(`/events/${shown.id}`)).text()).toMatch(/報名人數<\/th><td>2</);
    expect(await (await get(`/events/${hidden.id}`)).text()).toMatch(/報名人數<\/th><td>\?</);
  });

  it('shows the fee, or 免費 when there is none', async () => {
    const free = await createEvent({ registrationFee: 0 });
    const paid = await createEvent({ registrationFee: 500 });
    expect(await (await get(`/events/${free.id}`)).text()).toMatch(/報名費用<\/th><td>免費</);
    expect(await (await get(`/events/${paid.id}`)).text()).toMatch(/報名費用<\/th><td>500</);
  });

  it('returns 404 for a missing event', async () => {
    expect((await get('/events/42')).status).toBe(404);
  });
});

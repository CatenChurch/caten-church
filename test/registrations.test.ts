import { env } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { findEvent } from '../src/data/events';
import { joinEvent } from '../src/data/registrations';
import { eventUsers, profiles, users } from '../src/db/schema';
import { createEvent, db, flashOf, get, hoursFromNow, post, signInAs } from './helpers';

/** A signed-in member; `complete` gives them the profile an event registration needs. */
async function member(name: string, complete = true) {
  const [user] = await db()
    .insert(users)
    .values({ email: `${name}@example.com` })
    .returning();
  await db()
    .insert(profiles)
    .values({
      userId: user!.id,
      name,
      sex: '男',
      birth: '1990-03-09',
      idNumber: complete ? 'A123456789' : null,
      emergencyContact: complete ? '0911222333' : null,
    });
  return { user: user!, cookie: await signInAs(user!.id) };
}

const registrations = (eventId: number) =>
  db().select().from(eventUsers).where(eq(eventUsers.eventId, eventId));

describe('registering for an event', () => {
  it('registers a member with a complete profile and keeps the remark', async () => {
    const { user, cookie } = await member('甲');
    const event = await createEvent();
    const response = await post(`/events/${event.id}/join`, { remark: ' 吃素 ' }, cookie);
    expect(response.headers.get('location')).toBe(`/events/${event.id}`);
    expect(flashOf(response)).toEqual({ type: 'notice', message: '報名活動成功' });
    expect(await registrations(event.id)).toMatchObject([{ userId: user.id, remark: '吃素' }]);

    const html = await (await get(`/events/${event.id}`, cookie)).text();
    expect(html).toContain('已報名');
    expect(html).toContain(`action="/events/${event.id}/quit"`);
    expect(html).not.toContain(`action="/events/${event.id}/join"`);
  });

  it('marks payment and check-in as done only when the event needs neither', async () => {
    const { cookie } = await member('甲');
    const free = await createEvent({ registrationFee: 0, checkArrival: false });
    const strict = await createEvent({ registrationFee: 500, checkArrival: true });
    await post(`/events/${free.id}/join`, {}, cookie);
    await post(`/events/${strict.id}/join`, {}, cookie);
    expect(await registrations(free.id)).toMatchObject([{ paid: true, arrival: true }]);
    expect(await registrations(strict.id)).toMatchObject([{ paid: false, arrival: false }]);
  });

  it('sends a visitor who is not signed in to the sign-in page', async () => {
    const event = await createEvent();
    const response = await post(`/events/${event.id}/join`);
    expect(response.headers.get('location')).toBe(`/login?next=/events/${event.id}`);
    expect(await registrations(event.id)).toHaveLength(0);
    expect(await (await get(`/events/${event.id}`)).text()).toContain('登入後報名');
  });

  it('asks for the missing profile fields first, then returns to the event', async () => {
    const { cookie } = await member('甲', false);
    const event = await createEvent();
    const refused = await post(`/events/${event.id}/join`, {}, cookie);
    expect(refused.headers.get('location')).toBe(`/account/profile/edit?event=${event.id}`);
    expect(await registrations(event.id)).toHaveLength(0);

    const form = await (await get(`/account/profile/edit?event=${event.id}`, cookie)).text();
    expect(form).toContain(`name="event" value="${event.id}"`);

    const profile = {
      name: '甲',
      sex: '男',
      birth: '1990-03-09',
      terms: '1',
      event: String(event.id),
    };
    const incomplete = await post('/account/profile', profile, cookie);
    expect(incomplete.status).toBe(422);
    expect(await incomplete.text()).toContain('報名活動需要填寫身分證字號');

    const saved = await post(
      '/account/profile',
      { ...profile, idNumber: 'A123456789', emergencyContact: '0911222333' },
      cookie,
    );
    expect(saved.headers.get('location')).toBe(`/events/${event.id}`);
    const joined = await post(`/events/${event.id}/join`, {}, cookie);
    expect(flashOf(joined)?.message).toBe('報名活動成功');
  });

  it.each([
    ['before registration opens', { signUpBegin: hoursFromNow(1) }],
    ['after registration closes', { signUpBegin: hoursFromNow(-48), signUpEnd: hoursFromNow(-1) }],
  ])('refuses %s', async (_label, window) => {
    const { cookie } = await member('甲');
    const event = await createEvent(window);
    const response = await post(`/events/${event.id}/join`, {}, cookie);
    expect(flashOf(response)).toEqual({ type: 'alert', message: '目前不在報名時間內' });
    expect(await registrations(event.id)).toHaveLength(0);
  });

  it('refuses a second registration by the same member', async () => {
    const { cookie } = await member('甲');
    const event = await createEvent();
    await post(`/events/${event.id}/join`, {}, cookie);
    const again = await post(`/events/${event.id}/join`, {}, cookie);
    expect(flashOf(again)?.message).toBe('你已經報名過這個活動了');
    expect(await registrations(event.id)).toHaveLength(1);
  });

  it('refuses when the event is full, and says so on the page', async () => {
    const a = await member('甲');
    const b = await member('乙');
    const event = await createEvent({ maxSignUpNumber: 1 });
    await post(`/events/${event.id}/join`, {}, a.cookie);
    const response = await post(`/events/${event.id}/join`, {}, b.cookie);
    expect(flashOf(response)).toEqual({ type: 'alert', message: '報名人數已滿' });
    expect(await registrations(event.id)).toHaveLength(1);
    expect(await (await get(`/events/${event.id}`, b.cookie)).text()).toContain('報名人數已滿');
  });

  it('never lets simultaneous registrations exceed the limit', async () => {
    const members = await Promise.all(['甲', '乙', '丙', '丁', '戊'].map((name) => member(name)));
    const created = await createEvent({ maxSignUpNumber: 2 });
    const event = (await findEvent(env.DB, created.id))!;
    const results = await Promise.all(
      members.map(({ user }) => joinEvent(env.DB, event, user.id, '')),
    );
    expect(results.filter((r) => r === 'joined')).toHaveLength(2);
    expect(results.filter((r) => r === 'full')).toHaveLength(3);
    expect(await registrations(event.id)).toHaveLength(2);
  });

  it('returns 404 for an event that does not exist', async () => {
    const { cookie } = await member('甲');
    expect((await post('/events/999/join', {}, cookie)).status).toBe(404);
    expect((await post('/events/999/quit', {}, cookie)).status).toBe(404);
  });
});

describe('cancelling a registration', () => {
  it('removes only the registration of the member who cancels', async () => {
    const a = await member('甲');
    const b = await member('乙');
    const event = await createEvent();
    await post(`/events/${event.id}/join`, {}, a.cookie);
    await post(`/events/${event.id}/join`, {}, b.cookie);

    const response = await post(`/events/${event.id}/quit`, {}, a.cookie);
    expect(flashOf(response)).toEqual({ type: 'notice', message: '取消報名活動成功' });
    expect(await registrations(event.id)).toMatchObject([{ userId: b.user.id }]);
  });

  it('shows a message instead of an error when there is nothing to cancel', async () => {
    const { cookie } = await member('甲');
    const event = await createEvent();
    await post(`/events/${event.id}/join`, {}, cookie);
    await post(`/events/${event.id}/quit`, {}, cookie);
    const twice = await post(`/events/${event.id}/quit`, {}, cookie);
    expect(twice.status).toBe(302);
    expect(flashOf(twice)).toEqual({ type: 'alert', message: '你沒有報名這個活動' });
  });

  it('is not allowed once registration has closed', async () => {
    const { user, cookie } = await member('甲');
    const event = await createEvent({
      signUpBegin: hoursFromNow(-48),
      signUpEnd: hoursFromNow(-1),
    });
    await db().insert(eventUsers).values({ eventId: event.id, userId: user.id });
    const response = await post(`/events/${event.id}/quit`, {}, cookie);
    expect(flashOf(response)?.message).toBe('目前不在報名時間內');
    expect(await registrations(event.id)).toHaveLength(1);
    expect(await (await get(`/events/${event.id}`, cookie)).text()).not.toContain('取消報名');
  });
});

describe('who else registered', () => {
  it('shows names only, and only to members who registered', async () => {
    const a = await member('王小明');
    const b = await member('陳大華');
    const outsider = await member('路人');
    const event = await createEvent();
    await post(`/events/${event.id}/join`, { remark: '私人備註' }, a.cookie);
    await post(`/events/${event.id}/join`, {}, b.cookie);

    const html = await (await get(`/events/${event.id}/participants`, a.cookie)).text();
    expect(html).toContain('王小明');
    expect(html).toContain('陳大華');
    expect(html).not.toContain('A123456789');
    expect(html).not.toContain('私人備註');
    expect(html).not.toContain('@example.com');

    for (const cookie of [outsider.cookie, undefined]) {
      const refused = await get(`/events/${event.id}/participants`, cookie);
      expect(refused.status).toBe(302);
      expect(flashOf(refused)?.message).toBe('報名活動後才能觀看報名情況');
    }
  });

  it('stays hidden when the organizer turned the list off', async () => {
    const { cookie } = await member('甲');
    const event = await createEvent({ showParticipants: false });
    await post(`/events/${event.id}/join`, {}, cookie);
    const response = await get(`/events/${event.id}/participants`, cookie);
    expect(flashOf(response)?.message).toBe('報名情況未公開');
    expect(await (await get(`/events/${event.id}`, cookie)).text()).not.toContain('看有誰報名');
  });
});

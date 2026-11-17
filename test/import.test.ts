import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { buildImport, sqlLiteral, toIso, type Dump } from '../scripts/import/transform';
import { get } from './helpers';

const T = '2020-05-02T13:04:45.123456';

function dump(overrides: Partial<Dump> = {}): Dump {
  return {
    users: [
      {
        id: 1,
        email: 'Admin@Example.com',
        confirmed_at: T,
        last_sign_in_at: T,
        created_at: T,
        updated_at: T,
        is_admin: true,
      },
      {
        id: 2,
        email: 'member@example.com',
        confirmed_at: T,
        last_sign_in_at: null,
        created_at: T,
        updated_at: T,
        is_admin: false,
      },
    ],
    oauths: [{ id: 5, user_id: 2, provider: 'facebook', uid: '10001', created_at: T }],
    profiles: [
      {
        id: 1,
        user_id: 2,
        name: "O'Brien 陳",
        sex: 'male',
        birth: '1990-03-09',
        phone: '',
        cellphone: '0912345678',
        address: '高雄市',
        education: null,
        id_number: 'a123456789',
        emergency_contact: null,
        created_at: T,
        updated_at: T,
      },
    ],
    subscriptions: [
      { id: 1, user_id: 2, new_events: true, joined_events: false, created_at: T, updated_at: T },
    ],
    groups: [
      {
        id: 3,
        name: '恩典小組',
        creater_id: 1,
        introduction: '週三晚上',
        description: null,
        sequence: 1,
        members_count: 1,
        reports_count: 9,
        created_at: T,
        updated_at: T,
      },
    ],
    group_users: [{ id: 1, group_id: 3, user_id: 2, role: 'leader', created_at: T, updated_at: T }],
    events: [
      {
        id: 10,
        name: '夏令營',
        description: '三天兩夜',
        content: '內容',
        max_sign_up_number: 30,
        min_sign_up_number: 5,
        sign_up_begin: '2020-06-01T00:00:00',
        sign_up_end: '2020-06-20T00:00:00',
        start: '2020-07-01T01:00:00',
        over: '2020-07-03T09:00:00',
        user_id: 1,
        participants_count: 1,
        registery_fee: 500,
        check_arrival: true,
        show_participants: false,
        created_at: T,
        updated_at: T,
      },
    ],
    event_users: [
      {
        id: 1,
        event_id: 10,
        user_id: 2,
        paid: true,
        arrival: false,
        remark: '吃素',
        created_at: T,
        updated_at: T,
      },
    ],
    weeklies: [
      {
        id: 3850,
        title: '主日週報',
        issue: 120,
        published_at: '2026-07-18T16:00:00',
        viewed_count: 42,
        created_at: T,
        updated_at: T,
      },
      {
        id: 3860,
        title: '沒有附件',
        issue: 121,
        published_at: '2026-07-25T16:00:00',
        viewed_count: 0,
        created_at: T,
        updated_at: T,
      },
    ],
    weekly_pdfs: [
      {
        weekly_id: 3850,
        key: '01tyb4mlj67nzn5ebko8n9jymzqc',
        filename: '週報 120.pdf',
        byte_size: 903557,
        checksum: 'q1w2e3==',
      },
    ],
    ...overrides,
  };
}

async function load(result: ReturnType<typeof buildImport>) {
  await env.DB.batch(result.statements.map((sql) => env.DB.prepare(sql)));
}

describe('value conversion', () => {
  it('reads Postgres timestamps as UTC', () => {
    expect(toIso('2020-05-02T13:04:45.123456')).toBe('2020-05-02T13:04:45.123Z');
    expect(toIso('2020-05-02 13:04:45')).toBe('2020-05-02T13:04:45.000Z');
    expect(toIso('2020-05-02T21:04:45+08:00')).toBe('2020-05-02T13:04:45.000Z');
    expect(toIso(null)).toBeNull();
    expect(() => toIso('yesterday')).toThrow();
  });

  it('quotes SQL literals', () => {
    expect(sqlLiteral("O'Brien")).toBe("'O''Brien'");
    expect(sqlLiteral(null)).toBe('NULL');
    expect(sqlLiteral(true)).toBe('1');
    expect(sqlLiteral(42)).toBe('42');
  });
});

describe('import from the Rails database', () => {
  it('loads into the D1 schema and the site renders the imported data', async () => {
    const result = buildImport(dump());
    await load(result);
    expect(result.skipped).toEqual([]);
    expect(result.counts).toEqual({
      users: 2,
      oauth_accounts: 1,
      profiles: 1,
      subscriptions: 1,
      groups: 1,
      group_users: 1,
      events: 1,
      event_users: 1,
      weeklies: 2,
    });

    const admin = await env.DB.prepare('SELECT * FROM users WHERE id = 1').first();
    expect(admin).toMatchObject({
      email: 'admin@example.com',
      is_admin: 1,
      created_at: '2020-05-02T13:04:45.123Z',
    });
    const profile = await env.DB.prepare('SELECT * FROM profiles WHERE user_id = 2').first();
    expect(profile).toMatchObject({ name: "O'Brien 陳", phone: null, birth: '1990-03-09' });
    const event = await env.DB.prepare('SELECT * FROM events WHERE id = 10').first();
    expect(event).toMatchObject({
      organizer_id: 1,
      registration_fee: 500,
      check_arrival: 1,
      show_participants: 0,
    });

    // Old URLs keep their ids
    expect(await (await get('/weeklies/3850')).text()).toContain('主日週報');
    expect(await (await get('/groups/3')).text()).toContain('O&#39;Brien 陳');
    expect(await (await get('/events/10')).text()).toContain('夏令營');
  });

  it('maps each weekly PDF to weeklies/<id>.pdf and lists the copy to make', () => {
    const result = buildImport(dump());
    expect(result.pdfCopies).toEqual([
      {
        from: '01tyb4mlj67nzn5ebko8n9jymzqc',
        to: 'weeklies/3850.pdf',
        size: 903557,
        md5Base64: 'q1w2e3==',
      },
    ]);
    expect(result.statements.join('\n')).toContain("'weeklies/3850.pdf', '週報 120.pdf', 903557");
  });

  it('leaves out never-confirmed accounts and everything that belongs to them', async () => {
    const data = dump();
    data.users.push({
      id: 3,
      email: 'ghost@example.com',
      confirmed_at: null,
      last_sign_in_at: null,
      created_at: T,
      updated_at: T,
      is_admin: false,
    });
    data.profiles.push({ ...data.profiles[0]!, id: 2, user_id: 3 });
    data.event_users.push({
      id: 2,
      event_id: 10,
      user_id: 3,
      paid: false,
      arrival: false,
      remark: null,
      created_at: T,
      updated_at: T,
    });
    data.groups[0]!.creater_id = 3;

    const result = buildImport(data);
    await load(result);
    expect(result.counts.users).toBe(2);
    expect(result.skipped).toEqual([
      'users id=3: email never confirmed and no linked sign-in',
      'profiles id=2: user_id=3 was not imported',
      'event_users id=2: user_id=3 was not imported',
    ]);
    const group = await env.DB.prepare('SELECT creater_id FROM groups WHERE id = 3').first();
    expect(group).toEqual({ creater_id: null });
  });

  it('keeps an unconfirmed account that signs in with Facebook, without its email', async () => {
    const data = dump();
    data.users[1]!.confirmed_at = null;
    const result = buildImport(data);
    await load(result);
    expect(result.skipped).toEqual([]);
    const user = await env.DB.prepare('SELECT email FROM users WHERE id = 2').first();
    expect(user).toEqual({ email: null });
  });

  it('reports duplicates and orphans instead of failing the load', async () => {
    const data = dump();
    data.group_users.push({
      id: 2,
      group_id: 3,
      user_id: 2,
      role: 'member',
      created_at: T,
      updated_at: T,
    });
    data.group_users.push({
      id: 3,
      group_id: 99,
      user_id: 2,
      role: 'member',
      created_at: T,
      updated_at: T,
    });
    data.weekly_pdfs.push({
      weekly_id: 1,
      key: 'orphan',
      filename: 'x.pdf',
      byte_size: 1,
      checksum: 'x',
    });
    const result = buildImport(data);
    await load(result);
    expect(result.skipped).toEqual([
      'group_users id=2: duplicate membership 3:2',
      'group_users id=3: group 99 does not exist',
      'weekly_pdfs key=orphan: weekly 1 does not exist',
    ]);
    expect(result.pdfCopies).toHaveLength(1);
  });

  it('stops on a row the new schema cannot hold', () => {
    const data = dump();
    data.events[0]!.start = null;
    expect(() => buildImport(data)).toThrow('events id=10: start is empty');
  });
});

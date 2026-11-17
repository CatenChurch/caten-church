import { env } from 'cloudflare:test';
import { exports } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { IdentityInUseError, signInWithIdentity, type SsoProfile } from '../src/auth/users';
import { oauthAccounts, sessions, users } from '../src/db/schema';
import { BASE, db, flashOf, get, hoursFromNow, post, setCookieValue, signInAs } from './helpers';

const google = (overrides: Partial<SsoProfile> = {}): SsoProfile => ({
  provider: 'google',
  providerUserId: 'g-1',
  email: 'member@example.com',
  emailVerified: true,
  name: '王小明',
  ...overrides,
});

async function importedMember(email: string | null = 'member@example.com') {
  const [user] = await db().insert(users).values({ email }).returning();
  return user!;
}

const identitiesOf = (userId: number) =>
  db().select().from(oauthAccounts).where(eq(oauthAccounts.userId, userId));

describe('finding the member behind a sign-in', () => {
  it('creates a member on first sign-in', async () => {
    const result = await signInWithIdentity(env.DB, google());
    expect(result.outcome).toBe('created');
    const [user] = await db().select().from(users).where(eq(users.id, result.userId));
    expect(user).toMatchObject({ email: 'member@example.com', isAdmin: false });
  });

  it('signs the same member in again without creating another', async () => {
    const first = await signInWithIdentity(env.DB, google());
    const second = await signInWithIdentity(env.DB, google({ email: 'changed@example.com' }));
    expect(second).toEqual({ userId: first.userId, outcome: 'signed_in' });
    expect(await db().select().from(users)).toHaveLength(1);
  });

  it('gives a member of the old site their account back through a verified email', async () => {
    const member = await importedMember();
    const result = await signInWithIdentity(env.DB, google({ email: ' Member@Example.com ' }));
    expect(result).toEqual({ userId: member.id, outcome: 'linked' });
    expect(await identitiesOf(member.id)).toHaveLength(1);
  });

  it('does not hand over an account on an unverified email', async () => {
    const member = await importedMember();
    const result = await signInWithIdentity(
      env.DB,
      google({ provider: 'facebook', providerUserId: 'fb-9', emailVerified: false }),
    );
    expect(result.outcome).toBe('created');
    expect(result.userId).not.toBe(member.id);
    const [created] = await db().select().from(users).where(eq(users.id, result.userId));
    expect(created!.email).toBeNull();
    expect(await identitiesOf(member.id)).toHaveLength(0);
  });

  it('recognises a member who used Facebook on the old site by their Facebook id', async () => {
    const member = await importedMember(null);
    await db()
      .insert(oauthAccounts)
      .values({ userId: member.id, provider: 'facebook', providerUserId: '10001' });
    const result = await signInWithIdentity(env.DB, {
      provider: 'facebook',
      providerUserId: '10001',
      email: 'someone@example.com',
      emailVerified: false,
      name: null,
    });
    expect(result).toEqual({ userId: member.id, outcome: 'signed_in' });
  });

  it('links a second way to sign in while signed in, even with a different email', async () => {
    const member = await importedMember();
    const result = await signInWithIdentity(
      env.DB,
      google({ providerUserId: 'g-2', email: 'other@example.com' }),
      member.id,
    );
    expect(result).toEqual({ userId: member.id, outcome: 'linked' });
    expect(await db().select().from(users)).toHaveLength(1);
  });

  it('refuses to link an identity that belongs to another member', async () => {
    const owner = await signInWithIdentity(env.DB, google());
    const other = await importedMember('other@example.com');
    await expect(signInWithIdentity(env.DB, google(), other.id)).rejects.toBeInstanceOf(
      IdentityInUseError,
    );
    expect(await identitiesOf(owner.userId)).toHaveLength(1);
    expect(await identitiesOf(other.id)).toHaveLength(0);
  });
});

describe('sign-in pages', () => {
  it('offers only the providers that are configured', async () => {
    const html = await (await get('/login')).text();
    expect(html).toContain('href="/auth/google?next=%2Faccount%2Fprofile"');
    expect(html).not.toContain('/auth/line');
    expect(html).not.toContain('/auth/facebook');
    expect(html).not.toContain('開發用登入');
  });

  it('sends the visitor to Google with a state and a callback on this site', async () => {
    const response = await get('/auth/google?next=/weeklies/3');
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location')!);
    expect(location.origin).toBe('https://accounts.google.com');
    expect(location.searchParams.get('client_id')).toBe('test-google-client');
    expect(location.searchParams.get('redirect_uri')).toBe(`${BASE}/auth/google/callback`);
    expect(location.searchParams.get('state')).toBe(setCookieValue(response, 'oauth_state'));
    expect(decodeURIComponent(setCookieValue(response, 'oauth_next')!)).toBe('/weeklies/3');
  });

  it('returns 404 for a provider that is not configured or unknown', async () => {
    expect((await get('/auth/line')).status).toBe(404);
    expect((await get('/auth/nope')).status).toBe(404);
    expect((await get('/auth/line/callback?code=x&state=y')).status).toBe(404);
  });

  it('rejects a callback whose state does not match the cookie', async () => {
    const response = await get(
      '/auth/google/callback?code=abc&state=forged',
      'oauth_state=real; oauth_code_verifier=v',
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('登入逾時或已取消');
    expect(await db().select().from(users)).toHaveLength(0);
  });

  it('only keeps same-site paths as the place to go after signing in', async () => {
    const member = await importedMember();
    const cookie = await signInAs(member.id);
    for (const next of ['//evil.example', 'https://evil.example', '/\\evil.example']) {
      const response = await get(`/login?next=${encodeURIComponent(next)}`, cookie);
      expect(response.headers.get('location')).toBe('/account/profile');
    }
    const ok = await get('/login?next=/weeklies/3', cookie);
    expect(ok.headers.get('location')).toBe('/weeklies/3');
  });

  it('offers the development sign-in on localhost only', async () => {
    expect((await post('/auth/dev')).status).toBe(404);

    const local = await exports.default.fetch(
      new Request('http://localhost/auth/dev', {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'http://localhost',
        },
        body: 'next=/account/logins',
      }),
    );
    expect(local.status).toBe(302);
    expect(local.headers.get('location')).toBe('/account/logins');
    expect(setCookieValue(local, 'caten_session')).toBeTruthy();
  });
});

describe('sessions', () => {
  it('shows the member menu when signed in and the sign-in link otherwise', async () => {
    const member = await importedMember();
    expect(await (await get('/')).text()).toContain('href="/login"');
    const html = await (await get('/', await signInAs(member.id))).text();
    expect(html).toContain('action="/logout"');
    expect(html).not.toContain('href="/login"');
  });

  it('ignores and removes an expired session', async () => {
    const member = await importedMember();
    const cookie = await signInAs(member.id, hoursFromNow(-1));
    const response = await get('/account/logins', cookie);
    expect(response.headers.get('location')).toBe('/login?next=%2Faccount%2Flogins');
    expect(await db().select().from(sessions)).toHaveLength(0);
  });

  it('signs out by deleting the session', async () => {
    const member = await importedMember();
    const cookie = await signInAs(member.id);
    const response = await post('/logout', {}, cookie);
    expect(response.status).toBe(302);
    expect(flashOf(response)).toEqual({ type: 'notice', message: '已登出' });
    expect(await db().select().from(sessions)).toHaveLength(0);
    expect((await get('/account/logins', cookie)).status).toBe(302);
  });

  it('refuses a form posted from another site', async () => {
    const member = await importedMember();
    const cookie = await signInAs(member.id);
    const response = await exports.default.fetch(
      new Request(`${BASE}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'https://evil.example',
          Cookie: cookie,
        },
      }),
    );
    expect(response.status).toBe(403);
    expect(await db().select().from(sessions)).toHaveLength(1);
  });
});

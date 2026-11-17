import { decodeIdToken, Facebook, Google, Line } from 'arctic';
import type { SsoProfile } from './users';

/**
 * Sign-in providers. Adding one means adding an entry here plus its client id/secret; the
 * routes and pages pick it up automatically.
 */
export interface SsoProvider {
  id: string;
  label: string;
  enabled: (env: Env) => boolean;
  authorizationUrl: (env: Env, redirectUri: string, state: string, codeVerifier: string) => URL;
  fetchProfile: (
    env: Env,
    redirectUri: string,
    code: string,
    codeVerifier: string,
  ) => Promise<SsoProfile>;
}

interface IdTokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

const google: SsoProvider = {
  id: 'google',
  label: '使用 Google 登入',
  enabled: (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  authorizationUrl: (env, redirectUri, state, codeVerifier) =>
    new Google(
      env.GOOGLE_CLIENT_ID!,
      env.GOOGLE_CLIENT_SECRET!,
      redirectUri,
    ).createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']),
  fetchProfile: async (env, redirectUri, code, codeVerifier) => {
    const client = new Google(env.GOOGLE_CLIENT_ID!, env.GOOGLE_CLIENT_SECRET!, redirectUri);
    const tokens = await client.validateAuthorizationCode(code, codeVerifier);
    // The ID token comes straight from Google's token endpoint over TLS, so it is not re-verified.
    const claims = decodeIdToken(tokens.idToken()) as IdTokenClaims;
    return {
      provider: 'google',
      providerUserId: claims.sub,
      email: claims.email ?? null,
      emailVerified: claims.email_verified === true,
      name: claims.name ?? null,
    };
  },
};

const line: SsoProvider = {
  id: 'line',
  label: '使用 LINE 登入',
  enabled: (env) => Boolean(env.LINE_CHANNEL_ID && env.LINE_CHANNEL_SECRET),
  authorizationUrl: (env, redirectUri, state, codeVerifier) =>
    new Line(env.LINE_CHANNEL_ID!, env.LINE_CHANNEL_SECRET!, redirectUri).createAuthorizationURL(
      state,
      codeVerifier,
      ['openid', 'profile'],
    ),
  fetchProfile: async (env, redirectUri, code, codeVerifier) => {
    const client = new Line(env.LINE_CHANNEL_ID!, env.LINE_CHANNEL_SECRET!, redirectUri);
    const tokens = await client.validateAuthorizationCode(code, codeVerifier);
    const claims = decodeIdToken(tokens.idToken()) as IdTokenClaims;
    // The email scope needs LINE's approval and is not requested, so there is no email to trust.
    return {
      provider: 'line',
      providerUserId: claims.sub,
      email: null,
      emailVerified: false,
      name: claims.name ?? null,
    };
  },
};

const facebook: SsoProvider = {
  id: 'facebook',
  label: '使用 Facebook 登入',
  // FACEBOOK_LOGIN=off hides it while Meta has the app restricted, keeping the keys in place
  enabled: (env) =>
    Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) && env.FACEBOOK_LOGIN !== 'off',
  authorizationUrl: (env, redirectUri, state) =>
    new Facebook(
      env.FACEBOOK_APP_ID!,
      env.FACEBOOK_APP_SECRET!,
      redirectUri,
    ).createAuthorizationURL(state, ['public_profile', 'email']),
  fetchProfile: async (env, redirectUri, code) => {
    const client = new Facebook(env.FACEBOOK_APP_ID!, env.FACEBOOK_APP_SECRET!, redirectUri);
    const tokens = await client.validateAuthorizationCode(code);
    const response = await fetch('https://graph.facebook.com/me?fields=id,name,email', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    if (!response.ok) throw new Error(`facebook profile: HTTP ${response.status}`);
    const me = await response.json<{ id?: string; name?: string; email?: string }>();
    if (!me.id) throw new Error('facebook profile: no id');
    // Facebook does not say whether the address is confirmed, so it is never used to match
    // an existing member; members who used Facebook on the old site match by id instead.
    return {
      provider: 'facebook',
      providerUserId: me.id,
      email: me.email ?? null,
      emailVerified: false,
      name: me.name ?? null,
    };
  },
};

export const SSO_PROVIDERS: SsoProvider[] = [google, line, facebook];

export function findProvider(id: string) {
  return SSO_PROVIDERS.find((provider) => provider.id === id);
}

export function providerLabel(id: string) {
  return { google: 'Google', line: 'LINE', facebook: 'Facebook', dev: '開發用登入' }[id] ?? id;
}

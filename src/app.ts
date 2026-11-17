import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { CurrentUser } from './auth/users';
import { loadSettings, type Settings } from './settings';

export interface Flash {
  type: 'notice' | 'alert';
  message: string;
}

export interface AppEnv {
  Bindings: Env;
  Variables: {
    settings?: Settings;
    /** Set by the session middleware in index.ts. */
    user: CurrentUser | null;
    flash: Flash | null;
  };
}

export type AppContext = Context<AppEnv>;

/** Site settings for this request, read from D1 once. */
export async function getSettings(c: AppContext) {
  let settings = c.get('settings');
  if (!settings) {
    settings = await loadSettings(c.env.DB);
    c.set('settings', settings);
  }
  return settings;
}

/** What every page needs besides its own content: who is signed in and a one-time message. */
export interface ViewState {
  user: CurrentUser | null;
  flash: Flash | null;
}

export const viewState = (c: AppContext): ViewState => ({
  user: c.get('user'),
  flash: c.get('flash'),
});

const FLASH_COOKIE = 'flash';

/** Shows `message` once, on the next page the visitor loads (used with redirects). */
export function setFlash(c: AppContext, type: Flash['type'], message: string) {
  setCookie(c, FLASH_COOKIE, JSON.stringify({ type, message }), {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60,
  });
}

/** Reads and clears the one-time message. */
export function takeFlash(c: AppContext): Flash | null {
  const raw = getCookie(c, FLASH_COOKIE);
  if (!raw) return null;
  deleteCookie(c, FLASH_COOKIE, { path: '/' });
  try {
    const value = JSON.parse(raw) as Partial<Flash>;
    if ((value.type === 'notice' || value.type === 'alert') && typeof value.message === 'string') {
      return { type: value.type, message: value.message };
    }
  } catch {
    // A malformed cookie is not worth failing the request over.
  }
  return null;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(next: string | undefined, fallback = '/account/profile') {
  return next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : fallback;
}

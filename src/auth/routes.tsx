import { generateCodeVerifier, generateState } from 'arctic';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { getSettings, safeNext, setFlash, viewState, type AppContext, type AppEnv } from '../app';
import { Page } from '../views/layout';
import { findProvider, providerLabel, SSO_PROVIDERS } from './providers';
import { endSession, startSession } from './sessions';
import { IdentityInUseError, signInWithIdentity } from './users';

export const auth = new Hono<AppEnv>();

const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const OAUTH_COOKIES = ['oauth_state', 'oauth_code_verifier', 'oauth_next'];

/** Local-only sign-in without a provider, for development (`DEV_LOGIN=true` in .dev.vars). */
export function devLoginEnabled(c: AppContext) {
  const { hostname } = new URL(c.req.url);
  return c.env.DEV_LOGIN === 'true' && (hostname === 'localhost' || hostname === '127.0.0.1');
}

async function loginPage(c: AppContext, next: string, error?: string, status: 200 | 400 = 200) {
  const s = await getSettings(c);
  const providers = SSO_PROVIDERS.filter((provider) => provider.enabled(c.env));
  c.status(status);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="登入"
      breadcrumb={[{ label: '登入', href: '/login' }]}
      heading="登入"
      lead={<p class="lead">登入會員以管理個人資料</p>}
    >
      <div class="container" style="max-width: 480px">
        {error && (
          <div class="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <div class="card">
          <div class="card-body d-grid gap-2">
            {providers.map((provider) => (
              <a
                class="btn btn-purple"
                href={`/auth/${provider.id}?next=${encodeURIComponent(next)}`}
              >
                {provider.label}
              </a>
            ))}
            {devLoginEnabled(c) && (
              <form method="post" action="/auth/dev" class="d-grid">
                <input type="hidden" name="next" value={next} />
                <button type="submit" class="btn btn-outline-secondary">
                  開發用登入（僅限 localhost）
                </button>
              </form>
            )}
            {providers.length === 0 && !devLoginEnabled(c) && (
              <p class="text-danger mb-0">目前沒有可用的登入方式。</p>
            )}
          </div>
          <div class="card-footer text-muted small">
            第一次登入會自動建立會員。以前用 email 和密碼註冊的會友，請用同一個 email 的 Google
            帳號登入，就會接回原本的帳號。
          </div>
        </div>
      </div>
    </Page>,
  );
}

auth.get('/login', async (c) => {
  const next = safeNext(c.req.query('next'));
  if (c.get('user')) return c.redirect(next);
  return loginPage(c, next);
});

auth.get('/auth/:provider', (c) => {
  const provider = findProvider(c.req.param('provider'));
  if (!provider?.enabled(c.env)) return c.notFound();

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const cookie = {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/auth',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  } as const;
  setCookie(c, 'oauth_state', state, cookie);
  setCookie(c, 'oauth_code_verifier', codeVerifier, cookie);
  setCookie(c, 'oauth_next', safeNext(c.req.query('next')), cookie);

  const redirectUri = new URL(`/auth/${provider.id}/callback`, c.req.url).toString();
  return c.redirect(provider.authorizationUrl(c.env, redirectUri, state, codeVerifier).toString());
});

auth.get('/auth/:provider/callback', async (c) => {
  const provider = findProvider(c.req.param('provider'));
  if (!provider?.enabled(c.env)) return c.notFound();

  const state = getCookie(c, 'oauth_state');
  const codeVerifier = getCookie(c, 'oauth_code_verifier');
  const next = safeNext(getCookie(c, 'oauth_next'));
  for (const name of OAUTH_COOKIES) deleteCookie(c, name, { path: '/auth' });

  const code = c.req.query('code');
  if (!code || !state || !codeVerifier || c.req.query('state') !== state) {
    return loginPage(c, next, '登入逾時或已取消，請再試一次。', 400);
  }

  const current = c.get('user');
  try {
    const redirectUri = new URL(`/auth/${provider.id}/callback`, c.req.url).toString();
    const profile = await provider.fetchProfile(c.env, redirectUri, code, codeVerifier);
    const result = await signInWithIdentity(c.env.DB, profile, current?.id ?? null);
    if (current) {
      if (result.outcome === 'linked') {
        setFlash(c, 'notice', `已綁定 ${providerLabel(provider.id)} 登入`);
      }
      return c.redirect('/account/logins');
    }
    await startSession(c, result.userId);
    return c.redirect(next);
  } catch (error) {
    if (error instanceof IdentityInUseError) {
      setFlash(c, 'alert', `這個 ${providerLabel(provider.id)} 帳號已經綁定在另一位會員上`);
      return c.redirect('/account/logins');
    }
    console.error('auth @ callback failed', error);
    return loginPage(c, next, '登入失敗，請再試一次。', 400);
  }
});

auth.post('/auth/dev', async (c) => {
  if (!devLoginEnabled(c)) return c.notFound();
  const form = await c.req.parseBody();
  const result = await signInWithIdentity(c.env.DB, {
    provider: 'dev',
    providerUserId: 'dev',
    email: 'dev@localhost',
    emailVerified: false,
    name: '開發用會員',
  });
  await startSession(c, result.userId);
  return c.redirect(safeNext(typeof form.next === 'string' ? form.next : undefined));
});

auth.post('/logout', async (c) => {
  await endSession(c);
  setFlash(c, 'notice', '已登出');
  return c.redirect('/');
});

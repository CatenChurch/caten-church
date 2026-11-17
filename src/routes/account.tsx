import { Hono } from 'hono';
import type { Child } from 'hono/jsx';
import { getSettings, setFlash, viewState, type AppContext, type AppEnv } from '../app';
import { providerLabel, SSO_PROVIDERS } from '../auth/providers';
import { listIdentities, type CurrentUser } from '../auth/users';
import {
  findProfile,
  PROFILE_LABELS,
  readProfileForm,
  saveProfile,
  SEXES,
  validateProfile,
  type ProfileErrors,
  type ProfileField,
  type ProfileInput,
} from '../data/account';
import { formatDateTime } from '../format';
import { Page } from '../views/layout';

/** Every route here requires a signed-in member. */
export const account = new Hono<AppEnv>();

/** The signed-in member; the guard below makes sure there is one. */
function member(c: AppContext): CurrentUser {
  const user = c.get('user');
  if (!user) throw new Error('account route reached without a signed-in member');
  return user;
}

account.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    const path = new URL(c.req.url).pathname;
    return c.redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  await next();
});

const accountCrumb = { label: '會員中心', href: '/account/profile' };

async function accountPage(
  c: AppContext,
  props: { title: string; path: string; lead: string; children: Child; status?: 200 | 422 },
) {
  const s = await getSettings(c);
  c.status(props.status ?? 200);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={props.title}
      active="account"
      breadcrumb={[accountCrumb, { label: props.title, href: props.path }]}
      heading={props.title}
      lead={<p class="lead">{props.lead}</p>}
    >
      <div class="container">{props.children}</div>
    </Page>,
  );
}

account.get('/', (c) => c.redirect('/account/profile'));

// --- Profile ---

const PROFILE_ORDER: ProfileField[] = [
  'name',
  'sex',
  'birth',
  'idNumber',
  'phone',
  'cellphone',
  'emergencyContact',
  'address',
  'education',
];

function ProfileForm(props: { values: ProfileInput; errors: ProfileErrors; isNew: boolean }) {
  const { values, errors } = props;
  const invalid = (field: ProfileField) => (errors[field] ? ' is-invalid' : '');
  const feedback = (field: ProfileField) =>
    errors[field] && <div class="invalid-feedback">{errors[field]}</div>;
  const textInput = (field: ProfileField, extra: Record<string, string> = {}) => (
    <div class="mb-3">
      <label class="form-label" for={field}>
        {PROFILE_LABELS[field]}
      </label>
      <input
        class={`form-control${invalid(field)}`}
        id={field}
        name={field}
        value={values[field]}
        {...extra}
      />
      {feedback(field)}
    </div>
  );
  return (
    <form method="post" action="/account/profile" novalidate>
      {textInput('name', { autocomplete: 'name' })}
      <div class="mb-3">
        <label class="form-label" for="sex">
          {PROFILE_LABELS.sex}
        </label>
        <select class={`form-select${invalid('sex')}`} id="sex" name="sex">
          <option value="">請選擇你的性別</option>
          {SEXES.map((sex) => (
            <option value={sex} selected={values.sex === sex}>
              {sex}
            </option>
          ))}
        </select>
        {feedback('sex')}
      </div>
      {textInput('birth', { type: 'date' })}
      {textInput('idNumber', { autocomplete: 'off' })}
      {textInput('phone', { type: 'tel', placeholder: '076178379' })}
      {textInput('cellphone', { type: 'tel' })}
      {textInput('emergencyContact', { type: 'tel' })}
      {textInput('address')}
      {textInput('education')}
      <div class="form-check mb-3">
        <input
          class={`form-check-input${errors.terms ? ' is-invalid' : ''}`}
          type="checkbox"
          id="terms"
          name="terms"
          value="1"
        />
        <label class="form-check-label" for="terms">
          我已閱讀並且接受 <a href="/term">隱私條款</a> 的內容
        </label>
        {errors.terms && <div class="invalid-feedback">{errors.terms}</div>}
      </div>
      <button type="submit" class="btn btn-purple">
        {props.isNew ? '建立個人資料' : '更新個人資料'}
      </button>
    </form>
  );
}

const emptyProfile = (): ProfileInput => readProfileForm({});

account.get('/profile', async (c) => {
  const profile = await findProfile(c.env.DB, member(c).id);
  if (!profile) {
    setFlash(c, 'alert', '尚未建立個人資料');
    return c.redirect('/account/profile/edit');
  }
  return accountPage(c, {
    title: '個人資料',
    path: '/account/profile',
    lead: '教會聯絡你時會使用這些資料',
    children: (
      <>
        <a class="btn btn-outline-primary mb-3" href="/account/profile/edit">
          <i class="bi bi-pencil me-1"></i>編輯
        </a>
        <div class="card">
          <ul class="list-group list-group-flush">
            {PROFILE_ORDER.map((field) => (
              <li class="list-group-item d-flex justify-content-between">
                <strong>{PROFILE_LABELS[field]}</strong>
                <span>{profile[field]}</span>
              </li>
            ))}
          </ul>
        </div>
      </>
    ),
  });
});

account.get('/profile/edit', async (c) => {
  const profile = await findProfile(c.env.DB, member(c).id);
  const values = profile
    ? (Object.fromEntries(
        PROFILE_ORDER.map((field) => [field, profile[field] ?? '']),
      ) as ProfileInput)
    : emptyProfile();
  return accountPage(c, {
    title: profile ? '編輯個人資料' : '建立個人資料',
    path: '/account/profile/edit',
    lead: '教會聯絡你時會使用這些資料',
    children: <ProfileForm values={values} errors={{}} isNew={!profile} />,
  });
});

account.post('/profile', async (c) => {
  const me = member(c);
  const form = await c.req.parseBody();
  const values = readProfileForm(form);
  const errors = validateProfile(values, { termsAccepted: form.terms === '1' });
  const existing = await findProfile(c.env.DB, me.id);
  if (Object.keys(errors).length > 0) {
    return accountPage(c, {
      title: existing ? '編輯個人資料' : '建立個人資料',
      path: '/account/profile/edit',
      lead: '有欄位需要修正',
      status: 422,
      children: <ProfileForm values={values} errors={errors} isNew={!existing} />,
    });
  }
  await saveProfile(c.env.DB, me.id, values);
  setFlash(c, 'notice', existing ? '更新個人資料成功' : '建立個人資料成功');
  return c.redirect('/account/profile');
});

// --- Ways to sign in ---

account.get('/logins', async (c) => {
  const me = member(c);
  const identities = await listIdentities(c.env.DB, me.id);
  const linked = new Set(identities.map((identity) => identity.provider));
  const available = SSO_PROVIDERS.filter((p) => p.enabled(c.env) && !linked.has(p.id));
  return accountPage(c, {
    title: '登入方式',
    path: '/account/logins',
    lead: '可以用已經綁定的任何一種方式登入',
    children: (
      <div class="card">
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between">
            <strong>Email</strong>
            <span>{me.email ?? '（沒有）'}</span>
          </li>
          {identities.map((identity) => (
            <li class="list-group-item d-flex justify-content-between">
              <strong>{providerLabel(identity.provider)}</strong>
              <span class="text-muted">已綁定於 {formatDateTime(identity.createdAt)}</span>
            </li>
          ))}
        </ul>
        {available.length > 0 && (
          <div class="card-body d-grid gap-2">
            {available.map((provider) => (
              <a class="btn btn-outline-primary" href={`/auth/${provider.id}?next=/account/logins`}>
                綁定 {providerLabel(provider.id)}
              </a>
            ))}
          </div>
        )}
      </div>
    ),
  });
});

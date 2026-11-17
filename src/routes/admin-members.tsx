import type { Hono } from 'hono';
import type { Child } from 'hono/jsx';
import { setFlash, type AppContext, type AppEnv } from '../app';
import { providerLabel } from '../auth/providers';
import { listIdentities } from '../auth/users';
import {
  PROFILE_LABELS,
  readProfileForm,
  saveProfile,
  SEXES,
  validateProfile,
  type ProfileErrors,
  type ProfileField,
  type ProfileInput,
} from '../data/account';
import {
  findMember,
  listMembers,
  memberFilterQuery,
  membersCsv,
  mergeMembers,
  readMemberFilters,
  setAdmin,
  setEmail,
  type Member,
} from '../data/members';
import { formatDateTime, parseId, parsePage } from '../format';
import { Pagination } from '../views/layout';

type AdminPage = (
  c: AppContext,
  props: {
    title: string;
    crumbs?: { label: string; href: string }[];
    children: Child;
    status?: 200 | 422;
  },
) => Promise<Response>;

const membersCrumb = { label: '會友', href: '/admin/members' };

const PROFILE_FIELDS: ProfileField[] = [
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

const displayName = (member: Member) => member.name ?? member.email ?? `會友 #${member.id}`;

/** Routes under /admin/members; the admin guard is already applied by the caller. */
export function registerMemberRoutes(admin: Hono<AppEnv>, adminPage: AdminPage) {
  async function load(c: AppContext) {
    const id = parseId(c.req.param('id'));
    return id === null ? undefined : findMember(c.env.DB, id);
  }

  admin.get('/members', async (c) => {
    const filters = readMemberFilters(c.req.query());
    const page = parsePage(c.req.query('page'));
    const list = await listMembers(c.env.DB, filters, page);
    const query = memberFilterQuery(filters);
    const pagination = (
      <Pagination page={page} totalPages={list.totalPages} path="/admin/members" query={query} />
    );
    return adminPage(c, {
      title: '會友',
      crumbs: [membersCrumb],
      children: (
        <>
          <form method="get" action="/admin/members" class="row g-2 align-items-end mb-3">
            <div class="col-12 col-md-4">
              <label class="form-label" for="q">
                Email、姓名或電話
              </label>
              <input class="form-control" id="q" name="q" value={filters.q} />
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label" for="sex">
                性別
              </label>
              <select class="form-select" id="sex" name="sex">
                <option value="">全部</option>
                {SEXES.map((sex) => (
                  <option value={sex} selected={filters.sex === sex}>
                    {sex}
                  </option>
                ))}
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label" for="month">
                生日月份
              </label>
              <select class="form-select" id="month" name="month">
                <option value="">全部</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option value={String(month)} selected={filters.month === month}>
                    {month} 月
                  </option>
                ))}
              </select>
            </div>
            <div class="col-6 col-md-2">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="admins"
                  name="admins"
                  value="1"
                  checked={filters.adminsOnly}
                />
                <label class="form-check-label" for="admins">
                  只看管理員
                </label>
              </div>
            </div>
            <div class="col-6 col-md-2 d-flex gap-2">
              <button type="submit" class="btn btn-outline-primary">
                搜尋
              </button>
              <a class="btn btn-outline-secondary" href="/admin/members">
                清除
              </a>
            </div>
          </form>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-muted">共 {list.total} 位</span>
            <a
              class="btn btn-sm btn-outline-success"
              href={`/admin/members.csv${query ? `?${query}` : ''}`}
            >
              <i class="bi bi-download me-1"></i>匯出 CSV
            </a>
          </div>
          {pagination}
          <div class="table-responsive">
            <table class="table align-middle">
              <thead class="table-light">
                <tr>
                  <th>編號</th>
                  <th>姓名</th>
                  <th>Email</th>
                  <th>性別</th>
                  <th>生日</th>
                  <th>行動電話</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((member) => (
                  <tr>
                    <td>{member.id}</td>
                    <td>
                      {member.name}
                      {member.isAdmin && <span class="badge text-bg-warning ms-1">管理員</span>}
                    </td>
                    <td>{member.email}</td>
                    <td>{member.sex}</td>
                    <td>{member.birth}</td>
                    <td>{member.cellphone}</td>
                    <td>
                      <a
                        class="btn btn-sm btn-outline-secondary"
                        href={`/admin/members/${member.id}`}
                      >
                        查看
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination}
        </>
      ),
    });
  });

  admin.get('/members.csv', async (c) => {
    const list = await listMembers(c.env.DB, readMemberFilters(c.req.query()), null);
    const filename = encodeURIComponent('茄典教會會員一覽.csv');
    return c.body(membersCsv(list.rows), 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Cache-Control': 'no-store',
    });
  });

  admin.get('/members/:id', async (c) => {
    const member = await load(c);
    if (!member) return c.notFound();
    const identities = await listIdentities(c.env.DB, member.id);
    const isSelf = c.get('user')!.id === member.id;
    const rows: [string, Child][] = [
      ['編號', member.id],
      ['Email', member.email ?? '（沒有）'],
      ...PROFILE_FIELDS.map((field): [string, Child] => [PROFILE_LABELS[field], member[field]]),
      ['登入方式', identities.map((i) => providerLabel(i.provider)).join('、') || '（還沒有）'],
      ['上次登入', formatDateTime(member.lastSignInAt) || '（沒有紀錄）'],
      ['加入時間', formatDateTime(member.createdAt)],
    ];
    return adminPage(c, {
      title: displayName(member),
      crumbs: [membersCrumb, { label: displayName(member), href: `/admin/members/${member.id}` }],
      children: (
        <>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <a class="btn btn-outline-primary" href={`/admin/members/${member.id}/edit`}>
              <i class="bi bi-pencil me-1"></i>編輯
            </a>
            {member.isAdmin ? (
              <form method="post" action={`/admin/members/${member.id}/admin`}>
                <input type="hidden" name="admin" value="0" />
                <button type="submit" class="btn btn-outline-danger" disabled={isSelf}>
                  取消管理員
                </button>
              </form>
            ) : (
              <form
                method="post"
                action={`/admin/members/${member.id}/admin`}
                onsubmit="return confirm('管理員可以看到所有會友的個人資料並修改網站內容，確定嗎？')"
              >
                <input type="hidden" name="admin" value="1" />
                <button type="submit" class="btn btn-outline-warning">
                  設為管理員
                </button>
              </form>
            )}
            {member.isAdmin && <span class="badge text-bg-warning align-self-center">管理員</span>}
          </div>
          <div class="card mb-4">
            <ul class="list-group list-group-flush">
              {rows.map(([label, value]) => (
                <li class="list-group-item d-flex justify-content-between">
                  <strong>{label}</strong>
                  <span class="text-break text-end">{value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div class="card border-danger">
            <div class="card-header">合併重複的帳號</div>
            <div class="card-body">
              <p class="small text-muted">
                同一個人有兩個帳號時（例如舊的 email 帳號，和後來用 LINE
                登入時新建的帳號），把另一個帳號併進這一個。另一個帳號的登入方式和小組會移過來，然後被刪除；這個帳號已有個人資料時，另一個帳號的個人資料會被丟棄。這個動作無法復原。
              </p>
              <form
                method="post"
                action={`/admin/members/${member.id}/merge`}
                class="row g-2 align-items-end"
                onsubmit="return confirm('合併後另一個帳號會被刪除，無法復原。確定要合併嗎？')"
              >
                <div class="col-auto">
                  <label class="form-label" for="from">
                    要併進來的帳號編號
                  </label>
                  <input class="form-control" id="from" name="from" inputmode="numeric" required />
                </div>
                <div class="col-auto">
                  <button type="submit" class="btn btn-danger">
                    合併並刪除該帳號
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ),
    });
  });

  function EditForm(props: {
    member: Member;
    email: string;
    values: ProfileInput;
    errors: ProfileErrors & { email?: string };
  }) {
    const { values, errors } = props;
    const input = (field: ProfileField, type = 'text') => (
      <div class="mb-3">
        <label class="form-label" for={field}>
          {PROFILE_LABELS[field]}
        </label>
        <input
          class={`form-control${errors[field] ? ' is-invalid' : ''}`}
          id={field}
          name={field}
          type={type}
          value={values[field]}
        />
        {errors[field] && <div class="invalid-feedback">{errors[field]}</div>}
      </div>
    );
    return (
      <form method="post" action={`/admin/members/${props.member.id}`} novalidate>
        <div class="mb-3">
          <label class="form-label" for="email">
            Email
          </label>
          <input
            class={`form-control${errors.email ? ' is-invalid' : ''}`}
            id="email"
            name="email"
            type="email"
            value={props.email}
          />
          {errors.email && <div class="invalid-feedback">{errors.email}</div>}
          <div class="form-text">
            會友用 Google 登入時，會以這個 email 對回這個帳號，所以請確認是本人的信箱。
          </div>
        </div>
        {input('name')}
        <div class="mb-3">
          <label class="form-label" for="sex">
            {PROFILE_LABELS.sex}
          </label>
          <select class={`form-select${errors.sex ? ' is-invalid' : ''}`} id="sex" name="sex">
            <option value="">請選擇</option>
            {SEXES.map((sex) => (
              <option value={sex} selected={values.sex === sex}>
                {sex}
              </option>
            ))}
          </select>
          {errors.sex && <div class="invalid-feedback">{errors.sex}</div>}
        </div>
        {input('birth', 'date')}
        {input('idNumber')}
        {input('phone', 'tel')}
        {input('cellphone', 'tel')}
        {input('emergencyContact', 'tel')}
        {input('address')}
        {input('education')}
        <button type="submit" class="btn btn-purple">
          更新會友資料
        </button>
      </form>
    );
  }

  const profileValues = (member: Member) =>
    Object.fromEntries(PROFILE_FIELDS.map((field) => [field, member[field] ?? ''])) as ProfileInput;

  admin.get('/members/:id/edit', async (c) => {
    const member = await load(c);
    if (!member) return c.notFound();
    return adminPage(c, {
      title: `編輯 ${displayName(member)}`,
      crumbs: [membersCrumb, { label: displayName(member), href: `/admin/members/${member.id}` }],
      children: (
        <EditForm
          member={member}
          email={member.email ?? ''}
          values={profileValues(member)}
          errors={{}}
        />
      ),
    });
  });

  admin.post('/members/:id/admin', async (c) => {
    const member = await load(c);
    if (!member) return c.notFound();
    const form = await c.req.parseBody();
    const makeAdmin = form.admin === '1';
    // An admin cannot lock themselves (and possibly everyone) out
    if (!makeAdmin && member.id === c.get('user')!.id) {
      setFlash(c, 'alert', '不能取消自己的管理員身分');
    } else {
      await setAdmin(c.env.DB, member.id, makeAdmin);
      setFlash(
        c,
        'notice',
        `${displayName(member)} ${makeAdmin ? '已成為管理員' : '已不是管理員'}`,
      );
    }
    return c.redirect(`/admin/members/${member.id}`);
  });

  admin.post('/members/:id/merge', async (c) => {
    const member = await load(c);
    if (!member) return c.notFound();
    const form = await c.req.parseBody();
    const fromId = parseId(typeof form.from === 'string' ? form.from.trim() : undefined);
    const from = fromId === null ? undefined : await findMember(c.env.DB, fromId);
    const back = `/admin/members/${member.id}`;
    if (!from) {
      setFlash(c, 'alert', '找不到要併進來的帳號');
    } else if (from.id === member.id) {
      setFlash(c, 'alert', '不能把帳號併進自己');
    } else if (from.id === c.get('user')!.id) {
      setFlash(c, 'alert', '不能刪除你正在使用的帳號；請改成把另一個帳號併進你的帳號');
    } else {
      await mergeMembers(c.env.DB, member.id, from.id);
      setFlash(c, 'notice', `已把 ${displayName(from)}（#${from.id}）併入這個帳號`);
    }
    return c.redirect(back);
  });

  admin.post('/members/:id', async (c) => {
    const member = await load(c);
    if (!member) return c.notFound();
    const form = await c.req.parseBody();
    const values = readProfileForm(form);
    const email = typeof form.email === 'string' ? form.email.trim().toLowerCase() : '';
    // The member accepted the terms themselves; an admin correcting a record does not re-accept
    const errors: ProfileErrors & { email?: string } = validateProfile(values, {
      termsAccepted: true,
    });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email 格式不正確';

    const invalid = () =>
      adminPage(c, {
        title: `編輯 ${displayName(member)}`,
        crumbs: [membersCrumb, { label: displayName(member), href: `/admin/members/${member.id}` }],
        status: 422,
        children: <EditForm member={member} email={email} values={values} errors={errors} />,
      });
    if (Object.keys(errors).length > 0) return invalid();
    if (!(await setEmail(c.env.DB, member.id, email || null))) {
      errors.email = '這個 email 已經是另一位會友的帳號；若是同一個人，請用合併帳號';
      return invalid();
    }
    await saveProfile(c.env.DB, member.id, values);
    setFlash(c, 'notice', '更新會友資料成功');
    return c.redirect(`/admin/members/${member.id}`);
  });
}

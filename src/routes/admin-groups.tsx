import type { Hono } from 'hono';
import type { Child } from 'hono/jsx';
import { setFlash, type AppContext, type AppEnv } from '../app';
import {
  createGroup,
  deleteGroup,
  findGroupForEdit,
  listLeaderCandidates,
  readGroupForm,
  updateGroup,
  validateGroup,
  type GroupErrors,
  type GroupForm,
} from '../data/group-admin';
import { listGroups } from '../data/groups';
import { parseId } from '../format';

type AdminPage = (
  c: AppContext,
  props: {
    title: string;
    crumbs?: { label: string; href: string }[];
    children: Child;
    status?: 200 | 422;
  },
) => Promise<Response>;

const groupsCrumb = { label: '小組', href: '/admin/groups' };
type Candidates = Awaited<ReturnType<typeof listLeaderCandidates>>;

function GroupFormView(props: {
  action: string;
  values: GroupForm;
  errors: GroupErrors;
  candidates: Candidates;
  submit: string;
}) {
  const { values, errors } = props;
  const cls = (field: keyof GroupForm, base = 'form-control') =>
    `${base}${errors[field] ? ' is-invalid' : ''}`;
  const feedback = (field: keyof GroupForm) =>
    errors[field] && <div class="invalid-feedback">{errors[field]}</div>;
  return (
    <form method="post" action={props.action} novalidate>
      <div class="mb-3">
        <label class="form-label" for="name">
          小組名稱
        </label>
        <input class={cls('name')} id="name" name="name" value={values.name} />
        {feedback('name')}
      </div>
      <div class="mb-3">
        <label class="form-label" for="introduction">
          簡述
        </label>
        <input
          class={cls('introduction')}
          id="introduction"
          name="introduction"
          value={values.introduction}
        />
        {feedback('introduction')}
      </div>
      <div class="mb-3">
        <label class="form-label" for="description">
          介紹
        </label>
        <textarea class="form-control" id="description" name="description" rows={6}>
          {values.description}
        </textarea>
      </div>
      <div class="mb-3">
        <label class="form-label" for="leaderId">
          組長
        </label>
        <select class={cls('leaderId', 'form-select')} id="leaderId" name="leaderId">
          <option value="">（沒有組長）</option>
          {props.candidates.map((member) => (
            <option value={String(member.id)} selected={values.leaderId === String(member.id)}>
              {member.name}
              {member.email ? `（${member.email}）` : ''}
            </option>
          ))}
        </select>
        {feedback('leaderId')}
        <div class="form-text">只列出已填寫姓名的會友。</div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="sequence">
          排序（數字小的排前面）
        </label>
        <input
          class={cls('sequence')}
          id="sequence"
          name="sequence"
          inputmode="numeric"
          value={values.sequence}
        />
        {feedback('sequence')}
      </div>
      <button type="submit" class="btn btn-purple">
        {props.submit}
      </button>
    </form>
  );
}

/** Routes under /admin/groups; the admin guard is already applied by the caller. */
export function registerGroupRoutes(admin: Hono<AppEnv>, adminPage: AdminPage) {
  admin.get('/groups', async (c) => {
    const list = await listGroups(c.env.DB);
    return adminPage(c, {
      title: '小組',
      crumbs: [groupsCrumb],
      children: (
        <>
          <a class="btn btn-purple mb-3" href="/admin/groups/new">
            <i class="bi bi-plus-lg me-1"></i>新增小組
          </a>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead class="table-light">
                <tr>
                  <th>排序</th>
                  <th>小組名稱</th>
                  <th>組長</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((group) => (
                  <tr>
                    <td>{group.sequence}</td>
                    <td>
                      <a href={`/groups/${group.id}`}>{group.name}</a>
                    </td>
                    <td>{group.leaderName}</td>
                    <td class="text-nowrap">
                      <a
                        class="btn btn-sm btn-outline-primary me-1"
                        href={`/admin/groups/${group.id}/edit`}
                      >
                        編輯
                      </a>
                      <form
                        method="post"
                        action={`/admin/groups/${group.id}/delete`}
                        class="d-inline"
                        onsubmit="return confirm('確定要刪除小組嗎？')"
                      >
                        <button type="submit" class="btn btn-sm btn-outline-danger">
                          刪除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    });
  });

  const empty: GroupForm = {
    name: '',
    introduction: '',
    description: '',
    sequence: '',
    leaderId: '',
  };
  const newCrumbs = [groupsCrumb, { label: '新增', href: '/admin/groups/new' }];

  admin.get('/groups/new', async (c) =>
    adminPage(c, {
      title: '新增小組',
      crumbs: newCrumbs,
      children: (
        <GroupFormView
          action="/admin/groups"
          values={empty}
          errors={{}}
          candidates={await listLeaderCandidates(c.env.DB)}
          submit="新增小組"
        />
      ),
    }),
  );

  admin.post('/groups', async (c) => {
    const form = readGroupForm(await c.req.parseBody());
    const { errors, values } = await validateGroup(c.env.DB, form, null);
    if (!values) {
      return adminPage(c, {
        title: '新增小組',
        crumbs: newCrumbs,
        status: 422,
        children: (
          <GroupFormView
            action="/admin/groups"
            values={form}
            errors={errors}
            candidates={await listLeaderCandidates(c.env.DB)}
            submit="新增小組"
          />
        ),
      });
    }
    await createGroup(c.env.DB, values, c.get('user')!.id);
    setFlash(c, 'notice', '建立小組成功');
    return c.redirect('/admin/groups');
  });

  admin.get('/groups/:id/edit', async (c) => {
    const id = parseId(c.req.param('id'));
    const group = id === null ? undefined : await findGroupForEdit(c.env.DB, id);
    if (!group) return c.notFound();
    return adminPage(c, {
      title: '編輯小組',
      crumbs: [groupsCrumb, { label: group.name, href: `/admin/groups/${group.id}/edit` }],
      children: (
        <GroupFormView
          action={`/admin/groups/${group.id}`}
          values={{
            name: group.name,
            introduction: group.introduction,
            description: group.description ?? '',
            sequence: group.sequence === null ? '' : String(group.sequence),
            leaderId: group.leaderId === null ? '' : String(group.leaderId),
          }}
          errors={{}}
          candidates={await listLeaderCandidates(c.env.DB)}
          submit="更新小組"
        />
      ),
    });
  });

  admin.post('/groups/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    const group = id === null ? undefined : await findGroupForEdit(c.env.DB, id);
    if (!group) return c.notFound();
    const form = readGroupForm(await c.req.parseBody());
    const { errors, values } = await validateGroup(c.env.DB, form, group.id);
    if (!values) {
      return adminPage(c, {
        title: '編輯小組',
        crumbs: [groupsCrumb, { label: group.name, href: `/admin/groups/${group.id}/edit` }],
        status: 422,
        children: (
          <GroupFormView
            action={`/admin/groups/${group.id}`}
            values={form}
            errors={errors}
            candidates={await listLeaderCandidates(c.env.DB)}
            submit="更新小組"
          />
        ),
      });
    }
    await updateGroup(c.env.DB, group.id, values);
    setFlash(c, 'notice', '更新小組成功');
    return c.redirect('/admin/groups');
  });

  admin.post('/groups/:id/delete', async (c) => {
    const id = parseId(c.req.param('id'));
    const group = id === null ? undefined : await findGroupForEdit(c.env.DB, id);
    if (!group) return c.notFound();
    await deleteGroup(c.env.DB, group.id);
    setFlash(c, 'notice', '刪除小組成功');
    return c.redirect('/admin/groups');
  });
}

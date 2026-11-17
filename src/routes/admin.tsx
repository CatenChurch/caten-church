import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Child } from 'hono/jsx';
import { getSettings, setFlash, viewState, type AppContext, type AppEnv } from '../app';
import {
  findEvent,
  listAllEvents,
  readEventForm,
  validateEvent,
  type EventErrors,
  type EventForm,
} from '../data/events';
import { findWeekly, listWeeklies } from '../data/weeklies';
import { events, settingChanges, settings as settingsTable, users, weeklies } from '../db/schema';
import { formatDateTime, fromTaipeiInput, parseId, parsePage, toTaipeiInput } from '../format';
import { DEFAULT_SETTINGS, SETTING_GROUPS, type SettingKey } from '../settings';
import { Page, Pagination } from '../views/layout';
import { registerGroupRoutes } from './admin-groups';
import { IMAGE_SETTINGS, registerImageRoutes } from './admin-images';
import { registerMemberRoutes } from './admin-members';

/** Everything under /admin is for administrators only. */
export const admin = new Hono<AppEnv>();

admin.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    const path = new URL(c.req.url).pathname;
    return c.redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  // Members are told the page does not exist rather than that it is forbidden
  if (!user.isAdmin) return c.notFound();
  await next();
});

const adminCrumb = { label: '後台', href: '/admin' };

async function adminPage(
  c: AppContext,
  props: {
    title: string;
    crumbs?: { label: string; href: string }[];
    children: Child;
    status?: 200 | 422;
  },
) {
  const s = await getSettings(c);
  c.status(props.status ?? 200);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={`${props.title} | 後台`}
      active="account"
      breadcrumb={[adminCrumb, ...(props.crumbs ?? [])]}
      heading={props.title}
      lead={<p class="lead">管理介面</p>}
    >
      <div class="container">{props.children}</div>
    </Page>,
  );
}

admin.get('/', (c) =>
  adminPage(c, {
    title: '後台',
    children: (
      <div class="row row-cols-1 row-cols-md-2 g-3">
        {[
          ['會友', '/admin/members', 'bi-people'],
          ['週報', '/admin/weeklies', 'bi-newspaper'],
          ['活動', '/admin/events', 'bi-calendar-event'],
          ['小組', '/admin/groups', 'bi-diagram-3'],
          ['站台設定', '/admin/settings', 'bi-gear'],
        ].map(([label, href, icon]) => (
          <div class="col">
            <a class="card text-decoration-none text-center p-4 h-100" href={href}>
              <i class={`bi ${icon} fs-1`}></i>
              <h2 class="h4 mt-2 mb-0">{label}</h2>
            </a>
          </div>
        ))}
      </div>
    ),
  }),
);

registerMemberRoutes(admin, adminPage);
registerGroupRoutes(admin, adminPage);
registerImageRoutes(admin);

// --- Weeklies ---

const weekliesCrumb = { label: '週報', href: '/admin/weeklies' };
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface WeeklyForm {
  title: string;
  issue: string;
  publishedAt: string;
}
type WeeklyErrors = Partial<Record<keyof WeeklyForm | 'pdf', string>>;

function WeeklyFormView(props: {
  action: string;
  values: WeeklyForm;
  errors: WeeklyErrors;
  currentPdf?: { href: string; filename: string } | null;
  submit: string;
}) {
  const { values, errors } = props;
  const cls = (field: keyof WeeklyErrors) => `form-control${errors[field] ? ' is-invalid' : ''}`;
  const feedback = (field: keyof WeeklyErrors) =>
    errors[field] && <div class="invalid-feedback">{errors[field]}</div>;
  return (
    <form method="post" action={props.action} enctype="multipart/form-data" novalidate>
      <div class="mb-3">
        <label class="form-label" for="title">
          標題
        </label>
        <input class={cls('title')} id="title" name="title" value={values.title} />
        {feedback('title')}
      </div>
      <div class="mb-3">
        <label class="form-label" for="issue">
          刊號
        </label>
        <input
          class={cls('issue')}
          id="issue"
          name="issue"
          inputmode="numeric"
          value={values.issue}
        />
        {feedback('issue')}
      </div>
      <div class="mb-3">
        <label class="form-label" for="publishedAt">
          發布時間（台灣時間）
        </label>
        <input
          class={cls('publishedAt')}
          id="publishedAt"
          name="publishedAt"
          type="datetime-local"
          value={values.publishedAt}
        />
        {feedback('publishedAt')}
      </div>
      <div class="mb-3">
        {props.currentPdf && (
          <p>
            目前的 PDF：<a href={props.currentPdf.href}>{props.currentPdf.filename}</a>
          </p>
        )}
        <label class="form-label" for="pdf">
          {props.currentPdf ? '上傳新的 PDF（不選則保留目前的）' : 'PDF'}
        </label>
        <input class={cls('pdf')} id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" />
        {feedback('pdf')}
      </div>
      <button type="submit" class="btn btn-purple">
        {props.submit}
      </button>
    </form>
  );
}

/** Reads and validates the weekly form. A PDF is required unless the weekly already has one. */
async function readWeeklyForm(c: AppContext, pdfRequired: boolean) {
  const form = await c.req.parseBody();
  const str = (key: string) => (typeof form[key] === 'string' ? form[key].trim() : '');
  const values: WeeklyForm = {
    title: str('title'),
    issue: str('issue'),
    publishedAt: str('publishedAt'),
  };
  const errors: WeeklyErrors = {};
  if (!values.title) errors.title = '請填寫標題';
  if (!/^\d{1,9}$/.test(values.issue)) errors.issue = '刊號需為數字';
  const publishedAt = fromTaipeiInput(values.publishedAt);
  if (!publishedAt) errors.publishedAt = '請填寫發布時間';

  const file = form.pdf instanceof File && form.pdf.size > 0 ? form.pdf : null;
  let pdf: { bytes: ArrayBuffer; filename: string } | null = null;
  if (!file) {
    if (pdfRequired) errors.pdf = '需附加檔案';
  } else if (file.size > MAX_PDF_BYTES) {
    errors.pdf = `檔案須小於 ${MAX_PDF_BYTES / 1024 / 1024} MB`;
  } else {
    const bytes = await file.arrayBuffer();
    // Trust the content, not the name or the declared type
    const head = new TextDecoder().decode(bytes.slice(0, 5));
    if (head !== '%PDF-') errors.pdf = '檔案類型須為 PDF';
    else pdf = { bytes, filename: file.name || 'weekly.pdf' };
  }
  return { values, errors, publishedAt, pdf };
}

async function storePdf(c: AppContext, id: number, pdf: { bytes: ArrayBuffer; filename: string }) {
  const key = `weeklies/${id}.pdf`;
  await c.env.FILES.put(key, pdf.bytes, { httpMetadata: { contentType: 'application/pdf' } });
  return { pdfKey: key, pdfFilename: pdf.filename, pdfSize: pdf.bytes.byteLength };
}

admin.get('/weeklies', async (c) => {
  const page = parsePage(c.req.query('page'));
  const list = await listWeeklies(c.env.DB, page);
  const pagination = <Pagination page={page} totalPages={list.totalPages} path="/admin/weeklies" />;
  return adminPage(c, {
    title: '週報',
    crumbs: [weekliesCrumb],
    children: (
      <>
        <a class="btn btn-purple mb-3" href="/admin/weeklies/new">
          <i class="bi bi-plus-lg me-1"></i>新增週報
        </a>
        {pagination}
        <div class="table-responsive">
          <table class="table align-middle">
            <thead class="table-light">
              <tr>
                <th>編號</th>
                <th>標題</th>
                <th>刊號</th>
                <th>瀏覽次數</th>
                <th>發布時間</th>
                <th>PDF</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((weekly) => (
                <tr>
                  <td>{weekly.id}</td>
                  <td>{weekly.title}</td>
                  <td>{weekly.issue}</td>
                  <td>{weekly.viewedCount}</td>
                  <td>{formatDateTime(weekly.publishedAt)}</td>
                  <td>{weekly.pdfKey ? '有' : <span class="text-danger">沒有</span>}</td>
                  <td class="text-nowrap">
                    <a
                      class="btn btn-sm btn-outline-primary me-1"
                      href={`/admin/weeklies/${weekly.id}/edit`}
                    >
                      編輯
                    </a>
                    <form
                      method="post"
                      action={`/admin/weeklies/${weekly.id}/delete`}
                      class="d-inline"
                      onsubmit="return confirm('確定要刪除這期週報嗎？PDF 也會一併刪除。')"
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
        {pagination}
      </>
    ),
  });
});

admin.get('/weeklies/new', (c) =>
  adminPage(c, {
    title: '新增週報',
    crumbs: [weekliesCrumb, { label: '新增', href: '/admin/weeklies/new' }],
    children: (
      <WeeklyFormView
        action="/admin/weeklies"
        values={{ title: '', issue: '', publishedAt: toTaipeiInput(new Date().toISOString()) }}
        errors={{}}
        submit="新增週報"
      />
    ),
  }),
);

admin.post('/weeklies', async (c) => {
  const { values, errors, publishedAt, pdf } = await readWeeklyForm(c, true);
  if (Object.keys(errors).length > 0 || !publishedAt || !pdf) {
    return adminPage(c, {
      title: '新增週報',
      crumbs: [weekliesCrumb, { label: '新增', href: '/admin/weeklies/new' }],
      status: 422,
      children: (
        <WeeklyFormView
          action="/admin/weeklies"
          values={values}
          errors={errors}
          submit="新增週報"
        />
      ),
    });
  }
  const db = drizzle(c.env.DB);
  const [created] = await db
    .insert(weeklies)
    .values({ title: values.title, issue: Number(values.issue), publishedAt })
    .returning({ id: weeklies.id });
  const id = created!.id;
  await db
    .update(weeklies)
    .set(await storePdf(c, id, pdf))
    .where(eq(weeklies.id, id));
  setFlash(c, 'notice', '新增週報成功');
  return c.redirect('/admin/weeklies');
});

admin.get('/weeklies/:id/edit', async (c) => {
  const id = parseId(c.req.param('id'));
  const weekly = id === null ? undefined : await findWeekly(c.env.DB, id);
  if (!weekly) return c.notFound();
  return adminPage(c, {
    title: '編輯週報',
    crumbs: [weekliesCrumb, { label: weekly.title, href: `/admin/weeklies/${weekly.id}/edit` }],
    children: (
      <WeeklyFormView
        action={`/admin/weeklies/${weekly.id}`}
        values={{
          title: weekly.title,
          issue: String(weekly.issue),
          publishedAt: toTaipeiInput(weekly.publishedAt),
        }}
        errors={{}}
        currentPdf={
          weekly.pdfKey
            ? { href: `/weeklies/${weekly.id}.pdf`, filename: weekly.pdfFilename ?? 'PDF' }
            : null
        }
        submit="更新週報"
      />
    ),
  });
});

admin.post('/weeklies/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const weekly = id === null ? undefined : await findWeekly(c.env.DB, id);
  if (!weekly) return c.notFound();
  const currentPdf = weekly.pdfKey
    ? { href: `/weeklies/${weekly.id}.pdf`, filename: weekly.pdfFilename ?? 'PDF' }
    : null;
  const { values, errors, publishedAt, pdf } = await readWeeklyForm(c, !weekly.pdfKey);
  if (Object.keys(errors).length > 0 || !publishedAt) {
    return adminPage(c, {
      title: '編輯週報',
      crumbs: [weekliesCrumb, { label: weekly.title, href: `/admin/weeklies/${weekly.id}/edit` }],
      status: 422,
      children: (
        <WeeklyFormView
          action={`/admin/weeklies/${weekly.id}`}
          values={values}
          errors={errors}
          currentPdf={currentPdf}
          submit="更新週報"
        />
      ),
    });
  }
  await drizzle(c.env.DB)
    .update(weeklies)
    .set({
      title: values.title,
      issue: Number(values.issue),
      publishedAt,
      updatedAt: new Date().toISOString(),
      ...(pdf ? await storePdf(c, weekly.id, pdf) : {}),
    })
    .where(eq(weeklies.id, weekly.id));
  setFlash(c, 'notice', '更新週報成功');
  return c.redirect('/admin/weeklies');
});

admin.post('/weeklies/:id/delete', async (c) => {
  const id = parseId(c.req.param('id'));
  const weekly = id === null ? undefined : await findWeekly(c.env.DB, id);
  if (!weekly) return c.notFound();
  await drizzle(c.env.DB).delete(weeklies).where(eq(weeklies.id, weekly.id));
  if (weekly.pdfKey) await c.env.FILES.delete(weekly.pdfKey);
  setFlash(c, 'notice', '刪除週報成功');
  return c.redirect('/admin/weeklies');
});

// --- Events ---

const eventsCrumb = { label: '活動', href: '/admin/events' };

function EventFormView(props: {
  action: string;
  values: EventForm;
  errors: EventErrors;
  submit: string;
}) {
  const { values, errors } = props;
  const cls = (field: keyof EventForm) => `form-control${errors[field] ? ' is-invalid' : ''}`;
  const feedback = (field: keyof EventForm) =>
    errors[field] && <div class="invalid-feedback">{errors[field]}</div>;
  return (
    <form method="post" action={props.action} novalidate>
      <div class="mb-3">
        <label class="form-label" for="name">
          活動名稱
        </label>
        <input class={cls('name')} id="name" name="name" value={values.name} />
        {feedback('name')}
      </div>
      <div class="mb-3">
        <label class="form-label" for="description">
          簡述
        </label>
        <input
          class={cls('description')}
          id="description"
          name="description"
          value={values.description}
          placeholder="簡單描述一下活動的內容"
        />
      </div>
      <div class="mb-3">
        <label class="form-label" for="content">
          內容
        </label>
        <textarea class={cls('content')} id="content" name="content" rows={8}>
          {values.content}
        </textarea>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label" for="start">
            活動開始（台灣時間）
          </label>
          <input
            class={cls('start')}
            id="start"
            name="start"
            type="datetime-local"
            value={values.start}
          />
          {feedback('start')}
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label" for="over">
            活動結束（台灣時間）
          </label>
          <input
            class={cls('over')}
            id="over"
            name="over"
            type="datetime-local"
            value={values.over}
          />
          {feedback('over')}
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="signupUrl">
          報名表單連結（例如 Google 表單；不需要報名就留空）
        </label>
        <input
          class={cls('signupUrl')}
          id="signupUrl"
          name="signupUrl"
          type="url"
          value={values.signupUrl}
          placeholder="https://forms.gle/..."
        />
        {feedback('signupUrl')}
      </div>
      <button type="submit" class="btn btn-purple">
        {props.submit}
      </button>
    </form>
  );
}

admin.get('/events', async (c) => {
  const list = await listAllEvents(c.env.DB);
  return adminPage(c, {
    title: '活動',
    crumbs: [eventsCrumb],
    children: (
      <>
        <a class="btn btn-purple mb-3" href="/admin/events/new">
          <i class="bi bi-plus-lg me-1"></i>新增活動
        </a>
        <div class="table-responsive">
          <table class="table align-middle">
            <thead class="table-light">
              <tr>
                <th>活動名稱</th>
                <th>活動時間</th>
                <th>報名表單</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((event) => (
                <tr>
                  <td>
                    <a href={`/events/${event.id}`}>{event.name}</a>
                  </td>
                  <td>
                    {formatDateTime(event.start)} ~ {formatDateTime(event.over)}
                  </td>
                  <td>{event.signupUrl ? '有' : '沒有'}</td>
                  <td class="text-nowrap">
                    <a
                      class="btn btn-sm btn-outline-primary me-1"
                      href={`/admin/events/${event.id}/edit`}
                    >
                      編輯
                    </a>
                    <form
                      method="post"
                      action={`/admin/events/${event.id}/delete`}
                      class="d-inline"
                      onsubmit="return confirm('確定要刪除這個活動嗎？')"
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

const emptyEvent: EventForm = {
  name: '',
  description: '',
  content: '',
  start: '',
  over: '',
  signupUrl: '',
};

admin.get('/events/new', (c) =>
  adminPage(c, {
    title: '新增活動',
    crumbs: [eventsCrumb, { label: '新增', href: '/admin/events/new' }],
    children: (
      <EventFormView action="/admin/events" values={emptyEvent} errors={{}} submit="新增活動" />
    ),
  }),
);

admin.post('/events', async (c) => {
  const form = readEventForm(await c.req.parseBody());
  const { errors, values } = validateEvent(form);
  if (!values) {
    return adminPage(c, {
      title: '新增活動',
      crumbs: [eventsCrumb, { label: '新增', href: '/admin/events/new' }],
      status: 422,
      children: (
        <EventFormView action="/admin/events" values={form} errors={errors} submit="新增活動" />
      ),
    });
  }
  await drizzle(c.env.DB)
    .insert(events)
    .values({ ...values, organizerId: c.get('user')!.id });
  setFlash(c, 'notice', '新增活動成功');
  return c.redirect('/admin/events');
});

admin.get('/events/:id/edit', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  return adminPage(c, {
    title: '編輯活動',
    crumbs: [eventsCrumb, { label: event.name, href: `/admin/events/${event.id}/edit` }],
    children: (
      <EventFormView
        action={`/admin/events/${event.id}`}
        values={{
          name: event.name,
          description: event.description ?? '',
          content: event.content ?? '',
          start: toTaipeiInput(event.start),
          over: toTaipeiInput(event.over),
          signupUrl: event.signupUrl ?? '',
        }}
        errors={{}}
        submit="更新活動"
      />
    ),
  });
});

admin.post('/events/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const form = readEventForm(await c.req.parseBody());
  const { errors, values } = validateEvent(form);
  if (!values) {
    return adminPage(c, {
      title: '編輯活動',
      crumbs: [eventsCrumb, { label: event.name, href: `/admin/events/${event.id}/edit` }],
      status: 422,
      children: (
        <EventFormView
          action={`/admin/events/${event.id}`}
          values={form}
          errors={errors}
          submit="更新活動"
        />
      ),
    });
  }
  await drizzle(c.env.DB)
    .update(events)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(events.id, event.id));
  setFlash(c, 'notice', '更新活動成功');
  return c.redirect('/admin/events');
});

admin.post('/events/:id/delete', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  await drizzle(c.env.DB).delete(events).where(eq(events.id, event.id));
  setFlash(c, 'notice', '刪除活動成功');
  return c.redirect('/admin/events');
});

// --- Site settings ---

const settingsCrumb = { label: '站台設定', href: '/admin/settings' };

admin.get('/settings', async (c) => {
  const db = drizzle(c.env.DB);
  const [current, changes] = await Promise.all([
    getSettings(c),
    db
      .select({
        key: settingChanges.key,
        oldValue: settingChanges.oldValue,
        newValue: settingChanges.newValue,
        createdAt: settingChanges.createdAt,
        email: users.email,
      })
      .from(settingChanges)
      .leftJoin(users, eq(users.id, settingChanges.userId))
      .orderBy(desc(settingChanges.id))
      .limit(20),
  ]);
  const labels = Object.fromEntries(
    SETTING_GROUPS.flatMap((group) => group.fields.map((f) => [f.key, f.label])),
  );
  return adminPage(c, {
    title: '站台設定',
    crumbs: [settingsCrumb],
    children: (
      <>
        <form method="post" action="/admin/settings">
          {SETTING_GROUPS.map((group) => (
            <fieldset class="card mb-4">
              <legend class="card-header h5 mb-0">{group.title}</legend>
              <div class="card-body">
                {group.note && <p class="text-danger small">{group.note}</p>}
                {group.fields.map((field) => (
                  <div class="mb-3">
                    <label class="form-label" for={field.key}>
                      {field.label}
                    </label>
                    <input
                      class="form-control"
                      id={field.key}
                      name={field.key}
                      value={current[field.key]}
                      placeholder={DEFAULT_SETTINGS[field.key]}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
          <p class="text-muted small">欄位留空會恢復成預設值。</p>
          <button type="submit" class="btn btn-purple">
            儲存設定
          </button>
        </form>
        <h2 class="h4 mt-5">更換圖片</h2>
        <p class="text-muted small">接受 PNG、JPEG、WebP，上限 2 MB。上傳後立即生效。</p>
        <div class="row row-cols-1 row-cols-md-3 g-3">
          {IMAGE_SETTINGS.map((image) => (
            <div class="col">
              <div class="card h-100">
                <div class="card-header">{image.label}</div>
                <div class="card-body">
                  <img
                    src={current[image.key]}
                    alt={`目前的${image.label}`}
                    class="img-fluid mb-2"
                    style="max-height: 120px"
                  />
                  <p class="small text-muted">{image.hint}</p>
                  <form
                    method="post"
                    action="/admin/settings/image"
                    enctype="multipart/form-data"
                    class="d-grid gap-2"
                  >
                    <input type="hidden" name="key" value={image.key} />
                    <input
                      class="form-control form-control-sm"
                      type="file"
                      name="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`選擇新的${image.label}`}
                      required
                    />
                    <button type="submit" class="btn btn-sm btn-purple">
                      上傳
                    </button>
                  </form>
                  {current[image.key] !== DEFAULT_SETTINGS[image.key] && (
                    <form method="post" action="/admin/settings/image/reset" class="d-grid mt-2">
                      <input type="hidden" name="key" value={image.key} />
                      <button type="submit" class="btn btn-sm btn-outline-secondary">
                        恢復預設
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <h2 class="h4 mt-5">最近的修改紀錄</h2>
        {changes.length === 0 ? (
          <p class="text-muted">還沒有修改過</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>時間</th>
                  <th>項目</th>
                  <th>原本</th>
                  <th>改成</th>
                  <th>修改者</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr>
                    <td class="text-nowrap">{formatDateTime(change.createdAt)}</td>
                    <td>{labels[change.key] ?? change.key}</td>
                    <td class="text-break">{change.oldValue}</td>
                    <td class="text-break">{change.newValue}</td>
                    <td>{change.email ?? '（已刪除的帳號）'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    ),
  });
});

admin.post('/settings', async (c) => {
  const form = await c.req.parseBody();
  const current = await getSettings(c);
  const userId = c.get('user')!.id;
  const db = drizzle(c.env.DB);
  const keys = SETTING_GROUPS.flatMap((group) => group.fields.map((f) => f.key));

  // Links and image addresses end up in href/src attributes: only https or same-site paths
  const badUrls = keys.filter((key) => {
    const value = typeof form[key] === 'string' ? form[key].trim() : '';
    return key.endsWith('Url') && value !== '' && !/^(https:\/\/|\/(?!\/))/.test(value);
  });
  if (badUrls.length > 0) {
    setFlash(c, 'alert', '網址必須以 https:// 或 / 開頭，沒有儲存任何變更');
    return c.redirect('/admin/settings');
  }

  let changed = 0;
  for (const key of keys) {
    const submitted = form[key];
    if (typeof submitted !== 'string') continue;
    // An empty field means "use the default again"
    const value = submitted.trim() || DEFAULT_SETTINGS[key];
    if (value === current[key]) continue;
    changed += 1;
    const change = db
      .insert(settingChanges)
      .values({ key, oldValue: current[key], newValue: value, userId });
    if (value === DEFAULT_SETTINGS[key]) {
      await db.batch([change, db.delete(settingsTable).where(eq(settingsTable.key, key))]);
    } else {
      const row = { value, updatedBy: userId, updatedAt: new Date().toISOString() };
      await db.batch([
        change,
        db
          .insert(settingsTable)
          .values({ key: key satisfies SettingKey, ...row })
          .onConflictDoUpdate({ target: settingsTable.key, set: row }),
      ]);
    }
  }
  setFlash(c, 'notice', changed > 0 ? `已更新 ${changed} 項設定` : '沒有變更');
  return c.redirect('/admin/settings');
});

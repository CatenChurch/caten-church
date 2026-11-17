import { Hono } from 'hono';
import { getSettings, setFlash, viewState, type AppEnv } from '../app';
import {
  isOpenForRegistration,
  isRegistered,
  joinEvent,
  listParticipantNames,
  quitEvent,
} from '../data/registrations';
import {
  findEvent,
  listExpiredEvents,
  listOpenEvents,
  shownParticipantsCount,
  type EventSummary,
} from '../data/events';
import { formatDateTime, formatEventDate, parseId, parsePage } from '../format';
import { Page, Pagination, SimpleFormat } from '../views/layout';

export const events = new Hono<AppEnv>();

const crumb = { label: '活動專區', href: '/events' };
const description = '點選活動以報名與查看詳情。';

function EventCard({ event }: { event: EventSummary }) {
  return (
    <a class="text-decoration-none" href={`/events/${event.id}`}>
      <div class="card event-card">
        <div class="card-body">
          <h3 class="card-title">{event.name}</h3>
          <div class="card-text text-start">
            <SimpleFormat text={event.description} />
          </div>
        </div>
        <div class="card-footer d-flex justify-content-between">
          <span>{formatEventDate(event.start)}</span>
          <span>報名人數 : {shownParticipantsCount(event)}</span>
        </div>
      </div>
    </a>
  );
}

function EventGrid({ events: list }: { events: EventSummary[] }) {
  if (list.length === 0) return <p class="text-muted">目前沒有活動</p>;
  return (
    <div class="row">
      {list.map((event) => (
        <div class="col-12 col-md-4 my-2">
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

events.get('/', async (c) => {
  const page = parsePage(c.req.query('page'));
  const [s, open, expired] = await Promise.all([
    getSettings(c),
    listOpenEvents(c.env.DB),
    listExpiredEvents(c.env.DB, page),
  ]);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="活動專區"
      description={description}
      active="events"
      breadcrumb={[crumb]}
      heading="活動專區"
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
        <h2>
          當前的活動 <span class="badge text-bg-primary ms-2">New</span>
        </h2>
        <EventGrid events={open} />
        <hr />
        <h2>過期的活動</h2>
        <EventGrid events={expired.rows} />
        <Pagination page={page} totalPages={expired.totalPages} path="/events" />
      </div>
    </Page>,
  );
});

events.get('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const s = await getSettings(c);
  const user = c.get('user');
  const open = isOpenForRegistration(event);
  const joined = user ? await isRegistered(c.env.DB, event.id, user.id) : false;
  const full = event.participantsCount >= event.maxSignUpNumber;
  const facts: [string, string | number | null][] = [
    ['簡述', event.description],
    ['報名人數', shownParticipantsCount(event)],
    ['成立人數', event.minSignUpNumber],
    ['人數上限', event.maxSignUpNumber],
    ['報名開始', formatDateTime(event.signUpBegin)],
    ['報名截止', formatDateTime(event.signUpEnd)],
    ['活動開始', formatDateTime(event.start)],
    ['活動結束', formatDateTime(event.over)],
    ['確認報到', event.checkArrival ? '需要確認報到' : '不需要確認報到'],
    ['報名費用', event.registrationFee || '免費'],
  ];
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={event.name}
      description={event.description ?? undefined}
      active="events"
      breadcrumb={[crumb, { label: event.name, href: `/events/${event.id}` }]}
      heading="活動專區"
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
        <a class="btn btn-outline-secondary mb-4" href="/events">
          活動列表
        </a>
        <div class="card">
          <div class="card-body">
            <h3 class="card-title">{event.name}</h3>
            <div class="card-text my-4">
              <SimpleFormat text={event.content} />
            </div>
            <table class="table table-bordered">
              <tbody>
                {facts.map(([label, value]) => (
                  <tr>
                    <th class="bg-light w-25">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div class="card-body d-flex flex-wrap gap-2 align-items-center">
            {joined && <span class="badge text-bg-success fs-6">已報名</span>}
            {joined && open && (
              <form method="post" action={`/events/${event.id}/quit`}>
                <button type="submit" class="btn btn-warning">
                  取消報名
                </button>
              </form>
            )}
            {joined && event.showParticipants && (
              <a class="btn btn-outline-dark" href={`/events/${event.id}/participants`}>
                看有誰報名
              </a>
            )}
            {!joined && open && full && <span class="text-danger">報名人數已滿</span>}
            {!joined && open && !full && user && (
              <form
                method="post"
                action={`/events/${event.id}/join`}
                class="d-flex flex-wrap gap-2 align-items-center flex-grow-1"
              >
                <label class="form-label mb-0" for="remark">
                  備註
                </label>
                <input
                  class="form-control w-auto flex-grow-1"
                  id="remark"
                  name="remark"
                  maxlength={200}
                />
                <button type="submit" class="btn btn-success">
                  報名活動
                </button>
              </form>
            )}
            {!joined && open && !full && !user && (
              <a class="btn btn-success" href={`/login?next=/events/${event.id}`}>
                登入後報名
              </a>
            )}
            {!open && <span class="text-muted">目前不在報名時間內</span>}
          </div>
        </div>
      </div>
    </Page>,
  );
});

events.post('/:id/join', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const user = c.get('user');
  if (!user) return c.redirect(`/login?next=/events/${event.id}`);

  const form = await c.req.parseBody();
  const remark = typeof form.remark === 'string' ? form.remark : '';
  const result = await joinEvent(c.env.DB, event, user.id, remark);
  if (result === 'profile_incomplete') {
    setFlash(c, 'alert', '報名活動前需要完整的個人資料（含身分證字號與緊急聯絡人電話）');
    return c.redirect(`/account/profile/edit?event=${event.id}`);
  }
  const messages = {
    joined: ['notice', '報名活動成功'],
    closed: ['alert', '目前不在報名時間內'],
    full: ['alert', '報名人數已滿'],
    already_joined: ['alert', '你已經報名過這個活動了'],
  } as const;
  const [type, message] = messages[result];
  setFlash(c, type, message);
  return c.redirect(`/events/${event.id}`);
});

events.post('/:id/quit', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const user = c.get('user');
  if (!user) return c.redirect(`/login?next=/events/${event.id}`);

  const result = await quitEvent(c.env.DB, event, user.id);
  const messages = {
    quit: ['notice', '取消報名活動成功'],
    closed: ['alert', '目前不在報名時間內'],
    not_joined: ['alert', '你沒有報名這個活動'],
  } as const;
  const [type, message] = messages[result];
  setFlash(c, type, message);
  return c.redirect(`/events/${event.id}`);
});

events.get('/:id/participants', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const user = c.get('user');
  if (!event.showParticipants) {
    setFlash(c, 'alert', '報名情況未公開');
    return c.redirect(`/events/${event.id}`);
  }
  if (!user || !(await isRegistered(c.env.DB, event.id, user.id))) {
    setFlash(c, 'alert', '報名活動後才能觀看報名情況');
    return c.redirect(`/events/${event.id}`);
  }
  const [s, names] = await Promise.all([getSettings(c), listParticipantNames(c.env.DB, event.id)]);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={`${event.name} 報名者`}
      active="events"
      breadcrumb={[
        crumb,
        { label: event.name, href: `/events/${event.id}` },
        { label: '報名者', href: `/events/${event.id}/participants` },
      ]}
      heading="活動專區"
      lead={<p class="lead">{event.name} 的報名者</p>}
    >
      <div class="container">
        <a class="btn btn-outline-secondary mb-3" href={`/events/${event.id}`}>
          返回
        </a>
        <ul class="list-group">
          {names.map((row) => (
            <li class="list-group-item">{row.name ?? '（未填姓名）'}</li>
          ))}
        </ul>
      </div>
    </Page>,
  );
});

import { Hono } from 'hono';
import { getSettings, type AppEnv } from '../app';
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
        </div>
      </div>
    </Page>,
  );
});

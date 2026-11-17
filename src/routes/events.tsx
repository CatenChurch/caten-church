import { Hono } from 'hono';
import { getSettings, viewState, type AppEnv } from '../app';
import { findEvent, listPastEvents, listUpcomingEvents, type Event } from '../data/events';
import { formatDateTime, formatEventDate, parseId, parsePage } from '../format';
import { Page, Pagination, SimpleFormat } from '../views/layout';

export const events = new Hono<AppEnv>();

const crumb = { label: '活動專區', href: '/events' };
const description = '教會的活動消息，點選活動查看詳情與報名方式。';

function EventCard({ event }: { event: Event }) {
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
          {event.signupUrl && <span>開放報名</span>}
        </div>
      </div>
    </a>
  );
}

function EventGrid({ events: list }: { events: Event[] }) {
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
  const [s, upcoming, past] = await Promise.all([
    getSettings(c),
    listUpcomingEvents(c.env.DB),
    listPastEvents(c.env.DB, page),
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
          即將到來的活動 <span class="badge text-bg-primary ms-2">New</span>
        </h2>
        <EventGrid events={upcoming} />
        <hr />
        <h2>過去的活動</h2>
        <EventGrid events={past.rows} />
        <Pagination page={page} totalPages={past.totalPages} path="/events" />
      </div>
    </Page>,
  );
});

events.get('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const event = id === null ? undefined : await findEvent(c.env.DB, id);
  if (!event) return c.notFound();
  const s = await getSettings(c);
  const ended = event.over < new Date().toISOString();
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={event.name}
      description={event.description ?? undefined}
      active="events"
      breadcrumb={[crumb, { label: event.name, href: `/events/${event.id}` }]}
      heading="活動專區"
      lead={<p class="lead">{event.name}</p>}
    >
      <div class="container">
        <a class="btn btn-outline-secondary mb-4" href="/events">
          活動列表
        </a>
        <div class="card">
          <div class="card-body">
            <h3 class="card-title">{event.name}</h3>
            {event.description && <p class="text-muted">{event.description}</p>}
            <div class="card-text my-4">
              <SimpleFormat text={event.content} />
            </div>
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th class="bg-light w-25">活動開始</th>
                  <td>{formatDateTime(event.start)}</td>
                </tr>
                <tr>
                  <th class="bg-light w-25">活動結束</th>
                  <td>{formatDateTime(event.over)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {event.signupUrl && (
            <div class="card-body">
              {ended ? (
                <span class="text-muted">活動已結束</span>
              ) : (
                <a
                  class="btn btn-success"
                  href={event.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i class="bi bi-box-arrow-up-right me-1"></i>前往報名表單
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>,
  );
});

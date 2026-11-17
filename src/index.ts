import { Hono } from 'hono';
import type { AppEnv } from './app';
import { events } from './routes/events';
import { groups } from './routes/groups';
import { pages } from './routes/pages';
import { weeklies } from './routes/weeklies';

const app = new Hono<AppEnv>();

app.route('/', pages);
app.route('/weeklies', weeklies);
app.route('/groups', groups);
app.route('/events', events);

app.get('/up', (c) => c.text('ok'));

export default app;

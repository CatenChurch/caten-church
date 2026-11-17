import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { takeFlash, type AppEnv } from './app';
import { auth } from './auth/routes';
import { loadCurrentUser } from './auth/sessions';
import { account } from './routes/account';
import { admin } from './routes/admin';
import { sendBirthdayList } from './jobs';
import { sendGridSender } from './mail';
import { events } from './routes/events';
import { groups } from './routes/groups';
import { pages } from './routes/pages';
import { site } from './routes/site';
import { weeklies } from './routes/weeklies';

const app = new Hono<AppEnv>();

app.get('/up', (c) => c.text('ok'));

// Only the real domain should be in search results, not the workers.dev preview address
app.use('*', async (c, next) => {
  await next();
  const official = c.env.SITE_URL ? new URL(c.env.SITE_URL).hostname : null;
  if (official && new URL(c.req.url).hostname !== official) {
    c.header('X-Robots-Tag', 'noindex, nofollow');
  }
});

// Form posts must come from this site (checks the Origin header)
app.use('*', csrf());

// Who is signed in, and the one-time message left by the previous request
app.use('*', async (c, next) => {
  c.set('user', await loadCurrentUser(c));
  c.set('flash', takeFlash(c));
  await next();
});

app.route('/', pages);
app.route('/', site);
app.route('/', auth);
app.route('/account', account);
app.route('/admin', admin);
app.route('/weeklies', weeklies);
app.route('/groups', groups);
app.route('/events', events);

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      sendBirthdayList(
        env.DB,
        sendGridSender(env),
        env.SITE_URL || 'https://caten-church.org',
        new Date(controller.scheduledTime),
      ).then((result) => console.log('birthday list', JSON.stringify(result))),
    );
  },
} satisfies ExportedHandler<Env>;

import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { takeFlash, type AppEnv } from './app';
import { auth } from './auth/routes';
import { loadCurrentUser } from './auth/sessions';
import { account } from './routes/account';
import { runDailyJobs } from './jobs';
import { sendGridSender } from './mail';
import { events } from './routes/events';
import { groups } from './routes/groups';
import { pages } from './routes/pages';
import { weeklies } from './routes/weeklies';

const app = new Hono<AppEnv>();

app.get('/up', (c) => c.text('ok'));

// Form posts must come from this site (checks the Origin header)
app.use('*', csrf());

// Who is signed in, and the one-time message left by the previous request
app.use('*', async (c, next) => {
  c.set('user', await loadCurrentUser(c));
  c.set('flash', takeFlash(c));
  await next();
});

app.route('/', pages);
app.route('/', auth);
app.route('/account', account);
app.route('/weeklies', weeklies);
app.route('/groups', groups);
app.route('/events', events);

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    const siteUrl = env.SITE_URL || 'https://caten-church.org';
    ctx.waitUntil(
      runDailyJobs(env.DB, sendGridSender(env), siteUrl, new Date(controller.scheduledTime)).then(
        (result) => console.log('daily jobs', JSON.stringify(result)),
      ),
    );
  },
} satisfies ExportedHandler<Env>;

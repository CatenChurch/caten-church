import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeEach } from 'vitest';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// D1 is shared by the tests in a file; start each test from empty tables.
beforeEach(async () => {
  await env.DB.batch(
    [
      'DELETE FROM settings',
      'DELETE FROM sessions',
      'DELETE FROM event_users',
      'DELETE FROM events',
      'DELETE FROM group_users',
      'DELETE FROM groups',
      'DELETE FROM weeklies',
      'DELETE FROM subscriptions',
      'DELETE FROM profiles',
      'DELETE FROM oauth_accounts',
      'DELETE FROM users',
    ].map((sql) => env.DB.prepare(sql)),
  );
});

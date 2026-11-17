import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeEach } from 'vitest';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// D1 and R2 are shared by the tests in a file; start each test from empty tables and an empty bucket.
beforeEach(async () => {
  const stored = await env.FILES.list();
  if (stored.objects.length > 0) await env.FILES.delete(stored.objects.map((object) => object.key));
  await env.DB.batch(
    [
      'DELETE FROM setting_changes',
      'DELETE FROM settings',
      'DELETE FROM sessions',
      'DELETE FROM weeklies',
      'DELETE FROM profiles',
      'DELETE FROM oauth_accounts',
      'DELETE FROM users',
    ].map((sql) => env.DB.prepare(sql)),
  );
});

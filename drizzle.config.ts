import { defineConfig } from 'drizzle-kit';

// Only used to generate SQL migrations from src/db/schema.ts (`pnpm db:generate`).
// Wrangler applies them to D1.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
});

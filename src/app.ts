import type { Context } from 'hono';
import { loadSettings, type Settings } from './settings';

export interface AppEnv {
  Bindings: Env;
  Variables: { settings?: Settings };
}

export type AppContext = Context<AppEnv>;

/** Site settings for this request, read from D1 once. */
export async function getSettings(c: AppContext) {
  let settings = c.get('settings');
  if (!settings) {
    settings = await loadSettings(c.env.DB);
    c.set('settings', settings);
  }
  return settings;
}

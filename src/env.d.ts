// Secrets and local-only variables that are not in wrangler.jsonc (see .dev.vars.example).
// A sign-in provider is offered only when both of its values are set.
interface OptionalEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;
  /** SendGrid API key; without it no mail is sent. */
  SENDGRID_API_KEY?: string;
  /** Sender, e.g. `茄典教會 <notify@caten-church.org>` (the default). */
  MAIL_FROM?: string;
  /** Public address used in links inside emails, e.g. `https://caten-church.org`. */
  SITE_URL?: string;
  /** `true` enables the localhost-only development sign-in. Never set in production. */
  DEV_LOGIN?: string;
}

interface Env extends OptionalEnv {}

declare namespace Cloudflare {
  interface Env extends OptionalEnv {}
}

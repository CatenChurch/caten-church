export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends one email; resolves to false when it could not be sent. */
export type MailSender = (mail: Mail) => Promise<boolean>;

const DEFAULT_FROM = '茄典教會 <notify@caten-church.org>';

function parseFrom(from: string) {
  const match = /^\s*(.*?)\s*<([^<>]+)>\s*$/.exec(from);
  return match ? { name: match[1], email: match[2]! } : { email: from.trim() };
}

/** Sends through SendGrid's HTTP API. Without an API key nothing is sent (local development). */
export function sendGridSender(env: Env): MailSender {
  return async (mail) => {
    if (!env.SENDGRID_API_KEY) {
      console.warn(`mail not sent (no SENDGRID_API_KEY): "${mail.subject}"`);
      return false;
    }
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: mail.to }] }],
        from: parseFrom(env.MAIL_FROM || DEFAULT_FROM),
        subject: mail.subject,
        content: [
          { type: 'text/plain', value: mail.text },
          { type: 'text/html', value: mail.html },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`mail failed: HTTP ${response.status} for "${mail.subject}"`);
      return false;
    }
    return true;
  };
}

export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );

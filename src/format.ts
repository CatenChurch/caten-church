const TAIPEI = 'Asia/Taipei';

function parts(iso: string, options: Intl.DateTimeFormatOptions) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: TAIPEI,
    hourCycle: 'h23',
    ...options,
  }).formatToParts(new Date(iso));
  return Object.fromEntries(formatted.map((p) => [p.type, p.value]));
}

/** `2026-11-17 11:00` in Taipei time (the Rails site's default time format). */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '';
  const p = parts(iso, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** `2026/11/17 週二` in Taipei time (the Rails site's `:event` format). */
export function formatEventDate(iso: string | null | undefined) {
  if (!iso) return '';
  const p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const weekday = new Intl.DateTimeFormat('zh-TW', { timeZone: TAIPEI, weekday: 'short' }).format(
    new Date(iso),
  );
  return `${p.year}/${p.month}/${p.day} ${weekday}`;
}

/** Page number from a query string; anything invalid is page 1. */
export function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Strict positive-integer id from a path segment, or null. */
export function parseId(value: string | undefined) {
  return value && /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

/** UTC ISO time → the value of an `<input type="datetime-local">` showing Taipei time. */
export function toTaipeiInput(iso: string) {
  return formatDateTime(iso).replace(' ', 'T');
}

/** A `datetime-local` value entered as Taipei time → UTC ISO, or null when it is not a time. */
export function fromTaipeiInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const date = new Date(`${value}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** `2026-11-17` in Taipei time. */
export function formatDate(iso: string | null | undefined) {
  return formatDateTime(iso).slice(0, 10);
}

/** Year, month and day numbers of a UTC ISO time, in Taipei. */
export function taipeiDateParts(iso: string) {
  const p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}

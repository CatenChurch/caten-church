/**
 * Turns rows exported from the Rails site's Postgres (see export-postgres.sh) into SQL for D1.
 * Pure functions only, so the tests can run them inside the Workers test runtime.
 */

export type Row = Record<string, unknown>;

/** Everything export-postgres.sh writes, keyed by file name without `.jsonl`. */
export interface Dump {
  users: Row[];
  oauths: Row[];
  profiles: Row[];
  weeklies: Row[];
  weekly_pdfs: Row[];
}

export const DUMP_TABLES = [
  'users',
  'oauths',
  'profiles',
  'weeklies',
  'weekly_pdfs',
] as const satisfies readonly (keyof Dump)[];

export interface ImportResult {
  /** SQL statements in an order that satisfies the foreign keys. */
  statements: string[];
  /** Rows written per D1 table. */
  counts: Record<string, number>;
  /** Rows left out, with the reason, so nothing disappears silently. */
  skipped: string[];
  /** Weekly PDFs to copy: Active Storage key in GCS → object key in R2. */
  pdfCopies: { from: string; to: string; size: number; md5Base64: string }[];
}

/** Postgres `timestamp` (UTC, no zone) → `2026-11-17T03:00:00.000Z`. */
export function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).replace(' ', 'T');
  const date = new Date(/(?:Z|[+-]\d\d:?\d\d)$/.test(text) ? text : `${text}Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`not a timestamp: ${text}`);
  return date.toISOString();
}

export function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`not a finite number: ${value}`);
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insert(table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  const values = columns.map((column) => sqlLiteral(row[column]));
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

const text = (value: unknown) => (value === null || value === undefined ? null : String(value));
const blankToNull = (value: unknown) => {
  const s = text(value)?.trim();
  return s ? s : null;
};

function required(table: string, row: Row, column: string) {
  const value = row[column];
  if (value === null || value === undefined || value === '') {
    throw new Error(`${table} id=${row.id}: ${column} is empty`);
  }
  return value;
}

export function buildImport(dump: Dump): ImportResult {
  const statements: string[] = [];
  const counts: Record<string, number> = {};
  const skipped: string[] = [];
  const add = (table: string, row: Record<string, unknown>) => {
    statements.push(insert(table, row));
    counts[table] = (counts[table] ?? 0) + 1;
  };

  // Users. Devise never let an unconfirmed address sign in, so an account that is neither
  // confirmed nor linked to Facebook has no one who can prove it is theirs: leave it out
  // rather than let whoever later signs in with that address inherit it.
  const usersWithOauth = new Set(dump.oauths.map((o) => o.user_id));
  const userIds = new Set<unknown>();
  for (const u of dump.users) {
    if (!u.confirmed_at && !usersWithOauth.has(u.id)) {
      skipped.push(`users id=${u.id}: email never confirmed and no linked sign-in`);
      continue;
    }
    userIds.add(u.id);
    add('users', {
      id: u.id,
      // Only a confirmed address may be matched against a provider's verified email
      email: u.confirmed_at ? blankToNull(u.email)?.toLowerCase() : null,
      is_admin: Boolean(u.is_admin),
      last_sign_in_at: toIso(u.last_sign_in_at),
      created_at: toIso(u.created_at),
      updated_at: toIso(u.updated_at),
    });
  }
  const hasUser = (table: string, row: Row, column = 'user_id') => {
    if (userIds.has(row[column])) return true;
    skipped.push(`${table} id=${row.id}: ${column}=${row[column]} was not imported`);
    return false;
  };

  for (const o of dump.oauths) {
    if (!hasUser('oauths', o)) continue;
    add('oauth_accounts', {
      id: o.id,
      user_id: o.user_id,
      provider: required('oauths', o, 'provider'),
      provider_user_id: required('oauths', o, 'uid'),
      created_at: toIso(o.created_at),
    });
  }

  const profiled = new Set<unknown>();
  for (const p of dump.profiles) {
    if (!hasUser('profiles', p)) continue;
    if (profiled.has(p.user_id)) {
      skipped.push(`profiles id=${p.id}: user ${p.user_id} already has a profile`);
      continue;
    }
    profiled.add(p.user_id);
    add('profiles', {
      id: p.id,
      user_id: p.user_id,
      name: blankToNull(p.name),
      sex: blankToNull(p.sex),
      birth: blankToNull(p.birth),
      phone: blankToNull(p.phone),
      cellphone: blankToNull(p.cellphone),
      address: blankToNull(p.address),
      education: blankToNull(p.education),
      id_number: blankToNull(p.id_number),
      emergency_contact: blankToNull(p.emergency_contact),
      created_at: toIso(p.created_at),
      updated_at: toIso(p.updated_at),
    });
  }

  const pdfByWeekly = new Map<unknown, Row>();
  for (const pdf of dump.weekly_pdfs) {
    if (pdfByWeekly.has(pdf.weekly_id)) {
      skipped.push(`weekly_pdfs: weekly ${pdf.weekly_id} has more than one PDF, kept the newest`);
    }
    // export-postgres.sh orders by attachment id, so the last one is the newest
    pdfByWeekly.set(pdf.weekly_id, pdf);
  }
  const pdfCopies: ImportResult['pdfCopies'] = [];
  const weeklyIds = new Set<unknown>();
  for (const w of dump.weeklies) {
    weeklyIds.add(w.id);
    const pdf = pdfByWeekly.get(w.id);
    const pdfKey = pdf ? `weeklies/${w.id}.pdf` : null;
    if (pdf && pdfKey) {
      pdfCopies.push({
        from: String(required('weekly_pdfs', pdf, 'key')),
        to: pdfKey,
        size: Number(pdf.byte_size),
        md5Base64: String(pdf.checksum),
      });
    }
    add('weeklies', {
      id: w.id,
      title: required('weeklies', w, 'title'),
      issue: required('weeklies', w, 'issue'),
      published_at: toIso(required('weeklies', w, 'published_at')),
      viewed_count: w.viewed_count ?? 0,
      pdf_key: pdfKey,
      pdf_filename: pdf ? text(pdf.filename) : null,
      pdf_size: pdf ? Number(pdf.byte_size) : null,
      created_at: toIso(w.created_at),
      updated_at: toIso(w.updated_at),
    });
  }
  for (const pdf of dump.weekly_pdfs) {
    if (!weeklyIds.has(pdf.weekly_id)) {
      skipped.push(`weekly_pdfs key=${pdf.key}: weekly ${pdf.weekly_id} does not exist`);
    }
  }

  return { statements, counts, skipped, pdfCopies };
}

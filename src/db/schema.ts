import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** All timestamps are UTC ISO-8601 text (`2026-11-17T03:00:00.000Z`), so they compare as strings. */
const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const timestamps = {
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
};
const bool = (name: string) => integer(name, { mode: 'boolean' });

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Null when the SSO provider gave no verified email. */
  email: text('email').unique(),
  isAdmin: bool('is_admin').notNull().default(false),
  lastSignInAt: text('last_sign_in_at'),
  ...timestamps,
});

/** One row per SSO identity (google / line / facebook) linked to a user. */
export const oauthAccounts = sqliteTable(
  'oauth_accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => [
    uniqueIndex('oauth_accounts_identity').on(t.provider, t.providerUserId),
    index('oauth_accounts_user').on(t.userId),
  ],
);

export const profiles = sqliteTable(
  'profiles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    sex: text('sex'),
    /** `YYYY-MM-DD` */
    birth: text('birth'),
    phone: text('phone'),
    cellphone: text('cellphone'),
    address: text('address'),
    education: text('education'),
    idNumber: text('id_number'),
    emergencyContact: text('emergency_contact'),
    ...timestamps,
  },
  (t) => [index('profiles_birth').on(t.birth)],
);

export const groups = sqliteTable(
  'groups',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    introduction: text('introduction').notNull(),
    description: text('description'),
    sequence: integer('sequence'),
    createrId: integer('creater_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('groups_sequence').on(t.sequence)],
);

export const groupUsers = sqliteTable(
  'group_users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: integer('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['leader', 'member'] })
      .notNull()
      .default('member'),
    ...timestamps,
  },
  (t) => [uniqueIndex('group_users_membership').on(t.groupId, t.userId)],
);

/** Announcements of church events. Sign-up happens in an external form linked by `signupUrl`. */
export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    content: text('content'),
    start: text('start').notNull(),
    over: text('over').notNull(),
    /** Link to the sign-up form (e.g. a Google Form); null when there is nothing to sign up for. */
    signupUrl: text('signup_url'),
    organizerId: integer('organizer_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('events_start').on(t.start), index('events_over').on(t.over)],
);

export const weeklies = sqliteTable(
  'weeklies',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    issue: integer('issue').notNull(),
    publishedAt: text('published_at').notNull(),
    viewedCount: integer('viewed_count').notNull().default(0),
    /** R2 object key (`weeklies/<id>.pdf`); null when no PDF was uploaded. */
    pdfKey: text('pdf_key'),
    pdfFilename: text('pdf_filename'),
    pdfSize: integer('pdf_size'),
    ...timestamps,
  },
  (t) => [index('weeklies_published_at').on(t.publishedAt)],
);

/** Site settings an admin can change; missing keys fall back to the defaults in src/settings.ts. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(now),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

/** Sign-in sessions; `id` is the SHA-256 of the cookie token, so a database leak reveals no usable token. */
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => [index('sessions_user').on(t.userId)],
);

/** Who changed which site setting, and from what to what. */
export const settingChanges = sqliteTable('setting_changes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  oldValue: text('old_value').notNull(),
  newValue: text('new_value').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default(now),
});

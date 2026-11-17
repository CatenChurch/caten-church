import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { oauthAccounts, profiles, sessions, users } from '../db/schema';

/** The signed-in member as pages need it. */
export interface CurrentUser {
  id: number;
  email: string | null;
  isAdmin: boolean;
  /** Name from the member's profile, if they have filled one in. */
  name: string | null;
}

export interface SsoProfile {
  provider: string;
  providerUserId: string;
  email: string | null;
  /** True only when the provider vouches that the person owns `email`. */
  emailVerified: boolean;
  name: string | null;
}

export class IdentityInUseError extends Error {
  constructor() {
    super('identity is linked to another member');
  }
}

const normalizeEmail = (email: string | null) => email?.trim().toLowerCase() || null;

/**
 * Finds or creates the member behind a provider identity.
 *
 * - An identity that is already linked signs that member in.
 * - While signed in, a new identity is linked to the current member (how members add a
 *   second way to sign in). Linking one that belongs to someone else is refused.
 * - Otherwise a provider-verified email that matches an existing member links to that
 *   member: this is how members of the old site, who signed up with email and password,
 *   get their account back.
 * - Otherwise a new member is created.
 */
export async function signInWithIdentity(
  d1: D1Database,
  profile: SsoProfile,
  currentUserId: number | null = null,
): Promise<{ userId: number; outcome: 'signed_in' | 'linked' | 'created' }> {
  const db = drizzle(d1);
  const email = normalizeEmail(profile.email);

  const [linked] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, profile.provider),
        eq(oauthAccounts.providerUserId, profile.providerUserId),
      ),
    )
    .limit(1);
  if (linked) {
    if (currentUserId !== null && linked.userId !== currentUserId) throw new IdentityInUseError();
    await touchSignIn(d1, linked.userId);
    return { userId: linked.userId, outcome: 'signed_in' };
  }

  const link = (userId: number) =>
    db.insert(oauthAccounts).values({
      userId,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    });

  if (currentUserId !== null) {
    await link(currentUserId);
    return { userId: currentUserId, outcome: 'linked' };
  }

  const [sameEmail] = email
    ? await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    : [];

  if (sameEmail && profile.emailVerified) {
    await link(sameEmail.id);
    await touchSignIn(d1, sameEmail.id);
    return { userId: sameEmail.id, outcome: 'linked' };
  }

  // An unverified address that another member already uses is not stored: it would collide
  // with theirs, and nothing shows this person owns it.
  const [created] = await db
    .insert(users)
    .values({ email: sameEmail ? null : email, lastSignInAt: new Date().toISOString() })
    .returning({ id: users.id });
  const userId = created!.id;
  await link(userId);
  return { userId, outcome: 'created' };
}

async function touchSignIn(d1: D1Database, userId: number) {
  await drizzle(d1)
    .update(users)
    .set({ lastSignInAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function findCurrentUser(
  d1: D1Database,
  sessionId: string,
): Promise<(CurrentUser & { expiresAt: string }) | undefined> {
  const [row] = await drizzle(d1)
    .select({
      id: users.id,
      email: users.email,
      isAdmin: users.isAdmin,
      name: profiles.name,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return row;
}

export function listIdentities(d1: D1Database, userId: number) {
  return drizzle(d1)
    .select({ provider: oauthAccounts.provider, createdAt: oauthAccounts.createdAt })
    .from(oauthAccounts)
    .where(eq(oauthAccounts.userId, userId))
    .orderBy(oauthAccounts.id);
}

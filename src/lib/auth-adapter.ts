import type { Adapter } from "next-auth/adapters";
import type { AdapterUser, AdapterSession } from "@auth/core/adapters";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function toAdapterUser(row: typeof users.$inferSelect): AdapterUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified ?? null,
    image: row.image,
  };
}

export function customAdapter(): Adapter {
  return {
    async createUser(userData) {
      const d = userData as { name?: string | null; email: string; emailVerified?: Date | null; image?: string | null };
      const [row] = await db.insert(users).values({
        id: crypto.randomUUID(),
        name: d.name ?? null,
        email: d.email,
        emailVerified: d.emailVerified ?? null,
        image: d.image ?? null,
      }).returning();
      return toAdapterUser(row);
    },

    async getUser(id) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByEmail(email) {
      const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
        })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    async updateUser(userData) {
      const d = userData as { id: string; name?: string | null; email: string; emailVerified?: Date | null; image?: string | null };
      if (!d.id) throw new Error("updateUser requires id");
      const [row] = await db
        .update(users)
        .set({
          name: d.name ?? null,
          email: d.email,
          emailVerified: d.emailVerified ?? null,
          image: d.image ?? null,
        })
        .where(eq(users.id, d.id))
        .returning();
      return toAdapterUser(row);
    },

    async deleteUser(id) {
      await db.delete(users).where(eq(users.id, id));
    },

    async linkAccount(_accountData) {
      // Adapter interface requires this method; body unused in CareRota
    },

    async createSession(sessionData) {
      const d = sessionData as { sessionToken: string; userId: string; expires: Date };
      const [row] = await db.insert(sessions).values({
        sessionToken: d.sessionToken,
        userId: d.userId,
        expires: d.expires,
      }).returning();
      return row as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const [row] = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);
      if (!row) return null;
      return {
        session: row.session as AdapterSession,
        user: toAdapterUser(row.user),
      };
    },

    async updateSession(sessionData) {
      const d = sessionData as { sessionToken: string; expires: Date };
      const [row] = await db
        .update(sessions)
        .set({ expires: d.expires })
        .where(eq(sessions.sessionToken, d.sessionToken))
        .returning();
      return row as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async createVerificationToken(tokenData) {
      const d = tokenData as { identifier: string; token: string; expires: Date };
      const [row] = await db.insert(verificationTokens).values({
        identifier: d.identifier,
        token: d.token,
        expires: d.expires,
      }).returning();
      return row;
    },

    async useVerificationToken({ identifier, token }) {
      const [existing] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
        .limit(1);
      if (!existing) return null;
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );
      return existing;
    },
  };
}

import { db } from '@/lib/db';
import { webhooks } from '@/db/schema/webhooks';
import { eq, and } from 'drizzle-orm';

export async function getActiveWebhooks(homeId: string) {
  return db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.homeId, homeId), eq(webhooks.isActive, true)));
}

export async function getWebhooksByHome(homeId: string) {
  return db
    .select()
    .from(webhooks)
    .where(eq(webhooks.homeId, homeId));
}

// Accepts an already-encrypted secret (see src/lib/crypto.ts). Callers must
// encrypt before passing — the raw signing secret must never be stored or
// returned by any read path.
export async function createWebhook(data: typeof webhooks.$inferInsert) {
  const [created] = await db
    .insert(webhooks)
    .values(data)
    .returning();
  return created;
}

export async function deleteWebhook(id: string, homeId: string) {
  const [deleted] = await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.homeId, homeId)))
    .returning();
  return deleted;
}

export async function toggleWebhook(id: string, homeId: string, isActive: boolean) {
  const [updated] = await db
    .update(webhooks)
    .set({ isActive })
    .where(and(eq(webhooks.id, id), eq(webhooks.homeId, homeId)))
    .returning();
  return updated;
}

export async function markWebhookTriggered(id: string) {
  await db
    .update(webhooks)
    .set({ lastTriggeredAt: new Date() })
    .where(eq(webhooks.id, id));
}

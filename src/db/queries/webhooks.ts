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

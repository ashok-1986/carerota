import { db } from '@/lib/db';
import { homes } from '@/db/schema/homes';
import { eq } from 'drizzle-orm';

export async function getHomeById(homeId: string) {
  const [home] = await db
    .select()
    .from(homes)
    .where(eq(homes.id, homeId))
    .limit(1);
  return home;
}

export async function updateHomeBudget(homeId: string, budgetCapMonthly: string | null, budgetNotes: string | null) {
  const [updated] = await db
    .update(homes)
    .set({ 
      budgetCapMonthly,
      budgetNotes
    })
    .where(eq(homes.id, homeId))
    .returning();
  return updated;
}

export async function updateHomeSettings(homeId: string, homeSettings: Record<string, unknown>) {
  const [updated] = await db
    .update(homes)
    .set({ homeSettings })
    .where(eq(homes.id, homeId))
    .returning();
  return updated;
}

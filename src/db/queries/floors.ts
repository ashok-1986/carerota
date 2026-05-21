import { db } from '../../lib/db';
import { homeFloors } from '../schema/floors';
import { eq, and } from 'drizzle-orm';

export async function getFloors(homeId: string) {
  return db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId));
}

export async function updateFloorName(id: string, homeId: string, name: string) {
  const [updated] = await db
    .update(homeFloors)
    .set({ name })
    .where(and(eq(homeFloors.id, id), eq(homeFloors.homeId, homeId)))
    .returning();
  return updated;
}

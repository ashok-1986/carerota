import { db } from '../../lib/db';
import { homeFloors } from '../schema/floors';
import { eq } from 'drizzle-orm';

export async function getFloors(homeId: string) {
  return db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId));
}

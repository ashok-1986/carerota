"use server";

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff, homeFloors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { isManager } from '@/lib/authz';
import { logAction } from '@/lib/audit';

export async function updateStaff(staffId: string, data: {
  name: string;
  role: string;
  employmentType: string;
  payRateHourly: number | null;
  contractedHours: number | null;
  isActive: boolean;
  homeFloorId: string | null;
}) {
  const session = await auth();
  if (!session?.user?.homeId) {
    throw new Error('Unauthorized');
  }

  if (!isManager(session.user.role)) {
    throw new Error('Forbidden');
  }

  const [existing] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.homeId, session.user.homeId)))
    .limit(1);

  if (!existing) {
    throw new Error('Staff member not found');
  }

  if (data.homeFloorId) {
    const [floor] = await db
      .select({ id: homeFloors.id })
      .from(homeFloors)
      .where(and(eq(homeFloors.id, data.homeFloorId), eq(homeFloors.homeId, session.user.homeId)))
      .limit(1);

    if (!floor) {
      throw new Error('Invalid floor selection for this care home');
    }
  }

  await db
    .update(staff)
    .set({
      name: data.name,
      role: data.role,
      employmentType: data.employmentType,
      payRateHourly: data.payRateHourly ? (data.payRateHourly * 100).toString() : null, // Assuming input is in pounds
      contractedHours: data.contractedHours ? data.contractedHours.toString() : null, // Decimal column
      isActive: data.isActive,
      homeFloorId: data.homeFloorId || null,
    })
    .where(and(eq(staff.id, staffId), eq(staff.homeId, session.user.homeId)))
    .returning();

  await logAction('staff.updated', {
    homeId: session.user.homeId,
    userId: session.user.id,
    entityType: 'staff',
    entityId: staffId,
    beforeValue: {
      name: existing.name,
      role: existing.role,
      employmentType: existing.employmentType,
      payRateHourly: existing.payRateHourly,
      contractedHours: existing.contractedHours,
      isActive: existing.isActive,
      homeFloorId: existing.homeFloorId,
    },
    afterValue: {
      name: data.name,
      role: data.role,
      employmentType: data.employmentType,
      payRateHourly: data.payRateHourly ? (data.payRateHourly * 100).toString() : null,
      contractedHours: data.contractedHours ? data.contractedHours.toString() : null,
      isActive: data.isActive,
      homeFloorId: data.homeFloorId,
    },
  });

  revalidatePath('/staff');
  revalidatePath(`/staff/${staffId}`);
  
  return { success: true };
}

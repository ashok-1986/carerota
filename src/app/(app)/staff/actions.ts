"use server";

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

  const allowedRoles = ['home_manager', 'manager', 'admin'];
  if (!allowedRoles.includes(session.user.role || '')) {
    throw new Error('Forbidden');
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
    .where(and(eq(staff.id, staffId), eq(staff.homeId, session.user.homeId)));

  revalidatePath('/staff');
  revalidatePath(`/staff/${staffId}`);
  
  return { success: true };
}

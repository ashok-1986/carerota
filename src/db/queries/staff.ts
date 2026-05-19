import { db } from '@/lib/db';
import { staff, homeFloors, rotaEntries, shiftCodes } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import type { StaffRow } from '@/types/db';

/**
 * Retrieves staff for a given home, casting decimal fields to numbers
 * and including floor code/name, authUserId, activity flag.
 */
export async function getStaffByHome(homeId: string): Promise<StaffRow[]> {
  const rows = await db
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      employmentType: staff.employmentType,
      contractedHours: staff.contractedHours,
      payRateHourly: staff.payRateHourly,
      authUserId: staff.authUserId,
      isActive: staff.isActive,
      homeFloorId: staff.homeFloorId,
      floorName: homeFloors.name,
      floorCode: homeFloors.code,
    })
    .from(staff)
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(eq(staff.homeId, homeId))
    .orderBy(asc(staff.name));

  // Drizzle returns decimal columns as strings; cast to numbers (or null)
  return rows.map((r) => ({
    ...r,
    contractedHours: r.contractedHours ? Number(r.contractedHours) : null,
    payRateHourly: r.payRateHourly ? Number(r.payRateHourly) : null,
  }));
}

export async function getStaffById(staffId: string): Promise<StaffRow | null> {
  const rows = await db
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      employmentType: staff.employmentType,
      contractedHours: staff.contractedHours,
      payRateHourly: staff.payRateHourly,
      authUserId: staff.authUserId,
      isActive: staff.isActive,
      homeFloorId: staff.homeFloorId,
      floorName: homeFloors.name,
      floorCode: homeFloors.code,
    })
    .from(staff)
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(eq(staff.id, staffId))
    .limit(1);

  if (!rows.length) return null;

  const r = rows[0];
  return {
    ...r,
    contractedHours: r.contractedHours ? Number(r.contractedHours) : null,
    payRateHourly: r.payRateHourly ? Number(r.payRateHourly) : null,
  };
}

export type RotaEntrySummary = {
  id: string;
  shiftDate: string;
  code: string | null;
  isPublished: boolean;
};

/** Get recent rota entries for a specific staff member. */
export async function getStaffRotaEntries(staffId: string, limit = 30): Promise<RotaEntrySummary[]> {
  return db
    .select({
      id: rotaEntries.id,
      shiftDate: rotaEntries.shiftDate,
      code: shiftCodes.code,
      isPublished: rotaEntries.isPublished,
    })
    .from(rotaEntries)
    .leftJoin(shiftCodes, eq(rotaEntries.shiftCodeId, shiftCodes.id))
    .where(eq(rotaEntries.staffId, staffId))
    .orderBy(desc(rotaEntries.shiftDate))
    .limit(limit);
}

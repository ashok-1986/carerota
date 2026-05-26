import { db } from '@/lib/db';
import { staff, rotaEntries, shiftCodes, homeFloors } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface StaffHoursSummary {
  staffId: string;
  staffName: string;
  role: string;
  employmentType: string;
  floorName: string | null;
  totalShifts: number;
  totalHours: number;
  contractedHours: number;
  variance: number;
}

export async function getStaffHoursSummary(
  homeId: string,
  periodStart: string,
  periodEnd: string
): Promise<StaffHoursSummary[]> {
  // 1. Fetch all staff for this home
  const staffList = await db
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      employmentType: staff.employmentType,
      contractedHours: staff.contractedHours,
      floorName: homeFloors.name,
    })
    .from(staff)
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(eq(staff.homeId, homeId));

  // 2. Fetch all rota entries in this date range for this home
  const entries = await db
    .select({
      staffId: rotaEntries.staffId,
      hours: shiftCodes.hours,
      category: shiftCodes.category,
    })
    .from(rotaEntries)
    .leftJoin(shiftCodes, eq(rotaEntries.shiftCodeId, shiftCodes.id))
    .where(
      and(
        eq(rotaEntries.homeId, homeId),
        gte(rotaEntries.shiftDate, periodStart),
        lte(rotaEntries.shiftDate, periodEnd)
      )
    );

  // Calculate period length in days
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const daysInPeriod = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 3. Map entries by staffId
  const entriesByStaff = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!entry.staffId) continue;
    const list = entriesByStaff.get(entry.staffId) || [];
    list.push(entry);
    entriesByStaff.set(entry.staffId, list);
  }

  // 4. Build summary
  return staffList.map((s) => {
    const staffEntries = entriesByStaff.get(s.id) || [];
    
    // Shifts count (non-absence category)
    const totalShifts = staffEntries.filter(
      (e) => e.category !== 'absence' && e.hours !== null
    ).length;

    // Total hours worked
    const totalHours = staffEntries.reduce((sum, e) => {
      // Only count non-absence shifts toward hours
      if (e.category === 'absence') return sum;
      return sum + (e.hours ? Number(e.hours) : 0);
    }, 0);

    // Contracted hours scaled to the period (for non-bank staff)
    let contractedHours = 0;
    if (s.employmentType !== 'bank' && s.contractedHours) {
      contractedHours = (Number(s.contractedHours) / 7) * daysInPeriod;
    }

    const variance = totalHours - contractedHours;

    return {
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      employmentType: s.employmentType,
      floorName: s.floorName || null,
      totalShifts,
      totalHours: Math.round(totalHours * 100) / 100,
      contractedHours: Math.round(contractedHours * 100) / 100,
      variance: Math.round(variance * 100) / 100,
    };
  });
}

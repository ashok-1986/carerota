import { format, parseISO, differenceInDays } from 'date-fns';
import { db } from './db';
import { leaveRequests, staff as staffTable, shiftCodes, homes, homeFloors, rotaEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPayPeriod } from './utils';
import { logAction } from './audit';

export function formatShiftDate(dateString: string) {
  return format(parseISO(dateString), 'yyyy-MM-dd');
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export interface ShiftCode {
  id: string;
  code: string;
  label: string;
  hours: string | number;
  category: 'work' | 'absence';
}

export interface Staff {
  id: string;
  name: string;
  contractedHours: number;
  role: string;
  employmentType: string;
  homeFloorId: string | null;
}

export interface RotaEntry {
  id: string;
  staffId: string;
  shiftDate: string;
  shiftCodeId: string | null;
  homeFloorId: string;
}

export interface CoverageGap {
  floorId: string;
  date: string;
  message: string;
}

export interface ComplianceIssue {
  staffId: string;
  staffName: string;
  date?: string;
  type: 'consecutive_days' | 'over_contract' | 'under_contract' | 'rest_violation';
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Detects coverage gaps where a floor has no active work shifts scheduled for a given date
 */
export function detectGaps(
  entries: RotaEntry[],
  dates: string[],
  floors: { id: string; name: string }[],
  shiftCodes: ShiftCode[]
): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const workShiftIds = new Set(
    shiftCodes.filter((sc) => sc.category === 'work').map((sc) => sc.id)
  );

  // Group entries by floor and date
  const floorDateShifts = new Map<string, Set<string>>();
  
  entries.forEach((entry) => {
    if (!entry.shiftCodeId || !workShiftIds.has(entry.shiftCodeId)) return;
    const key = `${entry.homeFloorId}_${entry.shiftDate}`;
    if (!floorDateShifts.has(key)) {
      floorDateShifts.set(key, new Set());
    }
    floorDateShifts.get(key)!.add(entry.shiftCodeId);
  });

  floors.forEach((floor) => {
    dates.forEach((dateStr) => {
      const key = `${floor.id}_${dateStr}`;
      const hasCoverage = floorDateShifts.has(key) && floorDateShifts.get(key)!.size > 0;
      if (!hasCoverage) {
        gaps.push({
          floorId: floor.id,
          date: dateStr,
          message: `Floor ${floor.name} has no coverage on ${format(parseISO(dateStr), 'dd MMM')}`,
        });
      }
    });
  });

  return gaps;
}

/**
 * Detects compliance issues such as consecutive days, contract hour limits, and rest break violations
 */
export function detectComplianceIssues(
  entries: RotaEntry[],
  staffList: Staff[],
  shiftCodes: ShiftCode[],
  dates: string[]
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const shiftHoursMap = new Map<string, number>();
  const isWorkShiftMap = new Map<string, boolean>();

  shiftCodes.forEach((sc) => {
    shiftHoursMap.set(sc.id, Number(sc.hours) || 0);
    isWorkShiftMap.set(sc.id, sc.category === 'work');
  });

  // Sort dates chronologically
  const sortedDates = [...dates].sort();

  staffList.forEach((staff) => {
    // 1. Filter entries for this staff member
    const staffEntries = entries.filter((e) => e.staffId === staff.id && e.shiftCodeId);
    const entryByDate = new Map<string, string>(); // date -> shiftCodeId
    staffEntries.forEach((e) => {
      if (e.shiftCodeId) entryByDate.set(e.shiftDate, e.shiftCodeId);
    });

    // 2. Check Contracted Hours
    let totalScheduledHours = 0;
    staffEntries.forEach((e) => {
      if (e.shiftCodeId) {
        totalScheduledHours += shiftHoursMap.get(e.shiftCodeId) || 0;
      }
    });

    if (staff.employmentType !== 'bank' && staff.contractedHours > 0) {
      if (totalScheduledHours > staff.contractedHours) {
        issues.push({
          staffId: staff.id,
          staffName: staff.name,
          type: 'over_contract',
          message: `Exceeds contracted hours (${totalScheduledHours} hrs scheduled vs ${staff.contractedHours} contract)`,
          severity: 'warning',
        });
      } else if (totalScheduledHours < staff.contractedHours) {
        issues.push({
          staffId: staff.id,
          staffName: staff.name,
          type: 'under_contract',
          message: `Under contracted hours (${totalScheduledHours} hrs scheduled vs ${staff.contractedHours} contract)`,
          severity: 'warning',
        });
      }
    }

    // 3. Check Consecutive Days Limit (> 6 days)
    let consecutiveDays = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      const shiftCodeId = entryByDate.get(dateStr);
      const isWorking = shiftCodeId ? (isWorkShiftMap.get(shiftCodeId) || false) : false;

      if (isWorking) {
        consecutiveDays++;
        if (consecutiveDays > 6) {
          issues.push({
            staffId: staff.id,
            staffName: staff.name,
            date: dateStr,
            type: 'consecutive_days',
            message: `${staff.name} is scheduled to work more than 6 consecutive days on ${format(parseISO(dateStr), 'dd MMM')}`,
            severity: 'error',
          });
        }
      } else {
        consecutiveDays = 0;
      }
    }

    // 4. Check Rest Break Violations (Night shift followed by early/day shift the next day)
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDateStr = sortedDates[i];
      const nextDateStr = sortedDates[i + 1];

      const currentShiftId = entryByDate.get(currentDateStr);
      const nextShiftId = entryByDate.get(nextDateStr);

      if (currentShiftId && nextShiftId) {
        const currentShiftCode = shiftCodes.find((sc) => sc.id === currentShiftId);
        const nextShiftCode = shiftCodes.find((sc) => sc.id === nextShiftId);

        // Night shift (N) followed by any work shift next day (like LD or E)
        if (
          currentShiftCode?.code === 'N' &&
          nextShiftCode &&
          isWorkShiftMap.get(nextShiftCode.id) &&
          nextShiftCode.code !== 'N'
        ) {
          issues.push({
            staffId: staff.id,
            staffName: staff.name,
            date: nextDateStr,
            type: 'rest_violation',
            message: `${staff.name} scheduled for a Day/Early shift on ${format(parseISO(nextDateStr), 'dd MMM')} immediately following a Night shift`,
            severity: 'error',
          });
        }
      }
    }
  });

  return issues;
}

export async function blockRotaForLeave(requestId: string, homeId: string, reviewedBy: string) {
  const [request] = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.id, requestId), eq(leaveRequests.homeId, homeId)))
    .limit(1);

  if (!request) {
    throw new Error('Leave request not found');
  }

  if (request.status !== 'approved') {
    return;
  }

  const [alShiftCode] = await db
    .select()
    .from(shiftCodes)
    .where(eq(shiftCodes.code, 'AL'))
    .limit(1);

  if (!alShiftCode) {
    throw new Error('AL (Annual Leave) shift code not found in database');
  }

  const [staffMember] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.id, request.staffId))
    .limit(1);

  let finalFloorId = staffMember?.homeFloorId;
  if (!finalFloorId) {
    const [firstFloor] = await db
      .select()
      .from(homeFloors)
      .where(eq(homeFloors.homeId, request.homeId))
      .limit(1);
    finalFloorId = firstFloor?.id;
  }

  if (!finalFloorId) {
    throw new Error('No home floor configured for staff and no fallback floor found');
  }

  const [homeRecord] = await db
    .select()
    .from(homes)
    .where(eq(homes.id, request.homeId))
    .limit(1);
  const payrollStartDay = homeRecord?.payrollStartDay ?? 19;

  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const currentDate = new Date(start);

  const entries: {
    homeId: string;
    staffId: string;
    homeFloorId: string;
    shiftDate: string;
    shiftCodeId: string;
    actualFloorId: string;
    rotaMonth: string;
    createdBy: string;
  }[] = [];

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const period = getPayPeriod(payrollStartDay, currentDate);
    const rotaMonthStr = period.start.toISOString().split('T')[0];

    entries.push({
      homeId: request.homeId,
      staffId: request.staffId,
      homeFloorId: finalFloorId,
      shiftDate: dateStr,
      shiftCodeId: alShiftCode.id,
      actualFloorId: finalFloorId,
      rotaMonth: rotaMonthStr,
      createdBy: reviewedBy,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await db.transaction(async (tx) => {
    for (const entry of entries) {
      await tx
        .delete(rotaEntries)
        .where(
          and(
            eq(rotaEntries.staffId, entry.staffId),
            eq(rotaEntries.shiftDate, entry.shiftDate),
          ),
        );

      await tx.insert(rotaEntries).values(entry);
    }
  });

  await logAction('rota.leave.blocked', {
    homeId: request.homeId,
    userId: reviewedBy,
    entityType: 'leave_request',
    entityId: requestId,
    staffId: request.staffId,
    startDate: request.startDate,
    endDate: request.endDate,
    entriesCount: entries.length,
  });
}

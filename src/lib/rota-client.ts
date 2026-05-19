import { format, parseISO } from 'date-fns';

export interface ShiftCode {
  id: string;
  code: string;
  label: string;
  hours: string | number;
  category: 'work' | 'absence' | 'float';
}

export interface Staff {
  id: string;
  name: string;
  contractedHours: number | null;
  role: string;
  employmentType: string;
  homeFloorId: string | null;
}

export interface RotaEntry {
  id: string;
  staffId: string;
  shiftDate: string | Date;
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

  const sortedDates = [...dates].sort();

  staffList.forEach((staff) => {
    const staffEntries = entries.filter((e) => e.staffId === staff.id && e.shiftCodeId);
    const entryByDate = new Map<string, string>();

    staffEntries.forEach((e) => {
      if (e.shiftCodeId) {
        const dateKey = typeof e.shiftDate === 'string' ? e.shiftDate : (e.shiftDate instanceof Date ? e.shiftDate.toISOString().split('T')[0] : '');
        entryByDate.set(dateKey, e.shiftCodeId);
      }
    });

    let totalScheduledHours = 0;
    staffEntries.forEach((e) => {
      if (e.shiftCodeId) {
        totalScheduledHours += shiftHoursMap.get(e.shiftCodeId) || 0;
      }
    });

    if (staff.employmentType !== 'bank' && staff.contractedHours != null && staff.contractedHours > 0) {
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

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDateStr = sortedDates[i];
      const nextDateStr = sortedDates[i + 1];

      const currentShiftId = entryByDate.get(currentDateStr);
      const nextShiftId = entryByDate.get(nextDateStr);

      if (currentShiftId && nextShiftId) {
        const currentShiftCode = shiftCodes.find((sc) => sc.id === currentShiftId);
        const nextShiftCode = shiftCodes.find((sc) => sc.id === nextShiftId);

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
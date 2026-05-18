import { SHIFT_CODES } from '@/lib/constants';
import { format, parseISO } from 'date-fns';

export interface ExportRow {
  staffName: string;
  careRotaRef: string;
  role: string;
  date: string;
  shiftCode: string;
  shiftLabel: string;
  hoursWorked: number;
  floorCode: string;
  floorName: string;
  hourlyRateGbp: number;
  projectedPayGbp: number;
  category: string;
}

/**
 * Generates rows formatted for Softworks-compatible HR and Payroll systems
 */
export function generatePayrollRows(
  entries: any[],
  staffList: any[],
  floors: any[]
): ExportRow[] {
  const rows: ExportRow[] = [];

  // Group staff and floors for O(1) lookup
  const staffMap = new Map<string, any>();
  staffList.forEach((s) => staffMap.set(s.id, s));

  const floorMap = new Map<string, any>();
  floors.forEach((f) => floorMap.set(f.id, f));

  entries.forEach((entry) => {
    const staff = staffMap.get(entry.staffId);
    if (!staff) return;

    // Use actual floor if shifted, fallback to home floor
    const targetFloorId = entry.actualFloorId || entry.homeFloorId || staff.homeFloorId;
    const floor = floorMap.get(targetFloorId);

    // Resolve shift code details
    // entry might have shiftCodeId, or code.
    const codeStr = entry.code || entry.shiftCodeCode;
    const shift = SHIFT_CODES.find((sc) => sc.code === codeStr);
    
    // Ignore rest days or empty shifts in payroll exports
    if (!shift || shift.category !== 'work') return;

    const hours = Number(shift.hours) || 0;
    const hourlyRatePence = Number(staff.payRateHourly) || 0;
    
    // Convert pence to standard GBP decimal for calculations
    const hourlyRateGbp = hourlyRatePence / 100;
    const projectedPayGbp = hourlyRateGbp * hours;

    // Format date as DD/MM/YYYY using date-fns format(parseISO(dateStr), 'dd/MM/yyyy')
    let formattedDate = entry.shiftDate;
    if (typeof entry.shiftDate === 'string') {
      formattedDate = format(parseISO(entry.shiftDate), 'dd/MM/yyyy');
    } else if (entry.shiftDate instanceof Date) {
      formattedDate = format(entry.shiftDate, 'dd/MM/yyyy');
    }

    rows.push({
      staffName: staff.name,
      careRotaRef: staff.id ? staff.id.slice(-8) : '',
      role: staff.role,
      date: formattedDate,
      shiftCode: shift.code,
      shiftLabel: shift.label,
      hoursWorked: hours,
      floorCode: floor?.code || 'GEN',
      floorName: floor?.name || 'General',
      hourlyRateGbp,
      projectedPayGbp,
      category: shift.category,
    });
  });

  return rows.sort((a, b) => {
    const nameCompare = a.staffName.localeCompare(b.staffName);
    if (nameCompare !== 0) return nameCompare;

    // Sort chronologically by parsing DD/MM/YYYY
    const [d1, m1, y1] = a.date.split('/').map(Number);
    const [d2, m2, y2] = b.date.split('/').map(Number);
    const dateA = new Date(y1, m1 - 1, d1).getTime();
    const dateB = new Date(y2, m2 - 1, d2).getTime();
    return dateA - dateB;
  });
}

/**
 * Converts export rows into standard RFC 4180 CSV string format
 */
export function convertToCsv(rows: ExportRow[]): string {
  const headers = [
    'Staff Name',
    'CareRota Ref',
    'Role',
    'Date',
    'Shift Code',
    'Shift Label',
    'Hours Worked',
    'Floor/Cost Center Code',
    'Floor/Cost Center Name',
    'Hourly Rate (£)',
    'Projected Pay (£)',
    'Shift Category',
  ];

  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    const line = [
      escapeCsvField(row.staffName),
      escapeCsvField(row.careRotaRef),
      escapeCsvField(row.role),
      escapeCsvField(row.date),
      escapeCsvField(row.shiftCode),
      escapeCsvField(row.shiftLabel),
      escapeCsvField(row.hoursWorked.toFixed(2)),
      escapeCsvField(row.floorCode),
      escapeCsvField(row.floorName),
      escapeCsvField(row.hourlyRateGbp.toFixed(2)),
      escapeCsvField(row.projectedPayGbp.toFixed(2)),
      escapeCsvField(row.category),
    ];
    csvLines.push(line.join(','));
  });

  return csvLines.join('\r\n');
}

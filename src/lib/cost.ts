// src/lib/cost.ts
import { SHIFT_CODES } from './constants';
import type { CostStaff, CostEntry, CostSnapshot } from '@/types/cost';

/** Normalise pay rate: if stored as pounds (>100), convert to pence by ×100.
 *  Neon/Drizzle decimal columns return numbers, not strings.
 *  Rates > 1000 are clearly in pounds; ≤ 1000 are already in pence.
 */
function toPence(rate: number): number {
  if (!rate || rate <= 0) return 0;
  return rate > 1000 ? Math.round(rate) : Math.round(rate * 100);
}

/** Helper to retrieve SHIFT_CODES entry */
function getShiftInfo(code: string | null) {
  if (!code) return null;
  return SHIFT_CODES.find((s) => s.code === code) ?? null;
}

/** Calculate projected cost (pence) from work‑category entries */
export function calcProjectedCost(
  entries: CostEntry[],
  staff: CostStaff[]
): number {
  const staffMap = new Map<string, CostStaff>(staff.map((s) => [s.id, s]));
  let totalPence = 0;

  for (const entry of entries) {
    const shift = getShiftInfo(entry.shiftCode);
    if (shift?.category !== 'work') continue;
    const staffMember = staffMap.get(entry.staffId);
    if (!staffMember?.payRateHourly) continue;
    const rate = toPence(staffMember.payRateHourly); // normalise to pence
    const hours = shift.hours;
    totalPence += rate * hours;
  }

  return totalPence;
}

/** Budgeted hours based on contracted weekly hours and period length */
export function calcBudgetedHours(
  staff: CostStaff[],
  payPeriodDays: Date[]
): number {
  const daysInPeriod = payPeriodDays.length;
  let totalHours = 0;
  for (const s of staff) {
    if (s.employmentType !== 'bank' && s.contractedHours != null) {
      const weeklyHours = s.contractedHours;
      totalHours += (weeklyHours / 7) * daysInPeriod;
    }
  }
  return totalHours;
}

/** Total scheduled hours from all entries (work, absence, float) */
export function calcScheduledHours(entries: CostEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    const shift = getShiftInfo(entry.shiftCode);
    if (!shift) continue;
    // All categories contribute their hours (absence & float have 0 in SHIFT_CODES, handled elsewhere)
    total += shift.hours;
  }
  return total;
}

/** Cost broken down by role (pence) */
export function calcCostByRole(
  entries: CostEntry[],
  staff: CostStaff[]
): Record<string, number> {
  const staffMap = new Map<string, CostStaff>(staff.map((s) => [s.id, s]));
  const costs: Record<string, number> = {};

  for (const entry of entries) {
    const shift = getShiftInfo(entry.shiftCode);
    if (shift?.category !== 'work') continue;
    const staffMember = staffMap.get(entry.staffId);
    if (!staffMember?.payRateHourly) continue;
    const rate = toPence(staffMember.payRateHourly);
    const cost = rate * shift.hours;
    const role = staffMember.role || 'unknown';
    costs[role] = (costs[role] ?? 0) + cost;
  }

  return costs;
}

/** Utilisation ratio of projected cost against monthly cap (both pence) */
export function calcCapUtilisation(projectedCost: number, capPence: number | null): number {
  if (!capPence || capPence === 0) return 0;
  return projectedCost / capPence;
}

/** Build a complete CostSnapshot object */
export function buildCostSnapshot(params: {
  staff: CostStaff[];
  entries: CostEntry[];
  periodDays: Date[];
  budgetCapMonthly: number; // pence
  agencyCost?: number; // pence, default 0
}): CostSnapshot {
  const projected = calcProjectedCost(params.entries, params.staff);
  const scheduled = calcScheduledHours(params.entries);
  const budgeted = calcBudgetedHours(params.staff, params.periodDays);
  const costByRole = calcCostByRole(params.entries, params.staff);
  const agency = params.agencyCost ?? 0;
  const total = projected + agency;
  const variance = params.budgetCapMonthly - projected;
  const utilisation = calcCapUtilisation(projected, params.budgetCapMonthly);
  const status =
    utilisation < 0.85
      ? 'safe'
      : utilisation < 1
      ? 'warning'
      : 'danger';

  return {
    budgetedHours: budgeted,
    scheduledHours: scheduled,
    projectedCost: projected,
    budgetCapMonthly: params.budgetCapMonthly,
    variance,
    capUtilisation: utilisation,
    agencyCost: agency,
    totalCost: total,
    status,
    costByRole,
  };
}

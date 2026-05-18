import { useMemo } from 'react';
import { 
  calcProjectedCost, 
  calcBudgetedHours, 
  calcScheduledHours, 
  calcCostByRole, 
  calcCapUtilisation
} from '@/lib/cost';
import type { CostEntry, CostStaff } from '@/types/cost';
import { BUDGET_WARNING_THRESHOLD } from '@/lib/constants';

export function useCost(entries: CostEntry[], staff: CostStaff[], budgetCapGbp: number, payPeriodDays: Date[]) {
  return useMemo(() => {
    const projectedCostPence = calcProjectedCost(entries, staff);
    const budgetedHours = calcBudgetedHours(staff, payPeriodDays);
    const scheduledHours = calcScheduledHours(entries);
    const costByRolePence = calcCostByRole(entries, staff);
    const budgetCapPence = budgetCapGbp * 100;
    const capUtilisation = calcCapUtilisation(projectedCostPence, budgetCapPence);
    
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (capUtilisation >= 1.0) {
      status = 'danger';
    } else if (capUtilisation >= BUDGET_WARNING_THRESHOLD) {
      status = 'warning';
    }
    
    const variancePence = budgetCapPence - projectedCostPence;

    return {
      projectedCost: projectedCostPence / 100, // Return as GBP for UI
      budgetedHours,
      scheduledHours,
      capUtilisation,
      variance: Math.abs(variancePence / 100),
      isOverBudget: variancePence < 0,
      costByRole: Object.fromEntries(
        Object.entries(costByRolePence).map(([role, pence]) => [role, pence / 100])
      ),
      status
    };
  }, [entries, staff, budgetCapGbp, payPeriodDays]);
}

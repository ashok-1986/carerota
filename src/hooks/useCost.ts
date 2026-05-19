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

export function useCost(
  entries: CostEntry[],
  staff: CostStaff[],
  budgetCapGbp: number,
  payPeriodDays: Date[],
  additionalCostTotal = 0
) {
  return useMemo(() => {
    const salaryCostPence = calcProjectedCost(entries, staff);
    const additionalCostPence = Math.round(additionalCostTotal * 100);
    const totalCostPence = salaryCostPence + additionalCostPence;
    const budgetedHours = calcBudgetedHours(staff, payPeriodDays);
    const scheduledHours = calcScheduledHours(entries);
    const costByRolePence = calcCostByRole(entries, staff);
    const budgetCapPence = budgetCapGbp * 100;
    const capUtilisation = calcCapUtilisation(totalCostPence, budgetCapPence);
    
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (capUtilisation >= 1.0) {
      status = 'danger';
    } else if (capUtilisation >= BUDGET_WARNING_THRESHOLD) {
      status = 'warning';
    }
    
    const variancePence = budgetCapPence - totalCostPence;

    return {
      salaryCost: salaryCostPence / 100,
      additionalCostTotal: additionalCostPence / 100,
      totalCost: totalCostPence / 100,
      projectedCost: totalCostPence / 100, // Keep for backward compat — now equals totalCost
      projectedSalaryCost: salaryCostPence / 100,
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
  }, [entries, staff, budgetCapGbp, payPeriodDays, additionalCostTotal]);
}

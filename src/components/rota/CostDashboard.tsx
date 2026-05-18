import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Coins, 
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface CostDashboardProps {
  costByRole: Record<string, number>; // in GBP
  projectedCost: number;             // in GBP
  scheduledHours: number;
  budgetedHours: number;
  isOverBudget: boolean;
  variance: number;                  // in GBP
  status: 'safe' | 'warning' | 'danger';
}

export function CostDashboard({
  costByRole,
  projectedCost,
  scheduledHours,
  budgetedHours,
  isOverBudget,
  variance,
}: CostDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Compute stats or lists
  const roles = Object.entries(costByRole).sort((a, b) => b[1] - a[1]);
  
  const roleStyling: Record<string, { bg: string; text: string; label: string }> = {
    'Registered Nurse': { bg: 'bg-indigo-50 text-indigo-700', text: 'indigo', label: 'Nurses (RN)' },
    'RN': { bg: 'bg-indigo-50 text-indigo-700', text: 'indigo', label: 'Nurses (RN)' },
    'Senior Carer': { bg: 'bg-teal-50 text-teal-700', text: 'teal', label: 'Senior Carers' },
    'Care Assistant': { bg: 'bg-amber-50 text-amber-700', text: 'amber', label: 'Care Assistants' },
    'HCA': { bg: 'bg-amber-50 text-amber-700', text: 'amber', label: 'Care Assistants' },
    'Carer': { bg: 'bg-amber-50 text-amber-700', text: 'amber', label: 'Care Assistants' },
    'Chef': { bg: 'bg-orange-50 text-orange-700', text: 'orange', label: 'Kitchen / Catering' },
    'Housekeeper': { bg: 'bg-pink-50 text-pink-700', text: 'pink', label: 'Housekeeping' },
  };

  const getRoleStyle = (role: string) => {
    // fuzzy match role
    for (const [key, value] of Object.entries(roleStyling)) {
      if (role.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return { bg: 'bg-slate/5 text-slate', text: 'slate', label: role };
  };

  const totalRoleCost = roles.reduce((sum, [, amt]) => sum + amt, 0);

  return (
    <div className="bg-white border border-slate/15 rounded-xl shadow-sm transition-all overflow-hidden">
      {/* Trigger Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate/5 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold/10 rounded-lg text-gold shrink-0">
            <BarChart3 size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-midnight text-base">Cost & Resource Analytics</h3>
            <p className="text-xs text-slate">Live role breakdowns, variance analysis, and schedule allocation.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate bg-slate/10 px-2.5 py-1 rounded-full">
            {roles.length} Roles Scheduled
          </span>
          {isOpen ? <ChevronUp size={18} className="text-slate" /> : <ChevronDown size={18} className="text-slate" />}
        </div>
      </button>

      {/* Analytics Content */}
      {isOpen && (
        <div className="border-t border-slate/10 bg-slate/[0.02] p-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Financial Health Cards */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold text-midnight uppercase tracking-wider mb-1">Financial Health</h4>
              
              {/* Avg Hourly Cost */}
              <div className="bg-white border border-slate/10 rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg shrink-0">
                  <Coins size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate uppercase">Avg. Hourly Cost</span>
                  <span className="text-lg font-bold text-midnight">
                    {scheduledHours > 0 ? formatCurrency(projectedCost / scheduledHours) : formatCurrency(0)}
                  </span>
                </div>
              </div>

              {/* Resource efficiency */}
              <div className="bg-white border border-slate/10 rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="p-2.5 bg-amethyst/10 text-amethyst rounded-lg shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate uppercase">Contract Utilisation</span>
                  <span className="text-lg font-bold text-midnight">
                    {budgetedHours > 0 ? `${Math.round((scheduledHours / budgetedHours) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Alert context banner */}
              {isOverBudget ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-700">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold">Over Budget Threshold</span>
                    <span>The current rota is projected to exceed the pay period budget cap by {formatCurrency(variance)}. We recommend trimming redundant shifts.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-700">
                  <Clock size={18} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold">Budget Envelope Healthy</span>
                    <span>The current rota is securely within the budget cap. You have {formatCurrency(variance)} of buffer left to absorb float changes or emergencies.</span>
                  </div>
                </div>
              )}

            </div>

            {/* Column 2 & 3: Role Breakdown & Shares */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-midnight uppercase tracking-wider mb-1">Role Allocation & Cost Share</h4>
              
              <div className="bg-white border border-slate/10 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                {roles.length > 0 ? (
                  <div className="flex flex-col gap-3.5">
                    {roles.map(([roleName, costAmt]) => {
                      const styling = getRoleStyle(roleName);
                      const percentage = totalRoleCost > 0 ? Math.round((costAmt / totalRoleCost) * 100) : 0;

                      return (
                        <div key={roleName} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase", styling.bg)}>
                                {styling.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-semibold text-midnight">
                              <span>{formatCurrency(costAmt)}</span>
                              <span className="text-slate font-medium text-[10px]">({percentage}%)</span>
                            </div>
                          </div>
                          
                          {/* Sleek Mini Progress bar */}
                          <div className="w-full h-1.5 bg-slate/10 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                roleName.includes('Nurse') || roleName.includes('RN') ? "bg-indigo-500" :
                                roleName.includes('Senior') ? "bg-teal-500" : "bg-amber-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate text-xs gap-2">
                    <Users size={24} className="text-slate/40" />
                    <span>No active staff scheduled for this period yet.</span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

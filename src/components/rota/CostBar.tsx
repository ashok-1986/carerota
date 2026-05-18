import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface CostBarProps {
  projectedCost: number; // in GBP
  budgetCapGbp: number;   // in GBP
  variance: number;       // in GBP
  isOverBudget: boolean;
  capUtilisation: number; // e.g. 0.85 (85%)
  status: 'safe' | 'warning' | 'danger';
  scheduledHours: number;
  budgetedHours: number;
}

export function CostBar({
  projectedCost,
  budgetCapGbp,
  variance,
  isOverBudget,
  capUtilisation,
  status,
  scheduledHours,
  budgetedHours,
}: CostBarProps) {
  const percentUsed = Math.min(Math.round(capUtilisation * 100), 100);
  
  const statusColors = {
    safe: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      bar: 'bg-emerald-500',
      icon: CheckCircle,
      glow: 'shadow-emerald-500/20'
    },
    warning: {
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      bar: 'bg-amber-500',
      icon: AlertTriangle,
      glow: 'shadow-amber-500/20'
    },
    danger: {
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      bar: 'bg-rose-500',
      icon: Flame,
      glow: 'shadow-rose-500/20'
    }
  };

  const currentStatus = statusColors[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white border border-slate/15 rounded-xl p-6 shadow-sm flex flex-col gap-5 transition-all hover:shadow-md">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Projected Cost */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Projected Cost</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-midnight tracking-tight">
              {formatCurrency(projectedCost)}
            </span>
            <span className="text-xs text-slate font-medium">of {formatCurrency(budgetCapGbp)}</span>
          </div>
        </div>

        {/* Budget Cap Utilisation */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Utilisation</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-midnight tracking-tight">
              {Math.round(capUtilisation * 100)}%
            </span>
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors",
              currentStatus.bg
            )}>
              <StatusIcon size={12} className="shrink-0" />
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>

        {/* Variance */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Variance</span>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold tracking-tight",
              isOverBudget ? "text-rose-600" : "text-emerald-600"
            )}>
              {isOverBudget ? '-' : '+'}{formatCurrency(variance)}
            </span>
            <span className="text-xs text-slate font-medium">
              {isOverBudget ? 'over cap' : 'under cap'}
            </span>
          </div>
        </div>

        {/* Scheduled Hours */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Scheduled Hours</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-midnight tracking-tight">
              {Math.round(scheduledHours * 10) / 10}h
            </span>
            <span className="text-xs text-slate font-medium">
              budget: {Math.round(budgetedHours * 10) / 10}h
            </span>
          </div>
        </div>

      </div>

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-3.5 bg-slate/10 rounded-full overflow-hidden p-0.5 border border-slate/5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out shadow-sm",
              currentStatus.bar,
              currentStatus.glow
            )}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        
        {/* Helper status text */}
        <div className="flex justify-between items-center text-xs font-medium text-slate">
          <span>0%</span>
          {isOverBudget ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> Live schedule exceeds current budget cap by {formatCurrency(variance)}
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold">
              Remaining budget envelope: {formatCurrency(variance)}
            </span>
          )}
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

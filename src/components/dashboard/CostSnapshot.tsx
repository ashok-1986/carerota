"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Flame } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface CostSnapshotProps {
  projectedCost: number;
  budgetCap: number;
  homeName: string;
  salaryCost?: number;
  additionalCostTotal?: number;
}

export function CostSnapshot({ projectedCost, budgetCap, homeName, salaryCost = 0, additionalCostTotal = 0 }: CostSnapshotProps) {
  const hasData = projectedCost > 0;

  if (!hasData) {
    return (
      <div className="bg-white border border-slate/20 shadow-sm rounded-lg p-6 text-center">
        <p className="text-slate text-sm">No rota data for this period</p>
        <Link
          href="/rota"
          className="inline-flex items-center justify-center gap-2 mt-4 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-midnight hover:bg-gold/90 transition-colors"
        >
          Build Rota
        </Link>
      </div>
    );
  }

  const utilisation = Math.min((projectedCost / budgetCap) * 100, 100);
  const variance = projectedCost - budgetCap;
  const isOver = variance > 0;
  const isWarning = utilisation >= 85 && !isOver;

  const barColor = isOver ? "bg-danger" : isWarning ? "bg-warn" : "bg-teal";

  const statusBg = isOver ? "bg-danger/10 text-danger border-danger/20" : isWarning ? "bg-warn/10 text-warn border-warn/20" : "bg-teal/10 text-teal border-teal/20";
  const StatusIcon = isOver ? Flame : isWarning ? AlertTriangle : CheckCircle;
  const status = isOver ? 'over' : isWarning ? 'warning' : 'healthy';

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate/15">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-midnight/8 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-midnight">£</span>
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-midnight">Cost Snapshot</h3>
            <p className="text-xs text-slate mt-0.5">{homeName} · Current Period</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold", statusBg)}>
          <StatusIcon size={12} />
          <span className="capitalize">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white/50 rounded-xl p-4 border border-slate/10">
          <p className="text-[10px] text-slate uppercase tracking-wider font-medium mb-2">Total Cost</p>
          <p className={cn("text-xl font-display font-bold tracking-tight", isOver ? "text-danger" : "text-midnight")}>
            {formatCurrency(projectedCost)}
          </p>
          {additionalCostTotal > 0 && (
            <p className="text-[9px] text-slate/50 mt-1">
              {formatCurrency(salaryCost)} salary + {formatCurrency(additionalCostTotal)} additional
            </p>
          )}
        </div>
        <div className="bg-white/50 rounded-xl p-4 border border-slate/10 relative">
          <p className="text-[10px] text-slate uppercase tracking-wider font-medium mb-2">Budget Cap</p>
          <p className="text-xl font-display font-bold text-midnight tracking-tight">{formatCurrency(budgetCap)}</p>
          <Link href="/settings?tab=home" className="absolute top-4 right-4 text-[10px] font-medium text-gold-600 hover:text-gold-700 hover:underline">
            Edit cap &rarr;
          </Link>
        </div>
        <div className="bg-white/50 rounded-xl p-4 border border-slate/10">
          <p className="text-[10px] text-slate uppercase tracking-wider font-medium mb-2">Variance</p>
          <p className={cn("text-xl font-display font-bold tracking-tight", isOver ? "text-danger" : "text-teal")}>
            {isOver ? "+" : ""}{formatCurrency(Math.abs(variance))}
          </p>
          <p className="text-[10px] text-slate/60 mt-1">{isOver ? "over budget" : "under budget"}</p>
        </div>
      </div>

      {additionalCostTotal > 0 && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-gold/5 border border-gold/20 text-xs text-slate">
          Additional Costs: <span className="font-semibold text-midnight">{formatCurrency(additionalCostTotal)}</span>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate font-medium">Budget Utilisation</span>
          <span className={cn("font-display font-bold text-base", isOver ? "text-danger" : isWarning ? "text-warn" : "text-teal")}>
            {utilisation.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-slate/8 rounded-full overflow-hidden border border-slate/10">
          <motion.div
            className={cn("h-full rounded-full", barColor)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: utilisation / 100 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate/50 font-medium">
          <span>£0</span>
          <span>{formatCurrency(projectedCost)} of {formatCurrency(budgetCap)}</span>
          <span>{formatCurrency(budgetCap)}</span>
        </div>
      </div>
    </div>
  );
}

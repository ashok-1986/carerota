"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, Minus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface CostSnapshotProps {
  projectedCost: number;
  budgetCap: number;
  homeName: string;
}

export function CostSnapshot({ projectedCost, budgetCap, homeName }: CostSnapshotProps) {
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

  const BarIcon = isOver ? TrendingUp : isWarning ? TrendingUp : Minus;
  const barColor = isOver ? "bg-danger" : isWarning ? "bg-warn" : "bg-teal";

  return (
    <div className="glass-panel border border-slate/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-midnight">Cost Snapshot</h3>
          <p className="text-xs text-slate mt-0.5">{homeName} · Current Period</p>
        </div>
        <div className={cn("p-2 rounded-lg", isOver ? "bg-danger/10" : isWarning ? "bg-warn/10" : "bg-teal/10")}>
          <BarIcon className={cn("w-4 h-4", isOver ? "text-danger" : isWarning ? "text-warn" : "text-teal")} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate">Projected Cost</p>
          <p className={cn("text-xl font-bold mt-1", isOver ? "text-danger" : "text-midnight")}>
            {formatCurrency(projectedCost)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate">Budget Cap</p>
          <p className="text-xl font-bold text-midnight mt-1">{formatCurrency(budgetCap)}</p>
        </div>
        <div>
          <p className="text-xs text-slate">Variance</p>
          <p className={cn("text-xl font-bold mt-1", isOver ? "text-danger" : "text-teal")}>
            {isOver ? "+" : ""}{formatCurrency(variance)}
          </p>
          <p className="text-xs text-slate/60 mt-0.5">{isOver ? "over budget" : "under budget"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate">Budget Utilisation</span>
          <span className={cn("font-semibold", isOver ? "text-danger" : isWarning ? "text-warn" : "text-teal")}>
            {utilisation.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-slate/10 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", barColor)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: utilisation / 100 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>
        <p className="text-xs text-slate/60 text-right">
          {formatCurrency(projectedCost)} of {formatCurrency(budgetCap)}
        </p>
      </div>
    </div>
  );
}
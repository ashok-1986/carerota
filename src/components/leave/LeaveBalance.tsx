"use client";

import { useLeaveBalance } from "@/hooks/useLeave";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar } from "lucide-react";

type LeaveBalanceProps = {
  staffId: string;
  year?: number;
};

export function LeaveBalance({ staffId, year }: LeaveBalanceProps) {
  const { data, isLoading, isError } = useLeaveBalance(staffId, undefined, year);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate/10 bg-white p-4 shadow-sm space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-slate/10" />
        <div className="h-8 w-full animate-pulse rounded bg-slate/10" />
        <div className="flex justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-slate/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate/10" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-slate/10 bg-white p-4 shadow-sm text-center text-sm text-slate">
        Could not load leave balance
      </div>
    );
  }

  const { contractedAnnualLeave, approvedDays, remainingDays } = data;
  const pct = contractedAnnualLeave > 0 ? (approvedDays / contractedAnnualLeave) * 100 : 0;
  const isLow = remainingDays > 0 && remainingDays < 5;
  const isExhausted = remainingDays === 0 && contractedAnnualLeave > 0;

  return (
    <div className="rounded-xl border border-slate/10 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-slate" />
        <h4 className="text-sm font-bold text-midnight">Annual Leave Balance</h4>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate">
          <span>Used</span>
          <span>{approvedDays} / {contractedAnnualLeave} days</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-teal"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: pct / 100 }}
            style={{ transformOrigin: "left" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs">
        <div>
          <p className="text-slate">Entitlement</p>
          <p className="font-bold text-midnight">{contractedAnnualLeave} days</p>
        </div>
        <div className="text-center">
          <p className="text-slate">Used</p>
          <p className="font-bold text-midnight">{approvedDays} days</p>
        </div>
        <div className="text-right">
          <p className="text-slate">Remaining</p>
          <p className={`font-bold ${isExhausted ? "text-danger" : isLow ? "text-warn" : "text-midnight"}`}>
            {remainingDays} days
          </p>
        </div>
      </div>

      {isLow && (
        <div className="flex items-center gap-1.5 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">
          <AlertTriangle className="size-3 shrink-0" />
          Low remaining leave
        </div>
      )}

      {isExhausted && (
        <div className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="size-3 shrink-0" />
          No remaining leave
        </div>
      )}
    </div>
  );
}

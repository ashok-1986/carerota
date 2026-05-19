"use client";

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface CostBarProps {
  projectedCost: number;
  variance: number;
  isOverBudget: boolean;
  capUtilisation: number;
  status: 'safe' | 'warning' | 'danger';
  scheduledHours: number;
}

export function CostBar({
  projectedCost,
  variance,
  isOverBudget,
  capUtilisation,
  status,
  scheduledHours,
}: CostBarProps) {
  const statusColors = {
    safe: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      bar: 'bg-teal',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      bar: 'bg-gold',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      bar: 'bg-danger',
      icon: Flame,
    },
  };

  const scaleX = useMotionValue(Math.min(capUtilisation, 1));
  const springX = useSpring(scaleX, { stiffness: 80, damping: 20 });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scaleX.set(Math.min(capUtilisation, 1));
  }, [capUtilisation, scaleX]);

  useEffect(() => {
    return springX.on('change', (v) => {
      if (barRef.current) {
        barRef.current.style.width = `${Math.min(v * 100, 100)}%`;
      }
    });
  }, [springX]);

  const currentStatus = statusColors[status];
  const StatusIcon = currentStatus.icon;
  const clampedPercent = Math.min(capUtilisation * 100, 100);

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Projected Cost</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gold tracking-tight">
              {formatCurrency(projectedCost)}
            </span>
          </div>
        </div>

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

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Variance</span>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold tracking-tight",
              isOverBudget ? "text-danger" : "text-teal"
            )}>
              {isOverBudget ? '-' : '+'}{formatCurrency(variance)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Scheduled Hours</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-midnight tracking-tight">
              {Math.round(scheduledHours * 10) / 10}h
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2.5 bg-slate/10 rounded-full overflow-hidden border border-slate/5">
          <div
            ref={barRef}
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              currentStatus.bar
            )}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-medium text-slate">
          <span>0%</span>
          <span>{Math.round(capUtilisation * 100)}% of budget</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
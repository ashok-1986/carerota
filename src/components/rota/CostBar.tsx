"use client";

import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Flame, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useAdditionalCosts, useAddAdditionalCost, useDeleteAdditionalCost } from '@/hooks/useAdditionalCosts';

interface CostBarProps {
  projectedCost: number;
  variance: number;
  isOverBudget: boolean;
  capUtilisation: number;
  status: 'safe' | 'warning' | 'danger';
  scheduledHours: number;
  salaryCost: number;
  additionalCostTotal: number;
  rotaMonth: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  agency: 'Agency Staff',
  inventory: 'Inventory & Supplies',
  maintenance: 'Maintenance & Repairs',
  training: 'Training Costs',
  equipment: 'Equipment',
  other: 'Other',
};

export function CostBar({
  projectedCost,
  variance,
  isOverBudget,
  capUtilisation,
  status,
  scheduledHours,
  salaryCost,
  additionalCostTotal,
  rotaMonth,
}: CostBarProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formCategory, setFormCategory] = useState('agency');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');

  const { data: additionalData } = useAdditionalCosts(rotaMonth);
  const addCost = useAddAdditionalCost(rotaMonth);
  const deleteCost = useDeleteAdditionalCost(rotaMonth);

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
  const entries = additionalData?.entries ?? [];
  const categorySubtotals = additionalData?.categorySubtotals ?? {};

  const handleAddCost = () => {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0 || !formDescription.trim()) return;
    addCost.mutate({
      category: formCategory,
      description: formDescription.trim(),
      amount,
      rotaMonth,
    });
    setFormCategory('agency');
    setFormDescription('');
    setFormAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate tracking-wide uppercase">Total Cost</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gold tracking-tight">
              {formatCurrency(projectedCost)}
            </span>
          </div>
          {additionalCostTotal > 0 && (
            <span className="text-[10px] text-slate/60">
              {formatCurrency(salaryCost)} salary + {formatCurrency(additionalCostTotal)} additional
            </span>
          )}
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

      <div className="border-t border-slate/10 pt-3">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-2 text-sm font-semibold text-midnight hover:text-gold transition-colors"
        >
          {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Cost Breakdown
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate">Salary costs</span>
              <span className="font-semibold text-midnight">{formatCurrency(salaryCost)}</span>
            </div>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const amt = categorySubtotals[cat] ?? 0;
              if (amt === 0) return null;
              return (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-slate">{label}</span>
                  <span className="font-semibold text-midnight">{formatCurrency(amt)}</span>
                </div>
              );
            })}
            <div className="border-t border-slate/20 pt-2 flex items-center justify-between text-sm font-bold">
              <span className="text-midnight">TOTAL</span>
              <span className={cn(isOverBudget ? 'text-danger' : 'text-teal')}>
                {formatCurrency(projectedCost)} of {formatCurrency(72000)} cap
              </span>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/80 transition-colors mt-2"
            >
              <Plus size={14} />
              Add Cost
            </button>

            {showAddForm && (
              <div className="glass-card rounded-lg p-4 mt-3 border border-gold/20">
                <h4 className="text-sm font-semibold text-midnight mb-3">Add Cost Entry</h4>
                <div className="space-y-3">
                  <div>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm bg-white text-midnight"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Agency invoice #1234"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full rounded-lg border border-slate/20 px-3 py-2 text-sm bg-white text-midnight placeholder:text-slate/40"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate font-medium">&pound;</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate/20 pl-8 pr-3 py-2 text-sm bg-white text-midnight placeholder:text-slate/40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => { setShowAddForm(false); setFormCategory('agency'); setFormDescription(''); setFormAmount(''); }}
                      className="px-3 py-1.5 text-sm font-medium text-slate hover:text-midnight transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCost}
                      disabled={!formDescription.trim() || !formAmount || parseFloat(formAmount) <= 0}
                      className="px-4 py-1.5 text-sm font-semibold text-midnight bg-gold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                    >
                      Add Cost
                    </button>
                  </div>
                </div>
              </div>
            )}

            {entries.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/50 border border-slate/10">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-midnight/10 text-midnight">
                      {CATEGORY_LABELS[entry.category] ?? entry.category}
                    </span>
                    <span className="text-xs text-slate flex-1 truncate">{entry.description}</span>
                    <span className="text-xs font-semibold text-midnight">{formatCurrency(Number(entry.amount))}</span>
                    <button
                      onClick={() => deleteCost.mutate(entry.id)}
                      className="p-0.5 rounded text-slate/40 hover:text-danger transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

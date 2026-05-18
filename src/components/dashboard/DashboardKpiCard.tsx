"use client";

import { cn } from "@/lib/utils";
import { Users, Calendar, Clock, AlertTriangle } from "lucide-react";

type KpiCardProps = {
  iconName: "users" | "calendar" | "clock" | "alert-triangle";
  title: string;
  value: string;
  subtitle: string;
  color: "midnight" | "teal" | "gold" | "warn" | "danger" | "slate";
};

const ICON_MAP = {
  "users": Users,
  "calendar": Calendar,
  "clock": Clock,
  "alert-triangle": AlertTriangle,
} as const;

const colorMap = {
  midnight: "text-midnight",
  teal: "text-teal",
  gold: "text-gold",
  warn: "text-warn",
  danger: "text-danger",
  slate: "text-slate",
};

const iconBgMap = {
  midnight: "bg-midnight/10",
  teal: "bg-teal/10",
  gold: "bg-gold/10",
  warn: "bg-warn/10",
  danger: "bg-danger/10",
  slate: "bg-slate/10",
};

export function DashboardKpiCard({ iconName, title, value, subtitle, color }: KpiCardProps) {
  const Icon = ICON_MAP[iconName];
  return (
    <div className="bg-white border border-slate/20 shadow-sm rounded-lg p-5 flex items-start gap-4">
      <div className={cn("p-3 rounded-lg shrink-0", iconBgMap[color])}>
        <Icon className={cn("w-5 h-5", colorMap[color])} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate font-medium">{title}</p>
        <p className={cn("text-2xl font-bold mt-0.5", colorMap[color])}>{value}</p>
        <p className="text-xs text-slate/70 mt-1 truncate">{subtitle}</p>
      </div>
    </div>
  );
}
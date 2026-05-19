"use client";

import { useEffect, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Users, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type KpiCardProps = {
  iconName: "users" | "calendar" | "clock" | "alert-triangle";
  title: string;
  value: string;
  subtitle: string;
  color: "midnight" | "teal" | "gold" | "warn" | "danger" | "slate";
  href?: string;
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

function AnimatedCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 12 });

  useEffect(() => {
    motionVal.set(target);
  }, [target, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      setDisplay(Math.round(v));
    });
    return unsubscribe;
  }, [spring]);

  return <span>{display.toLocaleString()}</span>;
}

export function DashboardKpiCard({ iconName, title, value, subtitle, color, href }: KpiCardProps) {
  const Icon = ICON_MAP[iconName];
  const router = useRouter();

  const matched = value.match(/-?\d+(?:\.\d+)?/);
  const numeric = matched ? parseFloat(matched[0]) : NaN;
  const isNumeric = !isNaN(numeric) && isFinite(numeric);

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 flex items-start gap-4 transition-all duration-200",
        href ? "cursor-pointer hover:border-gold/30 hover:shadow-md" : ""
      )}
      onClick={href ? () => router.push(href) : undefined}
    >
      <div className={cn("p-3 rounded-lg shrink-0", iconBgMap[color])}>
        <Icon className={cn("w-5 h-5", colorMap[color])} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate font-medium">{title}</p>
        <p className={cn("text-3xl font-bold mt-0.5", colorMap[color])}>
          {isNumeric ? <AnimatedCounter target={numeric} /> : value}
        </p>
        <p className="text-xs text-slate/70 mt-1 truncate">{subtitle}</p>
      </div>
    </div>
  );
}
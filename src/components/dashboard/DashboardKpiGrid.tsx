"use client";

import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/animations";
import { DashboardKpiCard } from "./DashboardKpiCard";

export type KpiItem = {
  title: string;
  value: string;
  subtitle: string;
  iconName: "users" | "calendar" | "clock" | "alert-triangle";
  color: "midnight" | "teal" | "gold" | "warn" | "danger" | "slate";
  href?: string;
};

interface DashboardKpiGridProps {
  items: KpiItem[];
}

export function DashboardKpiGrid({ items }: DashboardKpiGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {items.map((item) => (
        <motion.div key={item.title} variants={listItem}>
          <DashboardKpiCard
            iconName={item.iconName}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
            color={item.color}
            href={item.href}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
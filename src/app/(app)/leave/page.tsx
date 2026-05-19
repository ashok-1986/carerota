"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, cardItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";
import { LeaveRequestList } from "@/components/leave/LeaveRequestList";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { useLeaveRequests } from "@/hooks/useLeave";
import { CalendarDays, ClipboardList, PlusCircle, ChevronLeft, ChevronRight, Users, CalendarCheck, Clock, Ban } from "lucide-react";

function SummaryStats() {
  const { data: totalRequests } = useLeaveRequests('all');
  const { data: pendingData } = useLeaveRequests('pending');

  const pending = pendingData?.length ?? 0;
  const total = totalRequests?.length ?? 0;
  const approved = totalRequests?.filter((r) => r.status === 'approved').length ?? 0;
  const declined = totalRequests?.filter((r) => r.status === 'declined').length ?? 0;

  const stats = [
    { label: 'Pending', value: pending, icon: Clock, bg: 'bg-warn/10', color: 'text-warn' },
    { label: 'Approved', value: approved, icon: CalendarCheck, bg: 'bg-teal/10', color: 'text-teal' },
    { label: 'Declined', value: declined, icon: Ban, bg: 'bg-danger/10', color: 'text-danger' },
    { label: 'Total', value: total, icon: Users, bg: 'bg-midnight/10', color: 'text-midnight' },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            variants={cardItem}
            className="glass-card flex items-center gap-3 rounded-xl p-4"
          >
            <div className={cn("flex size-10 items-center justify-center rounded-lg", s.bg)}>
              <Icon className={cn("size-5", s.color)} />
            </div>
            <div>
              <p className="text-xs text-slate">{s.label}</p>
              <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "requests" | "new">("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const tabs = [
    { id: "calendar", label: "Leave Timeline", icon: CalendarDays },
    { id: "requests", label: "Pending & History", icon: ClipboardList },
    { id: "new", label: "Request Leave", icon: PlusCircle },
  ] as const;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-7 bg-gold rounded-full" />
            <h1 className="text-3xl font-display font-semibold text-midnight tracking-tight">Leave Management</h1>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <p className="text-sm font-sans text-slate">
              Approve, decline, and track statutory annual leave balances and team absences.
            </p>
          </div>
        </div>
      </div>

      <SummaryStats />

      <div className="glass-card rounded-2xl p-1 flex gap-1 bg-white/50 border border-slate/15 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all font-sans cursor-pointer",
                isActive
                  ? "bg-midnight text-white shadow-sm"
                  : "text-slate hover:text-midnight hover:bg-slate/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {activeTab === "calendar" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-display font-semibold text-midnight">
                  {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </h3>
                <span className="text-xs text-slate/50 bg-slate/5 px-2 py-0.5 rounded-full">Team Leave</span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate/15 rounded-xl p-1">
                <button
                  onClick={() => {
                    const prev = new Date(calendarMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarMonth(prev);
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-slate hover:bg-slate/10 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                  className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-midnight hover:bg-slate/10 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(calendarMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarMonth(next);
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-slate hover:bg-slate/10 transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <LeaveCalendar month={calendarMonth} />
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-6">
            <LeaveRequestList isManager={true} />
          </div>
        )}

        {activeTab === "new" && (
          <div className="space-y-6">
            <LeaveRequestForm 
              isManager={true} 
              onSuccess={() => setActiveTab("calendar")} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

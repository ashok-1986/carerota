"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

type ShiftRow = {
  id: string;
  shiftDate: string;
  code: string | null;
  homeFloorId: string | null;
  isPublished: boolean;
  startTime?: string;
  endTime?: string;
};

type LeaveRequest = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function MyShiftsPage() {
  const { data: session } = useSession();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(endOfWeek(weekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: shifts = [] } = useQuery<ShiftRow[]>({
    queryKey: ["myShifts", dateFrom, dateTo],
    queryFn: async () => {
      const res = await fetch(`/api/my-shifts?start=${dateFrom}&end=${dateTo}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data as ShiftRow[];
    },
    enabled: !!session?.user?.id,
  });

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["myLeave", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/leave?staffId=${session?.user?.id}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data as LeaveRequest[];
    },
    enabled: !!session?.user?.id,
  });

  const weekDays = useMemo(() => {
    const days: { date: Date; label: string; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        date: d,
        label: format(d, "EEE"),
        dateStr: format(d, "yyyy-MM-dd"),
      });
    }
    return days;
  }, [weekStart]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, ShiftRow[]>();
    for (const s of shifts) {
      const existing = map.get(s.shiftDate) || [];
      existing.push(s);
      map.set(s.shiftDate, existing);
    }
    return map;
  }, [shifts]);

  const isOnLeave = (dateStr: string) =>
    leaveRequests.some(
      (lr) =>
        lr.status === "approved" &&
        dateStr >= lr.startDate &&
        dateStr <= lr.endDate,
    );

  const isToday = (date: Date) =>
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-[480px] space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight font-display">My Shifts</h1>
          <p className="text-xs text-slate">{session?.user?.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
            className="rounded-lg p-1.5 text-slate hover:bg-slate/10 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[120px] text-center text-xs font-medium text-midnight">
            {format(weekStart, "d MMM")} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d MMM")}
          </span>
          <button
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            className="rounded-lg p-1.5 text-slate hover:bg-slate/10 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dayShifts = shiftsByDate.get(day.dateStr) || [];
          const onLeave = isOnLeave(day.dateStr);

          return (
            <div
              key={day.dateStr}
              className={cn(
                "flex flex-col items-center rounded-lg p-1.5 text-center transition-colors",
                isToday(day.date) && "bg-gold/10 ring-1 ring-gold/30",
                !isToday(day.date) && "bg-white",
              )}
            >
              <span className="text-[10px] font-medium text-slate">{day.label}</span>
              <span className={cn("text-sm font-bold", isToday(day.date) ? "text-gold" : "text-midnight")}>
                {format(day.date, "d")}
              </span>
              {onLeave && (
                <span className="mt-0.5 rounded-full bg-amethyst/10 px-1.5 py-0.5 text-[8px] font-medium text-amethyst">
                  AL
                </span>
              )}
              {!onLeave && dayShifts.length > 0 && (
                <span className="mt-0.5 text-[8px] font-medium text-teal">
                  {dayShifts[0].code || "Shift"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-midnight">This Week</h2>
        {weekDays.map((day) => {
          const dayShifts = shiftsByDate.get(day.dateStr) || [];
          const onLeave = isOnLeave(day.dateStr);

          if (onLeave) {
            return (
              <div
                key={day.dateStr}
                className="flex items-center gap-3 rounded-xl border border-slate/10 bg-white p-3"
              >
                <div className="flex w-10 flex-col items-center">
                  <span className="text-[10px] font-medium text-slate">{format(day.date, "EEE")}</span>
                  <span className="text-lg font-bold text-midnight">{format(day.date, "d")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amethyst/10 px-2 py-0.5 text-[10px] font-medium text-amethyst">
                    Approved Leave
                  </span>
                </div>
              </div>
            );
          }

          if (dayShifts.length === 0) {
            return (
              <div
                key={day.dateStr}
                className="flex items-center gap-3 rounded-xl border border-slate/10 bg-white/50 p-3"
              >
                <div className="flex w-10 flex-col items-center">
                  <span className="text-[10px] font-medium text-slate">{format(day.date, "EEE")}</span>
                  <span className="text-lg font-bold text-midnight">{format(day.date, "d")}</span>
                </div>
                <span className="text-xs text-slate/50">No shift</span>
              </div>
            );
          }

          return dayShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center gap-3 rounded-xl border border-slate/10 bg-white p-3"
            >
              <div className="flex w-10 flex-col items-center">
                <span className="text-[10px] font-medium text-slate">{format(day.date, "EEE")}</span>
                <span className="text-lg font-bold text-midnight">{format(day.date, "d")}</span>
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-slate" />
                    <span className="text-xs font-medium text-midnight">{shift.code || "Shift"}</span>
                  </div>
                  {shift.homeFloorId && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-slate" />
                      <span className="text-[10px] text-slate">Floor</span>
                    </div>
                  )}
                </div>
                {shift.isPublished ? (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-medium text-teal">
                    Published
                  </span>
                ) : (
                  <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn">
                    Draft
                  </span>
                )}
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}

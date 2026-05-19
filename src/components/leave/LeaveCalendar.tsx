"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, isSameMonth, isSameDay, parseISO } from "date-fns";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type LeaveDay = {
  date: string;
  staffName: string;
  leaveType: string;
};

const dotColors: Record<string, string> = {
  AL: "bg-gold",
  ML: "bg-amethyst",
  sick: "bg-slate",
  paternity: "bg-amethyst",
  compassionate: "bg-slate",
  other: "bg-slate",
};

const legendItems = [
  { label: "AL", color: "bg-gold" },
  { label: "ML", color: "bg-amethyst" },
  { label: "Sick", color: "bg-slate" },
];

type LeaveCalendarProps = {
  month: Date;
};

function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export function LeaveCalendar({ month }: LeaveCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = format(monthStart, "yyyy-MM-dd");
  const endDate = format(monthEnd, "yyyy-MM-dd");

  const { data: leaveDays = [] } = useQuery<LeaveDay[]>({
    queryKey: ["leaveCalendar", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/leave?status=approved&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) return [];
      const json = await res.json();
      const days: LeaveDay[] = [];
      for (const req of json.data) {
        const s = parseISO(req.startDate);
        const e = parseISO(req.endDate);
        const current = new Date(s);
        while (current <= e) {
          days.push({
            date: format(current, "yyyy-MM-dd"),
            staffName: req.staffName,
            leaveType: req.leaveType,
          });
          current.setDate(current.getDate() + 1);
        }
      }
      return days;
    },
  });

  const firstMonday = getMondayOfWeek(monthStart);

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const cursor = new Date(firstMonday);
  
  for (let i = 0; i < 42; i++) {
    currentWeek.push(new Date(cursor));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <TooltipProvider>
      <div className="glass-card rounded-2xl p-5 border border-slate/15">
        <div className="rounded-xl bg-white/50 overflow-hidden border border-slate/10">
          <div className="grid grid-cols-7 gap-0">
            {dayNames.map((name) => (
              <div key={name} className="text-[10px] font-semibold text-slate uppercase tracking-wider text-center py-2.5 bg-midnight/5 border-b border-slate/10">
                {name}
              </div>
            ))}

          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, new Date());
              const dayLeave = leaveDays.filter((ld) => ld.date === dateStr);

              return (
                <div
                  key={`${wi}-${di}`}
                  className={cn(
                    "relative min-h-[44px] border border-slate/5 p-1 text-center transition-colors",
                    isCurrentMonth ? "bg-white" : "bg-slate/5",
                    isToday && "ring-1 ring-gold/50",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      isCurrentMonth ? "text-midnight" : "text-slate/30",
                      isToday && "font-bold text-gold",
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {dayLeave.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                      {dayLeave.slice(0, 4).map((ld, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger>
                            <span
                              className={cn(
                                "inline-block size-1.5 rounded-full cursor-pointer",
                                dotColors[ld.leaveType] || "bg-slate",
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[11px]">
                            {ld.staffName} — {ld.leaveType}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayLeave.length > 4 && (
                        <span className="text-[8px] text-slate/50">+{dayLeave.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate/10">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={cn("inline-block size-2.5 rounded-full", item.color)} />
                <span className="text-[11px] text-slate font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

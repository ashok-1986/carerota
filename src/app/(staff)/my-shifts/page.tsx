"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";

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
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

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

  const handleLeaveRequestSuccess = () => {
    setIsLeaveDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["myLeave"] });
  };

  return (
    <div className="mx-auto max-w-[480px] space-y-6 px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-midnight font-display">My Shifts</h1>
          <p className="text-xs text-slate">{session?.user?.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
            className="rounded-lg p-2 text-slate hover:bg-slate/10 transition-colors h-11 w-11 flex items-center justify-center cursor-pointer"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-[110px] text-center text-xs font-semibold text-midnight">
            {format(weekStart, "d MMM")} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d MMM")}
          </span>
          <button
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            className="rounded-lg p-2 text-slate hover:bg-slate/10 transition-colors h-11 w-11 flex items-center justify-center cursor-pointer"
            aria-label="Next week"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const dayShifts = shiftsByDate.get(day.dateStr) || [];
          const onLeave = isOnLeave(day.dateStr);

          return (
            <div
              key={day.dateStr}
              className={cn(
                "flex flex-col items-center rounded-xl p-2 text-center transition-all border",
                isToday(day.date) 
                  ? "bg-gold/15 border-gold ring-1 ring-gold/40 shadow-sm" 
                  : "bg-white border-slate-100"
              )}
            >
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider">{day.label}</span>
              <span className={cn("text-base font-extrabold mt-0.5", isToday(day.date) ? "text-gold-600" : "text-midnight")}>
                {format(day.date, "d")}
              </span>
              {onLeave && (
                <span className="mt-1 rounded-full bg-amethyst/10 px-2 py-0.5 text-[9px] font-bold text-amethyst">
                  AL
                </span>
              )}
              {!onLeave && dayShifts.length > 0 && (
                <span className="mt-1 text-[9px] font-bold text-teal">
                  {dayShifts[0].code || "Shift"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Shifts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-midnight uppercase tracking-wider">This Week</h2>
          <a href="/api/staff/me/export" download className="text-[10px] text-slate hover:text-midnight transition-colors font-medium">
            Download my data (GDPR)
          </a>
        </div>

        {weekDays.map((day) => {
          const dayShifts = shiftsByDate.get(day.dateStr) || [];
          const onLeave = isOnLeave(day.dateStr);

          if (onLeave) {
            return (
              <div
                key={day.dateStr}
                className="flex items-center gap-4 rounded-2xl border border-amethyst/20 bg-amethyst/5 p-4 shadow-sm"
              >
                <div className="flex w-12 flex-col items-center shrink-0 border-r border-slate-100 pr-3">
                  <span className="text-[10px] font-bold text-slate uppercase">{format(day.date, "EEE")}</span>
                  <span className="text-xl font-black text-midnight">{format(day.date, "d")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amethyst/10 border border-amethyst/30 px-2.5 py-0.5 text-xs font-semibold text-amethyst">
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
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white/40 p-4"
              >
                <div className="flex w-12 flex-col items-center shrink-0 border-r border-slate-100 pr-3">
                  <span className="text-[10px] font-bold text-slate/40 uppercase">{format(day.date, "EEE")}</span>
                  <span className="text-xl font-black text-midnight/40">{format(day.date, "d")}</span>
                </div>
                <span className="text-xs text-slate-400 italic">No shift scheduled</span>
              </div>
            );
          }

          return dayShifts.map((shift) => (
            <div
              key={shift.id}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm",
                isToday(day.date) ? "border-gold" : "border-slate-150"
              )}
            >
              <div className="flex w-12 flex-col items-center shrink-0 border-r border-slate-100 pr-3">
                <span className="text-[10px] font-bold text-slate uppercase">{format(day.date, "EEE")}</span>
                <span className="text-xl font-black text-midnight">{format(day.date, "d")}</span>
              </div>
              <div className="flex flex-1 items-center justify-between min-w-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm font-bold text-midnight truncate">{shift.code || "Shift"}</span>
                  </div>
                  {shift.homeFloorId && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate">Floor Roster</span>
                    </div>
                  )}
                </div>
                {shift.isPublished ? (
                  <span className="rounded-full bg-teal/10 border border-teal/20 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase tracking-wider shrink-0">
                    Published
                  </span>
                ) : (
                  <span className="rounded-full bg-warn/10 border border-warn/20 px-2.5 py-0.5 text-[10px] font-bold text-warn uppercase tracking-wider shrink-0">
                    Draft
                  </span>
                )}
              </div>
            </div>
          ));
        })}
      </div>

      {/* Prominent Leave Request Button at Bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-[480px] mx-auto z-30">
        <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
          <DialogTrigger render={
            <button className="w-full bg-gold hover:bg-gold/90 text-midnight font-bold h-12 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-gold/40">
              <Plus className="w-4 h-4" />
              Request Leave
            </button>
          } />
          <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xl">
            <DialogHeader className="p-4 border-b border-slate-100 bg-slate-50">
              <DialogTitle className="text-base font-bold text-midnight font-sans">Submit Leave Request</DialogTitle>
            </DialogHeader>
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              <LeaveRequestForm 
                fixedStaffId={session?.user?.id} 
                isManager={false} 
                onSuccess={handleLeaveRequestSuccess} 
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

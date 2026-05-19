"use client";

import { motion } from "framer-motion";
import { listItem } from "@/lib/animations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Calendar, CalendarDays } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link";

type LeaveRequestCardProps = {
  request: {
    id: string;
    staffId?: string;
    staffName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
    requestedAt: Date | string;
    reviewedBy?: string | null;
    reviewedAt?: Date | string | null;
    notes?: string | null;
    homeFloorId?: string | null;
  };
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  isManager: boolean;
};

const leaveTypeStyles: Record<string, { label: string; className: string }> = {
  AL: { label: "Annual Leave", className: "bg-gold/10 text-gold border-gold/20" },
  ML: { label: "Maternity Leave", className: "bg-amethyst/10 text-amethyst border-amethyst/20" },
  SL: { label: "Sick Leave", className: "bg-danger/10 text-danger border-danger/20" },
  PL: { label: "Paternity Leave", className: "bg-amethyst/10 text-amethyst border-amethyst/20" },
  sick: { label: "Sick Leave", className: "bg-danger/10 text-danger border-danger/20" },
  paternity: { label: "Paternity Leave", className: "bg-amethyst/10 text-amethyst border-amethyst/20" },
  compassionate: { label: "Compassionate Leave", className: "bg-slate/10 text-slate border-slate/20" },
  other: { label: "Other", className: "bg-slate/10 text-slate border-slate/20" },
};

const statusStyles: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-teal/10 text-teal border-teal/20" },
  declined: { label: "Declined", className: "bg-danger/10 text-danger border-danger/20" },
  pending: { label: "Pending", className: "bg-gold/10 text-gold border-gold/20" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return `${format(start, "d MMM yyyy")} — ${format(end, "d MMM yyyy")} (${days} day${days !== 1 ? "s" : ""})`;
}

export function LeaveRequestCard({ request, onApprove, onDecline, isManager }: LeaveRequestCardProps) {
  const typeStyle = leaveTypeStyles[request.leaveType] || leaveTypeStyles.other;
  const statusStyle = statusStyles[request.status] || statusStyles.pending;
  const requestedAt = typeof request.requestedAt === "string" ? parseISO(request.requestedAt) : request.requestedAt;

  return (
    <motion.div
      variants={listItem}
      className="flex items-center gap-4 rounded-2xl border border-slate/15 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <Avatar className="size-11 bg-midnight shrink-0 shadow-sm">
        <AvatarFallback className="bg-midnight text-white text-xs font-bold">
          {getInitials(request.staffName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {request.staffId ? (
            <Link
              href={`/staff/${request.staffId}`}
              className="text-sm font-semibold text-midnight hover:text-gold transition-colors flex items-center gap-1 group"
            >
              {request.staffName}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 opacity-0 group-hover:opacity-100">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <span className="text-sm font-bold text-midnight">{request.staffName}</span>
          )}
          <Badge variant="outline" className={`text-[11px] font-semibold px-2.5 py-0.5 ${typeStyle.className}`}>
            {typeStyle.label}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 ${statusStyle.className}`}>
            {statusStyle.label}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate mt-1.5">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatDateRange(request.startDate, request.endDate)}</span>
        </div>

        {request.notes && (
          <p className="text-xs text-slate italic mt-1">{request.notes}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <p className="text-[11px] text-slate/50">
            Requested {formatDistanceToNow(requestedAt, { addSuffix: true })}
          </p>
          {request.staffId && (
            <Link
              href={`/rota?staff=${request.staffId}`}
              className="text-[11px] text-teal hover:text-gold transition-colors flex items-center gap-1 font-medium"
              title="View this staff member's rota"
            >
              <CalendarDays className="h-3 w-3" />
              View rota
            </Link>
          )}
        </div>
      </div>

      {isManager && request.status === "pending" ? (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="default"
            className="bg-teal hover:bg-teal/90 text-white rounded-xl shadow-sm"
            onClick={() => onApprove?.(request.id)}
          >
            <Check className="size-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-danger/30 text-danger hover:bg-danger/10 rounded-xl"
            onClick={() => onDecline?.(request.id)}
          >
            <X className="size-3.5 mr-1" />
            Decline
          </Button>
        </div>
      ) : (
        <div className="shrink-0 text-right">
          {request.reviewedBy && (
            <p className="text-[10px] text-slate/50 mt-1">
              Reviewed: {request.reviewedAt ? format(parseISO(request.reviewedAt as string), "d MMM") : ""}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

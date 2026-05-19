import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { staff, leaveRequests, rotaEntries, homes, shiftCodes } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getPayPeriod } from "@/lib/utils";
import { DashboardKpiGrid, type KpiItem } from "@/components/dashboard/DashboardKpiGrid";
import { CostSnapshot } from "@/components/dashboard/CostSnapshot";
import { Calendar, CalendarOff, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.homeId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate">No home assigned to your account.</p>
      </div>
    );
  }

  const homeId = session.user.homeId as string;

  const [[home], activeStaffRows, pendingLeaveRows] = await Promise.all([
    db.select().from(homes).where(eq(homes.id, homeId)).limit(1),
    db.select({ count: count() }).from(staff).where(and(eq(staff.homeId, homeId), eq(staff.isActive, true))),
    db.select({ count: count() }).from(leaveRequests).where(and(eq(leaveRequests.homeId, homeId), eq(leaveRequests.status, 'pending'))),
  ]);

  const activeStaffCount = Number(activeStaffRows[0]?.count ?? 0);

  const pendingLeaveCount = Number(pendingLeaveRows[0]?.count ?? 0);

  const payPeriod = getPayPeriod(Number(home?.payrollStartDay ?? 19));

  const allStaffForHome = await db.select({ id: staff.id, employmentType: staff.employmentType })
    .from(staff).where(eq(staff.homeId, homeId));

  const allEntries = await db.select({ isPublished: rotaEntries.isPublished })
    .from(rotaEntries)
    .where(eq(rotaEntries.homeId, homeId))
    .limit(1);

  const isPublished = allEntries.length > 0 && allEntries[0].isPublished;

  const budgetCap = Number(home?.budgetCapMonthly ?? 33500);

  const projectedCostResult = await db.execute(sql<{ total: number }>`
    SELECT SUM(
      CAST(${shiftCodes.hours} AS numeric) * CAST(${staff.payRateHourly} AS numeric)
    ) as total
    FROM rota_entries re
    JOIN staff ON re.staff_id = staff.id
    JOIN shift_codes ON re.shift_code_id = shift_codes.id
    WHERE re.home_id = ${homeId}
    AND re.is_published = true
  `);
  const projectedCostPence = Number(projectedCostResult.rows[0]?.total ?? 0);
  const projectedCost = projectedCostPence / 100;

  const kpiItems: KpiItem[] = [
    {
      title: "Active Staff",
      value: activeStaffCount.toString(),
      subtitle: `${allStaffForHome.filter(s => s.employmentType === 'bank').length} bank workers`,
      iconName: "users",
      color: "midnight",
      href: "/staff",
    },
    {
      title: "Rota Status",
      value: isPublished ? "Published" : "Draft",
      subtitle: payPeriod.label,
      iconName: "calendar",
      color: isPublished ? "teal" : "warn",
      href: "/rota",
    },
    {
      title: "Pending Leave",
      value: pendingLeaveCount.toString(),
      subtitle: "awaiting approval",
      iconName: "clock",
      color: pendingLeaveCount > 0 ? "gold" : "slate",
      href: "/leave",
    },
    {
      title: "Compliance Alerts",
      value: "0",
      subtitle: "0 critical",
      iconName: "alert-triangle",
      color: "slate",
      href: "/staff",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-7 bg-gold rounded-full" />
            <h1 className="text-3xl font-display font-semibold text-midnight tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <p className="text-sm font-sans text-slate">{payPeriod.label}</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 bg-white/60 border border-slate/15 rounded-xl px-4 py-2.5">
          <span className="text-xs text-slate font-medium">{home?.name ?? 'Care Home'}</span>
          <span className="text-slate/30">·</span>
          <span className="text-xs font-semibold text-midnight">{activeStaffCount} active staff</span>
        </div>
      </div>

      <DashboardKpiGrid items={kpiItems} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CostSnapshot
            projectedCost={projectedCost}
            budgetCap={budgetCap}
            homeName={home?.name ?? ""}
          />
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-midnight uppercase tracking-wider">Quick Actions</h2>
          <div className="space-y-2.5">
            <Link href="/rota" className="group flex items-center gap-3 w-full rounded-lg bg-midnight hover:bg-midnight/90 px-4 py-3.5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Build This Month&apos;s Rota</p>
                <p className="text-xs text-white/50">Plan & publish schedule</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/leave" className="group flex items-center gap-3 w-full rounded-lg border border-gold/30 bg-gold/5 hover:bg-gold/10 px-4 py-3.5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                <CalendarOff className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-midnight">Manage Leave Requests</p>
                <p className="text-xs text-slate">{pendingLeaveCount > 0 ? `${pendingLeaveCount} awaiting review` : 'All clear'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate/50 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/staff" className="group flex items-center gap-3 w-full rounded-lg border border-slate/20 bg-white hover:bg-pearl px-4 py-3.5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-midnight/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-midnight" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-midnight">Staff Directory</p>
                <p className="text-xs text-slate">{activeStaffCount} members</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate/50 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
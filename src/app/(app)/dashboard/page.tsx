import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { staff, leaveRequests, homes, shiftCodes, additionalCosts } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getPayPeriod } from "@/lib/utils";
import { DashboardKpiGrid, type KpiItem } from "@/components/dashboard/DashboardKpiGrid";
import { CostSnapshot } from "@/components/dashboard/CostSnapshot";
import { Calendar, ChevronRight, Users, Building2, UserCircle2, Briefcase } from "lucide-react";
import Link from "next/link";
import { getStaffByHome } from "@/db/queries/staff";
import { getRotaEntriesForPeriod } from "@/db/queries/rota";
import { Card } from "@/components/ui/card";

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
  const periodStart = payPeriod.start.toISOString().slice(0, 10);
  const periodEnd = payPeriod.end.toISOString().slice(0, 10);

  const allStaff = await getStaffByHome(homeId);
  const rotaEntriesList = await getRotaEntriesForPeriod(homeId, periodStart, periodEnd);

  const isPublished = rotaEntriesList.length > 0 && rotaEntriesList[0].isPublished;

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
  const projectedCostTotal = Number(projectedCostResult.rows[0]?.total ?? 0);
  const projectedCost = projectedCostTotal;

  const rotaMonth = periodStart;
  const additionalRows = await db
    .select({ amount: additionalCosts.amount })
    .from(additionalCosts)
    .where(and(
      eq(additionalCosts.homeId, homeId),
      eq(additionalCosts.rotaMonth, rotaMonth)
    ));
  const additionalCostTotal = additionalRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalCost = projectedCost + additionalCostTotal;

  // Group staff and shifts by floor
  const staffByFloor = allStaff.reduce((acc, s) => {
    if (!s.isActive) return acc;
    const floor = s.floorName || 'Unassigned';
    if (!acc[floor]) acc[floor] = { staffCount: 0, workShifts: 0, coveragePercent: 0 };
    acc[floor].staffCount++;
    return acc;
  }, {} as Record<string, { staffCount: number, workShifts: number, coveragePercent: number }>);

  rotaEntriesList.forEach(entry => {
    if (entry.category === 'work') {
      const staffMember = allStaff.find(s => s.id === entry.staffId);
      const floor = staffMember?.floorName || 'Unassigned';
      if (staffByFloor[floor]) {
        staffByFloor[floor].workShifts++;
      }
    }
  });

  Object.keys(staffByFloor).forEach(floor => {
    const data = staffByFloor[floor];
    // Assuming 15 expected shifts per staff member in a 4-week period
    const expected = data.staffCount * 15; 
    data.coveragePercent = expected > 0 ? Math.min(100, Math.round((data.workShifts / expected) * 100)) : 0;
  });

  // Staff Status
  const fullTimeCount = allStaff.filter(s => s.employmentType === 'full_time' && s.isActive).length;
  const partTimeCount = allStaff.filter(s => s.employmentType === 'part_time' && s.isActive).length;
  const bankCount = allStaff.filter(s => s.employmentType === 'bank' && s.isActive).length;

  const kpiItems: KpiItem[] = [
    {
      title: "Active Staff",
      value: activeStaffCount.toString(),
      subtitle: `${bankCount} bank workers`,
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
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
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

      {/* KPI Cards */}
      <DashboardKpiGrid items={kpiItems} />

      {/* Floor Coverage Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-midnight">Floor Coverage Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(staffByFloor).map(([floorName, stats]) => (
            <Card key={floorName} className="p-4 bg-white/60 border-slate/10 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate/60" />
                  <h3 className="text-sm font-bold text-midnight truncate" title={floorName}>{floorName}</h3>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate mb-0.5">Staff Assigned</p>
                  <p className="text-xl font-bold text-midnight">{stats.staffCount}</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate">Coverage</span>
                    <span className={`font-medium ${stats.coveragePercent > 80 ? 'text-teal' : stats.coveragePercent > 50 ? 'text-amber-500' : 'text-danger'}`}>
                      {stats.workShifts} shifts
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${stats.coveragePercent > 80 ? 'bg-teal' : stats.coveragePercent > 50 ? 'bg-amber-500' : 'bg-danger'}`}
                      style={{ width: `${stats.coveragePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cost & Staff Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CostSnapshot
            projectedCost={totalCost}
            salaryCost={projectedCost}
            additionalCostTotal={additionalCostTotal}
            budgetCap={budgetCap}
            homeName={home?.name ?? ""}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-white/60 border-slate/10">
            <h2 className="text-sm font-bold text-midnight uppercase tracking-wider mb-4">Staff Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal/5 border border-teal/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal/10">
                    <UserCircle2 className="w-4 h-4 text-teal" />
                  </div>
                  <span className="text-sm font-semibold text-midnight">Full-time</span>
                </div>
                <span className="text-lg font-bold text-teal">{fullTimeCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amethyst/5 border border-amethyst/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amethyst/10">
                    <Briefcase className="w-4 h-4 text-amethyst" />
                  </div>
                  <span className="text-sm font-semibold text-midnight">Part-time</span>
                </div>
                <span className="text-lg font-bold text-amethyst">{partTimeCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold/10">
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-midnight">Bank Workers</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{bankCount}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white/60 border-slate/10 space-y-4">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
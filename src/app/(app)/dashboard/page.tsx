import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { staff, leaveRequests, rotaEntries, homes, shiftCodes } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getPayPeriod } from "@/lib/utils";
import { Users, Calendar, Clock, AlertTriangle } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard";
import { CostSnapshot } from "@/components/dashboard/CostSnapshot";
import Link from "next/link";
import { staggerContainer, listItem } from "@/lib/animations";
import { motion } from "framer-motion";

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
  const projectedCost = Number(projectedCostResult.rows[0]?.total ?? 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-sans text-midnight">Dashboard</h1>
        <p className="text-sm text-slate mt-1">
          {payPeriod.label}
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <motion.div variants={listItem}>
          <DashboardKpiCard
            title="Active Staff"
            value={activeStaffCount.toString()}
            subtitle={`${allStaffForHome.filter(s => s.employmentType === 'bank').length} bank workers`}
            icon={Users}
            color="midnight"
          />
        </motion.div>

        <motion.div variants={listItem}>
          <DashboardKpiCard
            title="Rota Status"
            value={isPublished ? "Published" : "Draft"}
            subtitle={payPeriod.label}
            icon={Calendar}
            color={isPublished ? "teal" : "warn"}
          />
        </motion.div>

        <motion.div variants={listItem}>
          <DashboardKpiCard
            title="Pending Leave"
            value={pendingLeaveCount.toString()}
            subtitle="awaiting approval"
            icon={Clock}
            color={pendingLeaveCount > 0 ? "gold" : "slate"}
          />
        </motion.div>

        <motion.div variants={listItem}>
          <DashboardKpiCard
            title="Compliance Alerts"
            value="0"
            subtitle="0 critical"
            icon={AlertTriangle}
            color="slate"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CostSnapshot
            projectedCost={projectedCost}
            budgetCap={budgetCap}
            homeName={home?.name ?? ""}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-midnight">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/rota"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-midnight hover:bg-gold/90 transition-colors"
            >
              Build This Month&apos;s Rota
            </Link>
            <Link
              href="/leave"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-midnight px-4 py-3 text-sm font-semibold text-white hover:bg-midnight/90 transition-colors"
            >
              Manage Leave Requests
            </Link>
            <Link
              href="/staff"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate/30 bg-white px-4 py-3 text-sm font-semibold text-midnight hover:bg-slate/5 transition-colors"
            >
              Staff Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHomeById } from '@/db/queries/homes';
import { getFloors } from '@/db/queries/floors';
import { getStaffByHome } from '@/db/queries/staff';
import { getPayPeriod } from '@/lib/utils';
import { getStaffHoursSummary } from '@/db/queries/analytics';
import ExportDashboard from './ExportDashboard';

function getRecentPayPeriods(startDay: number = 19, count = 5) {
  const periods = [];
  let refDate = new Date();
  for (let i = 0; i < count; i++) {
    const period = getPayPeriod(startDay, refDate);
    periods.push({
      startStr: period.start.toISOString().slice(0, 10),
      endStr: period.end.toISOString().slice(0, 10),
      label: period.label,
    });
    // Go back 15 days prior to start to cross into previous pay period
    refDate = new Date(period.start.getTime() - 15 * 24 * 60 * 60 * 1000);
  }
  return periods;
}

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.homeId) {
    redirect('/login');
  }

  const { homeId } = session.user;

  const [home, floors, staff] = await Promise.all([
    getHomeById(homeId),
    getFloors(homeId),
    getStaffByHome(homeId),
  ]);

  if (!home) {
    return <div>Home not found</div>;
  }

  const periods = getRecentPayPeriods(Number(home.payrollStartDay ?? 19), 5);
  const currentPeriod = periods[0];

  // Fetch initial staff hours report data
  const initialHours = await getStaffHoursSummary(homeId, currentPeriod.startStr, currentPeriod.endStr);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Export & Reports</h1>
        <p className="text-slate-500 mt-2">Download payroll files, print noticeboards, and review staff hours.</p>
      </div>

      <ExportDashboard 
        floors={floors}
        staff={staff}
        periods={periods}
        initialHours={initialHours}
      />
    </div>
  );
}

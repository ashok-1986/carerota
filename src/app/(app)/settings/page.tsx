import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHomeById } from '@/db/queries/homes';
import { getFloors } from '@/db/queries/floors';
import { getStaffByHome } from '@/db/queries/staff';
import { getWebhooksByHome } from '@/db/queries/webhooks';
import SettingsTabs from './SettingsTabs';
import { db } from '@/lib/db';
import { auditLog } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.homeId) {
    redirect('/login');
  }

  const homeId = session.user.homeId;
  const [home, floors, staff, webhooks, lastExportLog] = await Promise.all([
    getHomeById(homeId),
    getFloors(homeId),
    getStaffByHome(homeId),
    getWebhooksByHome(homeId),
    db
      .select({ createdAt: auditLog.createdAt })
      .from(auditLog)
      .where(and(eq(auditLog.homeId, homeId), eq(auditLog.action, 'CSV_EXPORTED')))
      .orderBy(desc(auditLog.createdAt))
      .limit(1),
  ]);

  if (!home) {
    return <div>Home not found</div>;
  }

  const lastExportDate = lastExportLog && lastExportLog.length > 0
    ? lastExportLog[0].createdAt.toISOString()
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your home configuration, notifications, integrations, and data.</p>
      </div>

      <SettingsTabs 
        home={home}
        floors={floors}
        staff={staff}
        webhooks={webhooks}
        lastExportDate={lastExportDate}
      />
    </div>
  );
}

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHomeById } from '@/db/queries/homes';
import { getFloors } from '@/db/queries/floors';
import { getStaffByHome } from '@/db/queries/staff';
import { getWebhooksByHome } from '@/db/queries/webhooks';
import SettingsTabs from './SettingsTabs';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.homeId) {
    redirect('/login');
  }

  const homeId = session.user.homeId;
  const [home, floors, staff, webhooks] = await Promise.all([
    getHomeById(homeId),
    getFloors(homeId),
    getStaffByHome(homeId),
    getWebhooksByHome(homeId),
  ]);

  if (!home) {
    return <div>Home not found</div>;
  }

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
      />
    </div>
  );
}

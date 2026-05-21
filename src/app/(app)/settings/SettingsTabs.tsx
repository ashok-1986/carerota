'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import HomeTab from './tabs/HomeTab';
import NotificationsTab from './tabs/NotificationsTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import DataPrivacyTab from './tabs/DataPrivacyTab';

export type SettingsHome = { name?: string, budgetCapMonthly?: number | string | null, budgetNotes?: string | null, homeSettings?: unknown, [key: string]: unknown };
export type SettingsFloor = { id: string, name: string, [key: string]: unknown };
export type SettingsStaff = { id: string, role: string, payRateHourly?: number | string | null, homeFloorId: string | null, [key: string]: unknown };
export type SettingsWebhook = { id: string, url: string, description: string | null, events: string[], isActive: boolean | null, lastTriggeredAt: string | Date | null, [key: string]: unknown };

export default function SettingsTabs({ home, floors, staff, webhooks }: { home: SettingsHome, floors: SettingsFloor[], staff: SettingsStaff[], webhooks: SettingsWebhook[] }) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'home';

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="bg-white border border-slate-200">
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="data">Data & Privacy</TabsTrigger>
      </TabsList>

      <TabsContent value="home" className="space-y-6">
        <HomeTab home={home} floors={floors} staff={staff} />
      </TabsContent>
      
      <TabsContent value="notifications" className="space-y-6">
        <NotificationsTab home={home} />
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <IntegrationsTab webhooks={webhooks} />
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        <DataPrivacyTab />
      </TabsContent>
    </Tabs>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SettingsHome } from '../SettingsTabs';

const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) => (
  <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} className="h-4 w-4 text-gold-600 rounded" />
);

const toast = (args: Record<string, unknown>) => console.log('Toast:', args);

export default function NotificationsTab({ home }: { home: SettingsHome }) {
  
  const defaultSettings = {
    emailOnRotaPublish: true,
    emailOnLeaveRequest: true,
    emailOnLeaveApproval: true,
    gapAlertEnabled: true,
    gapAlertThreshold: 1,
    budgetWarningThreshold: 85,
  };

  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...(home.homeSettings || {})
  });

  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async (newSettings: Record<string, unknown>, showToast = false) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        if (showToast) toast({ title: 'Settings saved' });
      } else {
        toast({ title: 'Failed to save settings', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleToggle = (key: string, checked: boolean) => {
    const next = { ...settings, [key]: checked };
    setSettings(next);
    saveSettings(next, true); // auto-save on toggle
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: Number(value) });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage which events trigger automated emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Rota Published</Label>
              <p className="text-sm text-slate-500">Email staff when a new rota is published or updated.</p>
            </div>
            <Switch checked={settings.emailOnRotaPublish} onCheckedChange={(c: boolean) => handleToggle('emailOnRotaPublish', c)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Leave Requests</Label>
              <p className="text-sm text-slate-500">Email managers when a new leave request is submitted.</p>
            </div>
            <Switch checked={settings.emailOnLeaveRequest} onCheckedChange={(c: boolean) => handleToggle('emailOnLeaveRequest', c)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Leave Decisions</Label>
              <p className="text-sm text-slate-500">Email staff when their leave is approved or declined.</p>
            </div>
            <Switch checked={settings.emailOnLeaveApproval} onCheckedChange={(c: boolean) => handleToggle('emailOnLeaveApproval', c)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts & Warnings</CardTitle>
          <CardDescription>Configure operational warnings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Gap Alerts</Label>
              <p className="text-sm text-slate-500">Highlight shifts that fall below minimum staffing.</p>
            </div>
            <Switch checked={settings.gapAlertEnabled} onCheckedChange={(c: boolean) => handleToggle('gapAlertEnabled', c)} />
          </div>
          
          {settings.gapAlertEnabled && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-slate-100">
              <Label className="font-normal text-slate-600">Minimum staff threshold per shift</Label>
              <Input 
                type="number" 
                value={settings.gapAlertThreshold} 
                onChange={(e) => handleChange('gapAlertThreshold', e.target.value)} 
                className="w-24 text-right"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-0.5">
              <Label className="text-base">Budget Warning (%)</Label>
              <p className="text-sm text-slate-500">Turn cost bars amber when this percentage of the budget cap is reached.</p>
            </div>
            <Input 
              type="number" 
              value={settings.budgetWarningThreshold} 
              onChange={(e) => handleChange('budgetWarningThreshold', e.target.value)} 
              className="w-24 text-right"
              max={100}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <Button onClick={() => saveSettings(settings, true)} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

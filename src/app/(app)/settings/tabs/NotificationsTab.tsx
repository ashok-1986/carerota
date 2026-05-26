import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SettingsHome } from '../SettingsTabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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
    ...(home.homeSettings as Record<string, unknown> || {})
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
        if (showToast) {
          toast.success('Notification settings saved successfully');
        }
      } else {
        toast.error('Failed to save notification settings');
      }
    } catch {
      toast.error('Error saving notification settings');
    }
    setIsSaving(false);
  };

  const handleToggle = (key: string, checked: boolean) => {
    const next = { ...settings, [key]: checked };
    setSettings(next);
    saveSettings(next, true); // Auto-saves on toggle
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: Number(value) });
  };

  const handleSaveNumbers = () => {
    saveSettings(settings, true);
  };

  return (
    <div className="grid gap-6">
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Email Notifications</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Manage which events trigger automated emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-midnight block">Rota Published Email</Label>
              <p className="text-xs text-slate">Notify all staff when a new rota is published or updated.</p>
            </div>
            <Switch checked={settings.emailOnRotaPublish} onCheckedChange={(c: boolean) => handleToggle('emailOnRotaPublish', c)} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-midnight block">Leave Request Email</Label>
              <p className="text-xs text-slate">Notify manager when staff submit leave.</p>
            </div>
            <Switch checked={settings.emailOnLeaveRequest} onCheckedChange={(c: boolean) => handleToggle('emailOnLeaveRequest', c)} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-midnight block">Leave Approval Email</Label>
              <p className="text-xs text-slate">Notify staff when leave is approved or declined.</p>
            </div>
            <Switch checked={settings.emailOnLeaveApproval} onCheckedChange={(c: boolean) => handleToggle('emailOnLeaveApproval', c)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Alerts & Warnings</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Configure operational warnings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-midnight block">Gap Alerts</Label>
              <p className="text-xs text-slate">Alert when a shift has no staff assigned.</p>
            </div>
            <Switch checked={settings.gapAlertEnabled} onCheckedChange={(c: boolean) => handleToggle('gapAlertEnabled', c)} />
          </div>
          
          {settings.gapAlertEnabled && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-slate-200 py-1">
              <Label className="text-xs font-semibold text-slate uppercase tracking-wider">Minimum Staff per Shift</Label>
              <Input 
                type="number" 
                value={settings.gapAlertThreshold} 
                onChange={(e) => handleChange('gapAlertThreshold', e.target.value)} 
                className="w-24 text-right text-sm"
                min={0}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-midnight block">Budget Warning Threshold (%)</Label>
              <p className="text-xs text-slate">Show warning when cost reaches this % of cap.</p>
            </div>
            <Input 
              type="number" 
              value={settings.budgetWarningThreshold} 
              onChange={(e) => handleChange('budgetWarningThreshold', e.target.value)} 
              className="w-24 text-right text-sm"
              max={100}
              min={0}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <Button onClick={handleSaveNumbers} disabled={isSaving} className="bg-gold hover:bg-gold/90 text-midnight font-semibold h-11 px-6 rounded-lg transition-colors cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

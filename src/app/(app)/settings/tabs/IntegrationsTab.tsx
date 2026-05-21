import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SettingsWebhook } from '../SettingsTabs';

const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) => (
  <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} className="h-4 w-4 text-gold-600 rounded" />
);

// Fallback toast function
const toast = (args: Record<string, unknown>) => console.log('Toast:', args);

export default function IntegrationsTab({ webhooks }: { webhooks: SettingsWebhook[] }) {
  const [webhookList, setWebhookList] = useState<SettingsWebhook[]>(webhooks);
  const [isAdding, setIsAdding] = useState(false);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState('');

  const toggleEvent = (e: string) => {
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const handleAddWebhook = async () => {
    if (!newUrl.startsWith('https://')) {
      toast({ title: 'URL must start with https://', variant: 'destructive' });
      return;
    }
    if (events.length === 0) {
      toast({ title: 'Select at least one event', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, description: newDescription, events }),
      });
      const json = await res.json();
      if (res.ok) {
        setWebhookList([...webhookList, json.data]);
        setNewSecret(json.data.secret);
        toast({ title: 'Webhook created' });
      } else {
        toast({ title: 'Failed to create webhook', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error creating webhook', variant: 'destructive' });
    }
    setIsAdding(false);
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/settings/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        setWebhookList(webhookList.map((w: SettingsWebhook) => w.id === id ? { ...w, isActive } : w));
        toast({ title: isActive ? 'Webhook enabled' : 'Webhook disabled' });
      }
    } catch {
      toast({ title: 'Error updating webhook', variant: 'destructive' });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(`/api/settings/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhookList(webhookList.filter((w: SettingsWebhook) => w.id !== id));
        toast({ title: 'Webhook deleted' });
      }
    } catch {
      toast({ title: 'Error deleting webhook', variant: 'destructive' });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(newSecret);
    toast({ title: 'Secret copied to clipboard' });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Softworks CSV Export</CardTitle>
          <CardDescription>Export completed rotas for Softworks ingestion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-md border text-sm space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-medium text-green-700 flex items-center gap-1">● Active (manual CSV export)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Format</span>
              <span className="font-medium">DD/MM/YYYY · One row per staff per day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last export</span>
              <span className="font-medium">Never</span>
            </div>
          </div>
          <a href="/api/export/csv" target="_blank">
            <Button variant="outline" className="flex items-center gap-2">
              Go to Export <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Send real-time data to HQ, Power BI, or CQC tools.</CardDescription>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger className="bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors">
              Add Webhook
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Add Webhook</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {newSecret ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
                      Webhook created successfully!
                    </div>
                    <div className="space-y-2">
                      <Label>Signing Secret (HMAC SHA-256)</Label>
                      <p className="text-sm text-slate-500">Copy this secret now. You won&apos;t be able to see it again.</p>
                      <div className="flex items-center gap-2">
                        <Input value={newSecret} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={copySecret}><Copy className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Button onClick={() => { setIsSheetOpen(false); setNewSecret(''); setNewUrl(''); setEvents([]); }} className="w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input placeholder="https://api.example.com/webhook" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="Power BI Ingestion" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                      <Label>Events</Label>
                      <div className="space-y-2">
                        {[
                          { id: 'rota.published', label: 'Rota Published' },
                          { id: 'leave.approved', label: 'Leave Approved' },
                          { id: 'leave.declined', label: 'Leave Declined' },
                          { id: 'budget.updated', label: 'Budget Cap Changed' },
                        ].map(ev => (
                          <div key={ev.id} className="flex items-center space-x-2">
                            <Switch checked={events.includes(ev.id)} onCheckedChange={() => toggleEvent(ev.id)} />
                            <Label className="font-normal">{ev.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddWebhook} disabled={isAdding} className="w-full">
                      {isAdding ? 'Creating...' : 'Create Webhook'}
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          {webhookList.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border border-dashed rounded-md">
              No webhooks configured.
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {webhookList.map((w: SettingsWebhook) => (
                <div key={w.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{w.url}</div>
                    {w.description && <div className="text-xs text-slate-500">{w.description}</div>}
                    <div className="flex gap-1 pt-1">
                      {w.events && w.events.map((e: string) => (
                        <span key={e} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded uppercase font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 pt-1">
                      Last triggered: {w.lastTriggeredAt ? format(new Date(w.lastTriggeredAt), 'MMM d, yyyy HH:mm') : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={w.isActive ?? false} onCheckedChange={(c) => handleToggleWebhook(w.id, c)} />
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteWebhook(w.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Integrations</CardTitle>
          <CardDescription>We are constantly adding new native integrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {['CQC Reporting API', 'NHS Spine', 'Power BI Connector', 'Nourish / PCS'].map(int => (
              <div key={int} className="p-4 border rounded-md bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-600">{int}</span>
                <a href={`mailto:support@alchemetryx.com?subject=${int} Integration interest`}>
                  <Button variant="outline" size="sm">
                    Notify me
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

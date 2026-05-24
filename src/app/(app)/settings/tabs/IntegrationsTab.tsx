import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Copy, Trash2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { SettingsWebhook } from '../SettingsTabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Link from 'next/link';

interface IntegrationsTabProps {
  webhooks: SettingsWebhook[];
  lastExportDate: string | null;
}

export default function IntegrationsTab({ webhooks, lastExportDate }: IntegrationsTabProps) {
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
      toast.error('Endpoint URL must start with https://');
      return;
    }
    if (events.length === 0) {
      toast.error('Please select at least one event');
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
        toast.success('Webhook created successfully');
      } else {
        toast.error(json.error || 'Failed to create webhook');
      }
    } catch {
      toast.error('Error creating webhook');
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
        toast.success(isActive ? 'Webhook enabled' : 'Webhook disabled');
      } else {
        toast.error('Failed to update webhook');
      }
    } catch {
      toast.error('Error updating webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(`/api/settings/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhookList(webhookList.filter((w: SettingsWebhook) => w.id !== id));
        toast.success('Webhook deleted successfully');
      } else {
        toast.error('Failed to delete webhook');
      }
    } catch {
      toast.error('Error deleting webhook');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(newSecret);
    toast.success('Webhook secret copied to clipboard');
  };

  return (
    <div className="grid gap-6">
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Softworks CSV Export</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Export completed rotas for Softworks ingestion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-3 mb-4 max-w-md">
            <div className="flex justify-between items-center">
              <span className="text-slate font-medium">Status</span>
              <span className="font-semibold text-teal flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                Active (manual CSV export)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate font-medium">Format</span>
              <span className="font-semibold text-midnight">DD/MM/YYYY · One row per staff per day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate font-medium">Last export</span>
              <span className="font-semibold text-midnight">
                {lastExportDate ? format(new Date(lastExportDate), 'dd MMM yyyy HH:mm') : 'Never'}
              </span>
            </div>
          </div>
          <Link href="/export">
            <Button variant="outline" className="flex items-center gap-2 border-slate-200 text-midnight font-semibold cursor-pointer">
              Go to Export <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold font-sans text-midnight">Webhooks</CardTitle>
            <CardDescription className="text-sm text-slate-500 font-sans">Send real-time data to HQ, Power BI, or CQC tools.</CardDescription>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              setNewSecret('');
              setNewUrl('');
              setNewDescription('');
              setEvents([]);
            }
          }}>
            <SheetTrigger render={
              <Button className="bg-midnight hover:bg-midnight/90 text-white font-semibold h-10 px-4 rounded-lg transition-colors cursor-pointer">
                Add Webhook
              </Button>
            } />
            <SheetContent className="w-[400px] sm:w-[540px] border-l border-slate-200">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-midnight font-sans">Add Webhook</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {newSecret ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Webhook created successfully!
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-midnight">Signing Secret (HMAC SHA-256)</Label>
                      <div className="flex items-center gap-2">
                        <Input value={newSecret} readOnly className="font-mono text-xs select-all" />
                        <Button variant="outline" size="icon" onClick={copySecret} className="border-slate-200"><Copy className="h-4 w-4" /></Button>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-danger mt-0.5" />
                        <div>
                          <p className="font-bold">Save this secret now — it won&apos;t be shown again</p>
                          <p className="mt-0.5 text-rose-700/80">Use this to verify payload signatures sent from CareRota.</p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => { setIsSheetOpen(false); setNewSecret(''); setNewUrl(''); setEvents([]); }} className="w-full bg-midnight hover:bg-midnight/90 text-white font-semibold cursor-pointer">
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-midnight">Endpoint URL (HTTPS only)</Label>
                      <Input placeholder="https://api.example.com/webhook" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-midnight">Description</Label>
                      <Input placeholder="Power BI Ingestion" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-semibold text-midnight block mb-2">Events to Subscribe</Label>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {[
                          { id: 'rota.published', label: 'Rota Published' },
                          { id: 'leave.approved', label: 'Leave Approved' },
                          { id: 'leave.declined', label: 'Leave Declined' },
                          { id: 'budget.updated', label: 'Budget Cap Changed' },
                          { id: 'staff.added', label: 'Staff Added' },
                        ].map(ev => (
                          <div key={ev.id} className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-midnight cursor-pointer" htmlFor={`check-${ev.id}`}>{ev.label}</Label>
                            <Switch id={`check-${ev.id}`} checked={events.includes(ev.id)} onCheckedChange={() => toggleEvent(ev.id)} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddWebhook} disabled={isAdding} className="w-full bg-gold hover:bg-gold/90 text-midnight font-bold h-11 rounded-lg transition-colors cursor-pointer">
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
            <div className="text-center py-10 text-slate text-sm border border-dashed rounded-xl bg-slate-50/50">
              No webhooks configured.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y bg-white overflow-hidden">
              {webhookList.map((w: SettingsWebhook) => (
                <div key={w.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                  <div className="space-y-1.5 min-w-0 flex-1 mr-4">
                    <div className="font-semibold text-sm text-midnight truncate" title={w.url}>{w.url}</div>
                    {w.description && <div className="text-xs text-slate">{w.description}</div>}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {w.events && w.events.map((e: string) => (
                        <span key={e} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate text-[9px] rounded-full uppercase font-bold tracking-wider">
                          {e}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Last triggered: {w.lastTriggeredAt ? format(new Date(w.lastTriggeredAt), 'dd MMM yyyy HH:mm') : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Switch checked={w.isActive ?? false} onCheckedChange={(c) => handleToggleWebhook(w.id, c)} />
                    <Button variant="ghost" size="icon" className="text-danger hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer" onClick={() => handleDeleteWebhook(w.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Future Integrations</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Automate operations with native UK care system connectors.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['CQC Reporting API', 'NHS Spine', 'Power BI Connector', 'Nourish / PCS'].map(int => (
              <div key={int} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-midnight">{int}</span>
                <a href={`mailto:support@alchemetryx.com?subject=${int} Integration Interest`}>
                  <Button variant="outline" size="sm" className="border-slate-200 text-xs font-semibold cursor-pointer">
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

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit2, Check } from 'lucide-react';
import Link from 'next/link';
import { SettingsHome, SettingsFloor, SettingsStaff } from '../SettingsTabs';

const toast = (args: Record<string, unknown>) => console.log('Toast:', args);

export default function HomeTab({ home, floors, staff }: { home: SettingsHome, floors: SettingsFloor[], staff: SettingsStaff[] }) {
  
  const [budgetCap, setBudgetCap] = useState(home.budgetCapMonthly || '');
  const [budgetNotes, setBudgetNotes] = useState(home.budgetNotes || '');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const [floorData, setFloorData] = useState(floors);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState('');

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    try {
      const res = await fetch('/api/settings/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetCapMonthly: budgetCap ? parseFloat(String(budgetCap)) : null,
          budgetNotes,
        }),
      });
      if (res.ok) {
        toast({ title: 'Budget updated successfully' });
      } else {
        toast({ title: 'Failed to update budget', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error saving budget', variant: 'destructive' });
    }
    setIsSavingBudget(false);
  };

  const handleSaveFloor = async (floorId: string) => {
    if (!editFloorName.trim()) return;
    try {
      const res = await fetch(`/api/floors/${floorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFloorName }),
      });
      if (res.ok) {
        setFloorData((prev: SettingsFloor[]) => prev.map(f => f.id === floorId ? { ...f, name: editFloorName } : f));
        setEditingFloorId(null);
        toast({ title: 'Floor name updated' });
      } else {
        toast({ title: 'Failed to update floor', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error updating floor', variant: 'destructive' });
    }
  };

  // Calculate avg rates
  const roles = ['senior_caregiver', 'caregiver', 'bank'];
  const avgRates = roles.map(role => {
    const roleStaff = staff.filter((s: SettingsStaff) => s.role === role);
    const avg = roleStaff.length > 0 
      ? roleStaff.reduce((sum: number, s: SettingsStaff) => sum + Number(s.payRateHourly), 0) / roleStaff.length 
      : 0;
    return {
      role: role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      avg: avg.toFixed(2)
    };
  });

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Care Home Details</CardTitle>
          <CardDescription>Core details about this care home entity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500">Home Name</Label>
              <div className="font-medium">{home.name}</div>
            </div>
            <div>
              <Label className="text-slate-500">Pay Period</Label>
              <div className="font-medium">19th to 18th of each month</div>
            </div>
            <div>
              <Label className="text-slate-500">Time Zone</Label>
              <div className="font-medium">Europe/London</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
          <CardDescription>Configure the monthly staffing budget cap and add context for adjustments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>Monthly Budget Cap (£)</Label>
            <Input
              type="number"
              value={budgetCap}
              onChange={e => setBudgetCap(e.target.value)}
              step="100"
              min="0"
              placeholder="72000"
            />
            <p className="text-xs text-slate-500 mt-1">
              This cap appears on the rota cost bar and dashboard. Update when HQ adjusts the monthly staffing budget.
            </p>
          </div>
          <div className="space-y-2 max-w-lg">
            <Label>Budget Notes</Label>
            <Textarea
              value={budgetNotes}
              onChange={e => setBudgetNotes(e.target.value)}
              placeholder="e.g. April budget increased by £2,000 for bank holiday cover"
              maxLength={500}
            />
          </div>
          <Button onClick={handleSaveBudget} disabled={isSavingBudget}>
            {isSavingBudget ? 'Saving...' : 'Save Budget Configuration'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Floor Management</CardTitle>
          <CardDescription>Manage your home&apos;s floors and departments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md divide-y overflow-hidden">
            <div className="bg-slate-50 p-3 grid grid-cols-4 font-medium text-sm text-slate-500">
              <div className="col-span-2">Floor Name</div>
              <div>Staff Count</div>
              <div className="text-right">Actions</div>
            </div>
            {floorData.map((floor: SettingsFloor) => {
              const staffCount = staff.filter((s: SettingsStaff) => s.homeFloorId === floor.id).length;
              const isEditing = editingFloorId === floor.id;

              return (
                <div key={floor.id} className="p-3 grid grid-cols-4 items-center text-sm">
                  <div className="col-span-2 font-medium">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={editFloorName} 
                          onChange={e => setEditFloorName(e.target.value)} 
                          className="h-8 max-w-[200px]" 
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveFloor(floor.id);
                            if (e.key === 'Escape') setEditingFloorId(null);
                          }}
                        />
                        <button onClick={() => handleSaveFloor(floor.id)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{floor.name}</span>
                    )}
                  </div>
                  <div className="text-slate-500">{staffCount}</div>
                  <div className="text-right flex justify-end">
                    {!isEditing && (
                      <button 
                        onClick={() => {
                          setEditFloorName(floor.name);
                          setEditingFloorId(floor.id);
                        }}
                        className="text-gold-600 hover:text-gold-700 flex items-center gap-1 p-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pay Rate Defaults</CardTitle>
          <CardDescription>Average hourly rates based on current staff directory data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {avgRates.map(r => (
              <div key={r.role} className="p-4 bg-slate-50 rounded-lg border">
                <div className="text-sm font-medium text-slate-500 mb-1">{r.role}</div>
                <div className="text-2xl font-bold">£{r.avg}</div>
              </div>
            ))}
          </div>
          <Link href="/staff" className="text-sm text-gold-600 hover:underline font-medium">
            Edit individual pay rates in Staff Directory &rarr;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

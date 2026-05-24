import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit2, Check } from 'lucide-react';
import Link from 'next/link';
import { SettingsHome, SettingsFloor, SettingsStaff } from '../SettingsTabs';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function HomeTab({ home, floors, staff }: { home: SettingsHome, floors: SettingsFloor[], staff: SettingsStaff[] }) {
  const queryClient = useQueryClient();
  
  const [budgetCap, setBudgetCap] = useState(home.budgetCapMonthly || '');
  const [budgetNotes, setBudgetNotes] = useState(home.budgetNotes || '');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const [floorData, setFloorData] = useState(floors);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState('');

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success('Budget Settings saved successfully');
        // Invalidate queries so that dashboard/rota cost calculations reflect changes immediately
        queryClient.invalidateQueries({ queryKey: ['homeDetails'] });
        queryClient.invalidateQueries({ queryKey: ['rota'] });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update budget settings');
      }
    } catch {
      toast.error('Error saving budget settings');
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
        toast.success('Floor name updated successfully');
        queryClient.invalidateQueries({ queryKey: ['floors'] });
      } else {
        toast.error('Failed to update floor');
      }
    } catch {
      toast.error('Error updating floor');
    }
  };

  // Calculate avg hourly rate and staff count dynamically from staff directory data
  const roleGroups = staff.reduce((acc, s) => {
    const role = s.role;
    if (!acc[role]) {
      acc[role] = { totalRate: 0, count: 0 };
    }
    if (s.payRateHourly) {
      acc[role].totalRate += Number(s.payRateHourly);
    }
    acc[role].count++;
    return acc;
  }, {} as Record<string, { totalRate: number, count: number }>);

  const avgRates = Object.entries(roleGroups).map(([role, data]) => {
    const avg = data.count > 0 ? data.totalRate / data.count : 0;
    return {
      roleKey: role,
      role: role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      avg: avg.toFixed(2),
      count: data.count,
    };
  });

  return (
    <div className="grid gap-6">
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Care Home Details</CardTitle>
          <CardDescription className="text-sm text-slate-500">Core details about this care home entity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate">Home Name</Label>
              <div className="text-sm font-medium text-midnight mt-1">{home.name}</div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate">Pay Period</Label>
              <div className="text-sm font-medium text-midnight mt-1">19th to 18th of each month</div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate">Time Zone</Label>
              <div className="text-sm font-medium text-midnight mt-1">Europe/London</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Budget Configuration</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Configure the monthly staffing budget cap and add context for adjustments.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBudget} className="space-y-5">
            <div className="space-y-2 max-w-sm">
              <Label className="text-xs font-semibold text-midnight">Monthly Budget Cap (£)</Label>
              <Input
                type="number"
                name="budgetCapMonthly"
                value={budgetCap}
                onChange={e => setBudgetCap(e.target.value)}
                step="100"
                min="0"
                className="text-sm"
              />
            </div>
            <div className="space-y-2 max-w-lg">
              <Label className="text-xs font-semibold text-midnight">Budget Notes</Label>
              <Textarea
                name="budgetNotes"
                value={budgetNotes}
                onChange={e => setBudgetNotes(e.target.value)}
                placeholder="e.g. April budget increased by £2,000 for bank holiday cover"
                maxLength={500}
                className="text-sm min-h-[100px]"
              />
            </div>
            <Button type="submit" disabled={isSavingBudget} className="bg-gold hover:bg-gold/90 text-midnight font-semibold h-11 px-6 rounded-lg transition-colors cursor-pointer">
              {isSavingBudget ? 'Saving...' : 'Save Budget Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Floor Management</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Manage your home&apos;s floors and departments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg divide-y overflow-hidden bg-white">
            <div className="bg-slate-50 p-3 grid grid-cols-4 font-bold text-xs text-slate uppercase tracking-wider">
              <div className="col-span-2">Floor Name</div>
              <div>Staff Count</div>
              <div className="text-right">Actions</div>
            </div>
            {floorData.map((floor: SettingsFloor) => {
              const staffCount = staff.filter((s: SettingsStaff) => s.homeFloorId === floor.id).length;
              const isEditing = editingFloorId === floor.id;

              return (
                <div key={floor.id} className="p-3.5 grid grid-cols-4 items-center text-sm">
                  <div className="col-span-2 font-semibold text-midnight">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={editFloorName} 
                          onChange={e => setEditFloorName(e.target.value)} 
                          className="h-8 max-w-[200px] text-sm" 
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveFloor(floor.id);
                            if (e.key === 'Escape') setEditingFloorId(null);
                          }}
                        />
                        <button onClick={() => handleSaveFloor(floor.id)} className="text-teal p-1.5 hover:bg-teal/5 rounded-lg transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{floor.name}</span>
                    )}
                  </div>
                  <div className="text-slate font-medium">{staffCount} staff</div>
                  <div className="text-right flex justify-end">
                    {!isEditing && (
                      <button 
                        onClick={() => {
                          setEditFloorName(floor.name);
                          setEditingFloorId(floor.id);
                        }}
                        className="text-gold hover:text-gold/90 flex items-center gap-1.5 p-1 text-xs font-semibold cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
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

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-sans text-midnight">Pay Rate Summary</CardTitle>
          <CardDescription className="text-sm text-slate-500 font-sans">Average hourly rates based on current staff directory data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {avgRates.map(r => (
              <div key={r.roleKey} className="p-4 bg-slate-55 rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">{r.role}</div>
                <div className="text-2xl font-bold text-midnight">£{r.avg}</div>
                <div className="text-[11px] text-slate-500 mt-1">{r.count} staff members</div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Link href="/staff" className="text-sm text-gold hover:text-gold/90 font-semibold flex items-center gap-1 transition-colors">
              Edit individual pay rates in Staff Directory &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

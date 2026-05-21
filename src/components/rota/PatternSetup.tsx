'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SHIFT_CODES } from '@/lib/constants';
import { Loader2, Calendar, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Staff {
  id: string;
  name: string;
  role: string;
  employmentType: string;
  homeFloorId: string | null;
}

interface PatternSetupProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  floorName?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || '';
}

export function PatternSetup({ isOpen, onClose, staffList, floorName = 'Care Home' }: PatternSetupProps) {
  const [patterns, setPatterns] = useState<Record<string, Record<number, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadPatterns() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/rota/pattern');
        if (!res.ok) throw new Error('Failed to load patterns');
        const data = await res.json();
        
        interface Pattern {
          staffId: string;
          dayOfWeek: number;
          code: string;
        }

        const patternMap: Record<string, Record<number, string>> = {};
        data.patterns.forEach((p: Pattern) => {
          if (!patternMap[p.staffId]) {
            patternMap[p.staffId] = {};
          }
          const shiftCodeObj = SHIFT_CODES.find(sc => sc.code === p.code);
          if (shiftCodeObj) {
            patternMap[p.staffId][p.dayOfWeek] = shiftCodeObj.code;
          }
        });
        setPatterns(patternMap);
      } catch (err) {
        toast.error((err as Error).message || 'Error loading patterns');
      } finally {
        setIsLoading(false);
      }
    }
    loadPatterns();
  }, [isOpen]);

  const handleCellChange = (staffId: string, dayOfWeek: number, shiftCode: string) => {
    setPatterns((prev) => {
      const staffPatterns = { ...(prev[staffId] || {}) };
      if (shiftCode === '') {
        delete staffPatterns[dayOfWeek];
      } else {
        staffPatterns[dayOfWeek] = shiftCode;
      }
      return {
        ...prev,
        [staffId]: staffPatterns,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadPatterns: Array<{ staffId: string; dayOfWeek: number; shiftCode: string | null }> = [];
      staffList.forEach((staff) => {
        const staffPatterns = patterns[staff.id] || {};
        DAYS_OF_WEEK.forEach((day) => {
          const code = staffPatterns[day.value];
          payloadPatterns.push({
            staffId: staff.id,
            dayOfWeek: day.value,
            shiftCode: code || null,
          });
        });
      });

      const res = await fetch('/api/rota/pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns: payloadPatterns }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success('Templates saved successfully!');
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save templates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col bg-white dark:bg-slate-900 border-t rounded-t-2xl shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 rounded-xl text-gold hidden sm:flex">
              <Calendar size={22} />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-slate dark:text-pearl">{floorName} — Weekly Patterns</SheetTitle>
              <SheetDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Set repeating weekly schedules. Apply with &apos;Fill from Patterns&apos;.
              </SheetDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving || isLoading} className="bg-gold hover:bg-gold/90 text-white font-medium gap-2 hidden sm:flex">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Templates'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>
        
        {/* Column Headers Sticky */}
        <div className="sticky top-[73px] z-10 bg-slate-50 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center">
          <div className="w-[200px] shrink-0 font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Staff Member
          </div>
          <div className="flex-1 flex items-center justify-between pl-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex-1 flex justify-center text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">
                {day.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
              <p className="text-sm font-medium text-slate-500">Loading pattern templates...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-slate-500">
                No staff on this floor. Add staff via Staff Directory first.
              </p>
            </div>
          ) : (
            <div className="flex flex-col pb-10">
              {staffList.map((staff, idx) => (
                <div 
                  key={staff.id} 
                  className={cn(
                    "flex items-center min-h-[56px] border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors",
                    idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/10'
                  )}
                >
                  <div className="w-[200px] shrink-0 py-2 pr-4 flex items-center gap-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {getInitials(staff.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={staff.name}>{staff.name}</span>
                      <span className="text-[10px] text-slate-500 truncate mt-0.5">
                        {staff.role.replace('_', ' ')} • {staff.employmentType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between pl-4">
                    {DAYS_OF_WEEK.map((day) => {
                      const currentShift = patterns[staff.id]?.[day.value] || '';
                      return (
                        <div key={day.value} className="flex-1 flex justify-center py-2">
                          <select
                            value={currentShift}
                            onChange={(e) => handleCellChange(staff.id, day.value, e.target.value)}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1 py-1 w-14 text-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none font-medium cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="">-</option>
                            {SHIFT_CODES.filter(sc => sc.category === 'work' || sc.code === 'RO').map((sc) => (
                              <option key={sc.code} value={sc.code}>
                                {sc.code}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Mobile Save Button */}
        <div className="sm:hidden p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Button onClick={handleSave} disabled={isSaving || isLoading} className="w-full bg-gold hover:bg-gold/90 text-white font-medium gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Templates'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

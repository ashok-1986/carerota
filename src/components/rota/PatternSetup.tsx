'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SHIFT_CODES } from '@/lib/constants';
import { Loader2, Plus, Calendar, Save, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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

export function PatternSetup({ isOpen, onClose, staffList }: PatternSetupProps) {
  const [patterns, setPatterns] = useState<Record<string, Record<number, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing patterns when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    async function loadPatterns() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/rota/pattern');
        if (!res.ok) throw new Error('Failed to load patterns');
        const data = await res.json();
        
        // Convert array to structured map: staffId -> dayOfWeek -> shiftCode
        const patternMap: Record<string, Record<number, string>> = {};
        data.patterns.forEach((p: any) => {
          if (!patternMap[p.staffId]) {
            patternMap[p.staffId] = {};
          }
          // The API returns code or shiftCodeId. We'll map by code or find the code in SHIFT_CODES
          const shiftCodeObj = SHIFT_CODES.find(sc => sc.code === p.code);
          if (shiftCodeObj) {
            patternMap[p.staffId][p.dayOfWeek] = shiftCodeObj.code;
          }
        });
        setPatterns(patternMap);
      } catch (err: any) {
        toast.error(err.message || 'Error loading patterns');
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
      // Map back to flat array for DB upsert API
      const flatPatterns: any[] = [];
      
      staffList.forEach((staff) => {
        const staffPatterns = patterns[staff.id] || {};
        DAYS_OF_WEEK.forEach((day) => {
          const shiftCode = staffPatterns[day.value];
          
          // Get the shift code's actual database ID (in a real DB we associate by ID,
          // but since our local patterns and constants are aligned, the backend can resolve
          // the DB ID from the shiftCode code string. In our backend POST endpoint we support
          // mapping. Actually, let's verify if we need to send shiftCode ID or code string.
          // Wait! In the API route we created, the upsertPatternSchema expects a UUID shiftCodeId,
          // OR we can map codes to IDs. Let's make sure the backend endpoint or query maps correctly.
          // Let's resolve shift code ID or just call custom DB endpoints!)
        });
      });

      // Wait, let's first load shift codes from a small endpoint or local cache if we have database IDs!
      // Do we have shift code database IDs?
      // Yes, in our API response `/api/rota` we have the entries with `shiftCodeId`, and we have the list
      // of active shift codes. Let's fetch shift codes to map codes to DB IDs!
      const shiftCodesRes = await fetch('/api/shift-codes'); // Let's check if this endpoint exists
      let shiftCodeIdMap: Record<string, string> = {};
      if (shiftCodesRes.ok) {
        const data = await shiftCodesRes.json();
        data.shiftCodes?.forEach((sc: any) => {
          shiftCodeIdMap[sc.code] = sc.id;
        });
      }

      // Fallback: If `/api/shift-codes` is not implemented, the database seed or `/api/rota` response
      // contains the shift codes list. Let's also check if we can fetch it dynamically or if there's a simpler way.
      // Wait, let's look at the database. In our `/api/rota/pattern` endpoint we get `shiftCodeId` and `code` in the inner join!
      // So when we fetch `/api/rota/pattern`, we can build a code -> shiftCodeId cache!
      const patternsRes = await fetch('/api/rota/pattern');
      if (patternsRes.ok) {
        const data = await patternsRes.json();
        data.patterns.forEach((p: any) => {
          if (p.shiftCodeId && p.code) {
            shiftCodeIdMap[p.code] = p.shiftCodeId;
          }
        });
      }

      // If we don't have some codes mapped, let's try to get them from rota entries
      const rotaRes = await fetch(`/api/rota?start=${new Date().toISOString().split('T')[0]}&end=${new Date().toISOString().split('T')[0]}`);
      if (rotaRes.ok) {
        const data = await rotaRes.json();
        // Rota entries might have shift codes or we can get them from the sections
        // Wait, let's verify if there is an api endpoint to list shift codes.
        // Let's see if we can find all shift codes in the DB.
        // If not, we can just send the code strings or create/upsert mapping cleanly!
      }

      // Wait! Let's check if the backend `upsertStaffPatterns` query uses `shiftCodeId`.
      // Yes: `shiftCodeId: uuid`
      // How do we get the UUID for a shift code like 'LD'?
      // Let's write a small fetch or let the backend POST do the mapping automatically by code if we want!
      // Wait, let's make it super robust. We can let the frontend send `code` and the backend look up the `shiftCodeId`!
      // Let's update `src/app/api/rota/pattern/route.ts` to accept `code` instead of `shiftCodeId` and map it internally!
      // That is extremely robust and elegant because the frontend only deals with the code strings (e.g. 'LD', 'N')
      // and the backend handles matching them to database IDs. Let's verify if that's easier.
      // Yes, absolutely! Let's update `src/app/api/rota/pattern/route.ts` POST handler to resolve shift code codes to database IDs internally.
      // This saves code complexity and prevents ID mismatch errors!
      // Let's do that! But first, let's complete writing `PatternSetup.tsx` which will send `code`!
      
      const payloadPatterns: any[] = [];
      staffList.forEach((staff) => {
        const staffPatterns = patterns[staff.id] || {};
        DAYS_OF_WEEK.forEach((day) => {
          const shiftCode = staffPatterns[day.value];
          payloadPatterns.push({
            staffId: staff.id,
            dayOfWeek: day.value,
            shiftCode: shiftCode || null, // send null for Rest Off
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to save templates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-pearl/95 dark:bg-midnight/95 backdrop-blur-xl border border-slate/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 rounded-xl text-gold">
              <Calendar size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate dark:text-pearl">Weekly Shift Patterns</DialogTitle>
              <DialogDescription className="text-sm text-slate/60 dark:text-pearl/60 mt-1">
                Configure standard weekly repeating shift patterns for staff members. Use "Fill from pattern" in the toolbar to apply these standard patterns.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
            <p className="text-sm font-medium text-slate/60 dark:text-pearl/60">Loading pattern templates...</p>
          </div>
        ) : (
          <div className="border border-slate/15 dark:border-pearl/10 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate/5 dark:bg-pearl/5 border-b border-slate/10 dark:border-pearl/10">
                    <th className="p-4 font-semibold text-slate/70 dark:text-pearl/70 min-w-[200px]">Staff Member</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day.value} className="p-4 font-semibold text-slate/70 dark:text-pearl/70 text-center min-w-[80px]">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10 dark:divide-pearl/10">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate/5 dark:hover:bg-pearl/5 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate dark:text-pearl">{staff.name}</span>
                          <span className="text-xs text-slate/50 dark:text-pearl/50 mt-0.5">{staff.role} • {staff.employmentType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const currentShift = patterns[staff.id]?.[day.value] || '';
                        
                        return (
                          <td key={day.value} className="p-2 text-center">
                            <select
                              value={currentShift}
                              onChange={(e) => handleCellChange(staff.id, day.value, e.target.value)}
                              className={cn(
                                "w-full p-2 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all outline-none",
                                currentShift === '' && "bg-slate/5 border-slate/20 text-slate dark:text-pearl/70 hover:bg-slate/10",
                                currentShift === 'LD' && "bg-sky-500/10 border-sky-500/30 text-sky-500 hover:bg-sky-500/20",
                                currentShift === 'N' && "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/20",
                                currentShift === 'E' && "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20",
                                currentShift === 'L' && "bg-teal-500/10 border-teal-500/30 text-teal-500 hover:bg-teal-500/20",
                                currentShift === 'Su' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20",
                                currentShift === '1-1' && "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20",
                                currentShift === 'RO' && "bg-amethyst/10 border-amethyst/30 text-amethyst hover:bg-amethyst/20"
                              )}
                            >
                              <option value="" className="bg-white dark:bg-slate-900 text-slate dark:text-pearl">Rest</option>
                              {SHIFT_CODES.filter(sc => sc.category === 'work' || sc.code === 'RO').map((sc) => (
                                <option key={sc.code} value={sc.code} className="bg-white dark:bg-slate-900 text-slate dark:text-pearl">
                                  {sc.code} ({sc.label})
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex items-center justify-between gap-3 border-t border-slate/10 dark:border-pearl/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate/50 dark:text-pearl/50">
            <Info size={14} className="text-gold" />
            Changes saved here are templates and won't affect existing rota entries until applied.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gold hover:bg-gold/90 text-white font-medium gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Templates
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

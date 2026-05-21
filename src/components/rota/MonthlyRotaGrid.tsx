'use client';

import { useState, useEffect, useRef, useMemo, MouseEvent } from 'react';
import { format, isToday } from 'date-fns';
import Link from 'next/link';
import { RotaCell } from './RotaCell';
import { SectionHeader } from './SectionHeader';
import { ShiftCodePicker } from './ShiftCodePicker';
import { useRotaDrag } from '@/hooks/useRotaDrag';
import { useBulkUpdateCells } from '@/hooks/useRota';
import { SHIFT_CODES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type StaffInfo = { id: string; name: string; contractedHours: number; homeFloorId: string | null };
type Section = { title: string; staff: StaffInfo[] };

interface MonthlyRotaGridProps {
  days: Date[];
  sections: Section[];
  initialEntries?: Array<{ staffId: string; shiftDate: string; shiftCodeId?: string; code?: string | null; homeFloorId?: string }>;
  homeId: string;
}

function getRotaMonthDate(dateStr: string): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (day >= 19) {
    const mStr = month < 10 ? `0${month}` : `${month}`;
    return `${year}-${mStr}-19`;
  } else {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const mStr = prevMonth < 10 ? `0${prevMonth}` : `${prevMonth}`;
    return `${prevYear}-${mStr}-19`;
  }
}

function getCoverageCount(
  sectionStaff: StaffInfo[],
  date: Date,
  entries: MonthlyRotaGridProps['initialEntries']
): number {
  const dateStr = format(date, 'yyyy-MM-dd');
  return sectionStaff.filter(staff => {
    const entry = entries?.find(e => e.staffId === staff.id && e.shiftDate === dateStr);
    const code = entry?.code || null;
    const shift = SHIFT_CODES.find(s => s.code === code);
    return shift?.category === 'work';
  }).length;
}

export function MonthlyRotaGrid({ days, sections, initialEntries = [], homeId }: MonthlyRotaGridProps) {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('Window error on rota page:', {
        msg: event.message,
        src: event.filename,
        line: event.lineno,
        col: event.colno,
        error: event.error,
      });
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  const baseData = useMemo<Record<string, string>>(() => {
    const nextData: Record<string, string> = {};
    initialEntries.forEach(entry => {
      const key = `${entry.staffId}_${entry.shiftDate}`;
      nextData[key] = entry.code ?? '';
    });
    return nextData;
  }, [initialEntries]);

  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, string>>({});
  const { mutate: bulkUpdate } = useBulkUpdateCells();
  const lastMousePosRef = useRef({ top: 0, left: 0 });

  const cellData = useMemo(() => {
    const merged: Record<string, string> = { ...baseData };
    for (const [key, value] of Object.entries(optimisticOverrides)) {
      if (value === '') {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }
    return merged;
  }, [baseData, optimisticOverrides]);

  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    selectedCells: Array<{ staffId: string; dateStr: string }>;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    selectedCells: [],
    position: { top: 0, left: 0 }
  });

  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    staffId: string;
    dateStr: string;
    code: string | null;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    staffId: '',
    dateStr: '',
    code: null,
    position: { top: 0, left: 0 }
  });

  const { dragState, startDrag, onDragOver, endDrag } = useRotaDrag((cells) => {
    if (cells.length > 0) {
      setPickerState({
        isOpen: true,
        selectedCells: cells.map(c => ({ staffId: c.staffId, dateStr: c.shiftDate })),
        position: lastMousePosRef.current
      });
    }
  });

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        endDrag();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState.isDragging, endDrag]);

  const handleMouseDown = (e: MouseEvent, staffId: string, dateStr: string) => {
    if (e.button !== 0) return;

    if (pickerState.isOpen) {
      setPickerState(prev => ({ ...prev, isOpen: false }));
    }

    const rect = e.currentTarget.getBoundingClientRect();
    lastMousePosRef.current = {
      top: rect.bottom + window.scrollY + 8,
      left: Math.max(10, rect.left + window.scrollX - 100)
    };

    startDrag(staffId, dateStr);
  };

  const handleMouseEnter = (e: MouseEvent, staffId: string, dateStr: string) => {
    if (dragState.isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      lastMousePosRef.current = {
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(10, rect.left + window.scrollX - 100)
      };
      onDragOver(staffId, dateStr);
    }
  };

  const handleShiftSelect = (code: string | null) => {
    if (pickerState.selectedCells.length > 0) {
      setOptimisticOverrides(prev => {
        const next = { ...prev };
        pickerState.selectedCells.forEach(({ staffId, dateStr }) => {
          const key = `${staffId}_${dateStr}`;
          if (code) next[key] = code;
          else delete next[key];
        });
        return next;
      });

      const updates = pickerState.selectedCells.map(({ staffId, dateStr }) => {
        let floorId = '00000000-0000-0000-0000-000000000000';
        for (const section of sections) {
          const s = section.staff.find(e => e.id === staffId);
          if (s && s.homeFloorId) {
            floorId = s.homeFloorId;
            break;
          }
        }

        return {
          homeId,
          staffId,
          shiftDate: dateStr,
          shiftCodeId: code,
          homeFloorId: floorId,
          rotaMonth: getRotaMonthDate(dateStr),
          createdBy: 'system',
        };
      });

      bulkUpdate(updates);
    }
  };

  const handleBulkApply = (staffId: string, dateStr: string, codeToApply: string | null) => {
    const targetDay = new Date(dateStr).getDay();
    const targetDates = days.filter(d => d.getDay() === targetDay).map(d => format(d, 'yyyy-MM-dd'));

    setOptimisticOverrides(prev => {
      const next = { ...prev };
      targetDates.forEach(dStr => {
        const key = `${staffId}_${dStr}`;
        if (codeToApply) next[key] = codeToApply;
        else delete next[key];
      });
      return next;
    });

    const updates = targetDates.map(dStr => {
      let floorId = '00000000-0000-0000-0000-000000000000';
      for (const section of sections) {
        const s = section.staff.find(e => e.id === staffId);
        if (s && s.homeFloorId) {
          floorId = s.homeFloorId;
          break;
        }
      }

      return {
        homeId,
        staffId,
        shiftDate: dStr,
        shiftCodeId: codeToApply,
        homeFloorId: floorId,
        rotaMonth: getRotaMonthDate(dStr),
        createdBy: 'system',
      };
    });

    bulkUpdate(updates);
  };

  return (
    <div className="bg-white border border-slate/20 rounded-xl shadow-sm overflow-hidden flex flex-col mt-6 select-none">
      {/* Sticky Header Row */}
      <div className="flex border-b border-slate/20 bg-pearl/50 sticky top-0 z-20">
        <div className="w-48 flex-shrink-0 p-3 border-r border-slate/20 font-semibold text-midnight text-sm flex items-center">
          Staff Member
        </div>
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {days.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const today = isToday(day);
            return (
              <div
                key={i}
                className={cn(
                  "w-14 flex-shrink-0 p-1.5 border-r border-slate/10 flex flex-col items-center justify-center",
                  isWeekend ? "bg-slate/5" : "bg-white",
                  today && "border-t-2 border-t-gold"
                )}
              >
                <span className={cn(
                  "text-[10px] uppercase font-bold",
                  today ? "text-gold" : "text-slate"
                )}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-xs font-bold",
                  today ? "text-gold" : "text-midnight"
                )}>
                  {format(day, 'dd')}
                </span>
              </div>
            );
          })}
          <div className="w-20 flex-shrink-0 p-3 border-l border-slate/20 font-semibold text-midnight text-xs text-center">
            Total
          </div>
        </div>
      </div>

      {/* Grid Body */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar pb-20">
        {sections.map((section) => (
          <div key={section.title}>
            <SectionHeader
              title={section.title}
              count={section.staff.length}
              floorId={section.staff[0]?.homeFloorId ?? undefined}
            />

            {section.staff.map((employee) => (
              <div key={employee.id} className="flex border-b border-slate/10 hover:bg-slate/5 transition-colors group">
                <Link href={`/staff/${employee.id}`} className="w-48 flex-shrink-0 p-3 border-r border-slate/10 bg-white group-hover:bg-slate/5 flex flex-col justify-center sticky left-0 z-10 min-w-[160px] cursor-pointer">
                  <span className="text-xs font-bold text-midnight truncate hover:text-gold transition-colors">{employee.name}</span>
                  <span className="text-[10px] text-slate font-medium">{employee.contractedHours} hrs/wk</span>
                </Link>

                <div className="flex-1 flex">
                  {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = `${employee.id}_${dateStr}`;
                    const code = cellData[key] || null;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    const isDragged = dragState.paintedCells.has(`${employee.id}|${dateStr}`);
                    const isSelected = pickerState.isOpen && pickerState.selectedCells.some(c => c.staffId === employee.id && c.dateStr === dateStr);
                    const isActive = isDragged || isSelected;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-14 flex-shrink-0 p-0.5 flex items-center justify-center border-r border-slate/10/50",
                          isWeekend ? "bg-slate/5" : "bg-white"
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuState({
                            isOpen: true,
                            staffId: employee.id,
                            dateStr,
                            code,
                            position: { top: e.clientY, left: e.clientX }
                          });
                        }}
                      >
                        <RotaCell
                          code={code}
                          isActive={isActive}
                          onMouseDown={(e) => handleMouseDown(e, employee.id, dateStr)}
                          onMouseEnter={(e) => handleMouseEnter(e, employee.id, dateStr)}
                        />
                      </div>
                    );
                  })}

                  <div className="w-20 flex-shrink-0 p-2 border-l border-slate/10 flex items-center justify-center bg-pearl/30 group-hover:bg-slate/5">
                    <span className="text-[10px] font-semibold text-slate">—</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Coverage Footer Row */}
            <div className="flex bg-midnight/5 border-b border-slate/10">
              <div className="w-48 flex-shrink-0 p-2 border-r border-slate/10 flex items-center sticky left-0 z-10 bg-midnight/5 min-w-[160px]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-midnight">Coverage</span>
              </div>
              <div className="flex-1 flex">
                {days.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const count = getCoverageCount(section.staff, day, initialEntries);
                  const bgClass = count === 0 ? 'bg-danger/10 text-danger' :
                    count === 1 ? 'bg-amber-50 text-amber-700' :
                    'bg-teal/10 text-teal';
                  const fontClass = count < 2 ? 'font-bold' : 'font-semibold';

                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-14 flex-shrink-0 p-0.5 flex items-center justify-center border-r border-slate/10/50",
                        isWeekend ? "bg-slate/5" : "bg-white"
                      )}
                    >
                      <span className={cn("text-xs", bgClass, fontClass)}>{count}</span>
                    </div>
                  );
                })}
                <div className="w-20 flex-shrink-0 p-2 border-l border-slate/10 flex items-center justify-center bg-midnight/5">
                  <span className="text-[10px] text-slate">—</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ShiftCodePicker
        isOpen={pickerState.isOpen}
        onSelect={handleShiftSelect}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
        position={pickerState.position}
      />

      <div 
        style={{ position: 'fixed', top: contextMenuState.position.top, left: contextMenuState.position.left, zIndex: 100 }}
      >
        <DropdownMenu open={contextMenuState.isOpen} onOpenChange={(open) => setContextMenuState(prev => ({...prev, isOpen: open}))}>
          <DropdownMenuTrigger className="absolute outline-none" style={{ width: 0, height: 0, padding: 0, border: 0 }} aria-hidden="true" tabIndex={-1} />
          <DropdownMenuContent className="w-64 shadow-xl" align="start" sideOffset={2}>
            {contextMenuState.code && (
              <DropdownMenuItem 
                className="cursor-pointer text-sm py-2"
                onClick={() => handleBulkApply(contextMenuState.staffId, contextMenuState.dateStr, contextMenuState.code)}
              >
                Apply <strong>{contextMenuState.code}</strong> to all {format(new Date(contextMenuState.dateStr || new Date()), 'EEEE')}s this period
              </DropdownMenuItem>
            )}
            {contextMenuState.code && <DropdownMenuSeparator />}
            <DropdownMenuItem 
              className="cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50 py-2"
              onClick={() => handleBulkApply(contextMenuState.staffId, contextMenuState.dateStr, null)}
            >
              Clear all {format(new Date(contextMenuState.dateStr || new Date()), 'EEEE')}s this period
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
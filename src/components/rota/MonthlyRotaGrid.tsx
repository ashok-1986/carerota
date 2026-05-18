'use client';

import { useState, useEffect, MouseEvent } from 'react';
import { format } from 'date-fns';
import { RotaCell } from './RotaCell';
import { SectionHeader } from './SectionHeader';
import { ShiftCodePicker } from './ShiftCodePicker';
import { useRotaDrag } from '@/hooks/useRotaDrag';
import { useBulkUpdateCells } from '@/hooks/useRota';

type StaffInfo = { id: string; name: string; contractedHours: number; homeFloorId: string | null };
type Section = { title: string; staff: StaffInfo[] };

interface MonthlyRotaGridProps {
  days: Date[];
  sections: Section[];
  initialEntries?: Array<{ staffId: string; shiftDate: string; shiftCodeId: string }>;
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

export function MonthlyRotaGrid({ days, sections, initialEntries = [], homeId }: MonthlyRotaGridProps) {
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    selectedCells: Array<{ staffId: string; dateStr: string }>;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    selectedCells: [],
    position: { top: 0, left: 0 }
  });

  const [cellData, setCellData] = useState<Record<string, string>>({});
  const { mutate: bulkUpdate } = useBulkUpdateCells();

  // Map backend entries to local state
  useEffect(() => {
    const nextData: Record<string, string> = {};
    initialEntries.forEach(entry => {
      const key = `${entry.staffId}_${entry.shiftDate}`;
      nextData[key] = entry.shiftCodeId; // We assume shiftCodeId is the short code for now
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCellData(nextData);
  }, [initialEntries]);

  // Handle Drag Selection
  const { dragState, startDrag, onDragOver, endDrag } = useRotaDrag((cells) => {
    if (cells.length > 0) {
      setPickerState({
        isOpen: true,
        selectedCells: cells.map(c => ({ staffId: c.staffId, dateStr: c.shiftDate })),
        position: lastMousePos
      });
    }
  });

  // Keep track of the last mouse position for popover positioning
  const [lastMousePos, setLastMousePos] = useState({ top: 0, left: 0 });

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
    if (e.button !== 0) return; // only left click
    
    // Close picker if open
    if (pickerState.isOpen) {
      setPickerState(prev => ({ ...prev, isOpen: false }));
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setLastMousePos({ 
      top: rect.bottom + window.scrollY + 8, 
      left: Math.max(10, rect.left + window.scrollX - 100) 
    });

    startDrag(staffId, dateStr);
  };

  const handleMouseEnter = (e: MouseEvent, staffId: string, dateStr: string) => {
    if (dragState.isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      setLastMousePos({ 
        top: rect.bottom + window.scrollY + 8, 
        left: Math.max(10, rect.left + window.scrollX - 100) 
      });
      onDragOver(staffId, dateStr);
    }
  };

  const handleShiftSelect = (code: string | null) => {
    if (pickerState.selectedCells.length > 0) {
      // Optimistic Update
      setCellData(prev => {
        const next = { ...prev };
        pickerState.selectedCells.forEach(({ staffId, dateStr }) => {
          const key = `${staffId}_${dateStr}`;
          if (code) next[key] = code;
          else delete next[key];
        });
        return next;
      });

      // API Update
      const updates = pickerState.selectedCells.map(({ staffId, dateStr }) => {
        // Find staff homeFloorId from sections
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
          createdBy: 'system', // Handled by API session user, but match schema inputs
        };
      });

      bulkUpdate(updates);
    }
  };

  return (
    <div className="bg-white border border-slate/20 rounded-xl shadow-sm overflow-hidden flex flex-col mt-6 select-none">
      {/* Sticky Header Row */}
      <div className="flex border-b border-slate/20 bg-pearl/50 sticky top-0 z-20">
        <div className="w-64 flex-shrink-0 p-4 border-r border-slate/20 font-semibold text-midnight text-sm flex items-center">
          Staff Member
        </div>
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {days.map((day, i) => (
            <div key={i} className="w-14 flex-shrink-0 p-2 border-r border-slate/10 flex flex-col items-center justify-center bg-white">
              <span className="text-[10px] uppercase text-slate font-bold">{format(day, 'EEE')}</span>
              <span className="text-sm font-bold text-midnight">{format(day, 'dd')}</span>
            </div>
          ))}
          <div className="w-24 flex-shrink-0 p-4 border-l border-slate/20 font-semibold text-midnight text-sm text-center">
            Total Hrs
          </div>
        </div>
      </div>

      {/* Grid Body */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar pb-20">
        {sections.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} count={section.staff.length} />
            
            {section.staff.map((employee) => (
              <div key={employee.id} className="flex border-b border-slate/10 hover:bg-slate/5 transition-colors group">
                <div className="w-64 flex-shrink-0 p-3 border-r border-slate/10 bg-white group-hover:bg-slate/5 flex flex-col justify-center sticky left-0 z-10">
                  <span className="text-sm font-bold text-midnight truncate">{employee.name}</span>
                  <span className="text-[11px] text-slate font-medium">{employee.contractedHours} hrs/wk</span>
                </div>
                
                <div className="flex-1 flex">
                  {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = `${employee.id}_${dateStr}`;
                    const code = cellData[key] || null;
                    
                    let category: 'work' | 'absence' | 'float' | 'empty' = 'empty';
                    if (code) {
                      if (['AL', 'RO', 'ML'].includes(code)) category = 'absence';
                      else if (['Kg', 'Uj', 'Th'].includes(code)) category = 'float';
                      else category = 'work';
                    }

                    const isDragged = dragState.paintedCells.has(`${employee.id}|${dateStr}`);
                    const isSelected = pickerState.isOpen && pickerState.selectedCells.some(c => c.staffId === employee.id && c.dateStr === dateStr);
                    const isActive = isDragged || isSelected;

                    return (
                      <div key={i} className="w-14 flex-shrink-0 p-1 flex items-center justify-center border-r border-slate/10/50">
                        <RotaCell 
                          code={code} 
                          category={category} 
                          isActive={isActive}
                          onMouseDown={(e) => handleMouseDown(e, employee.id, dateStr)}
                          onMouseEnter={(e) => handleMouseEnter(e, employee.id, dateStr)}
                        />
                      </div>
                    );
                  })}
                  
                  <div className="w-24 flex-shrink-0 p-3 border-l border-slate/10 flex items-center justify-center bg-white group-hover:bg-slate/5">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-midnight">36.0</span>
                      <span className="text-[10px] text-success font-semibold">Match</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ShiftCodePicker 
        isOpen={pickerState.isOpen}
        onSelect={handleShiftSelect}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
        position={pickerState.position}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { RotaCell } from './RotaCell';
import { SectionHeader } from './SectionHeader';
import { ShiftCodePicker } from './ShiftCodePicker';

// Mock types for the UI scaffolding
type MockStaff = { id: string; name: string; contractedHours: number };
type MockSection = { title: string; staff: MockStaff[] };

interface MonthlyRotaGridProps {
  days: Date[];
  sections: MockSection[];
}

export function MonthlyRotaGrid({ days, sections }: MonthlyRotaGridProps) {
  // State for the shift code picker
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    staffId: string | null;
    dateStr: string | null;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    staffId: null,
    dateStr: null,
    position: { top: 0, left: 0 }
  });

  // Mock cell data state: { "staffId_dateStr": "LD" }
  const [cellData, setCellData] = useState<Record<string, string>>({});

  const handleCellClick = (e: React.MouseEvent, staffId: string, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Position the popover near the cell
    // In a real app we'd use floating-ui or similar to prevent clipping
    setPickerState({
      isOpen: true,
      staffId,
      dateStr,
      position: { 
        top: rect.bottom + window.scrollY + 8, 
        left: Math.max(10, rect.left + window.scrollX - 100) 
      }
    });
  };

  const handleShiftSelect = (code: string | null) => {
    if (pickerState.staffId && pickerState.dateStr) {
      const key = `${pickerState.staffId}_${pickerState.dateStr}`;
      setCellData(prev => {
        const next = { ...prev };
        if (code) {
          next[key] = code;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };

  return (
    <div className="bg-white border border-slate/20 rounded-xl shadow-sm overflow-hidden flex flex-col mt-6">
      
      {/* Sticky Header Row */}
      <div className="flex border-b border-slate/20 bg-pearl/50 sticky top-0 z-20">
        <div className="w-64 flex-shrink-0 p-4 border-r border-slate/20 font-semibold text-midnight text-sm flex items-center">
          Staff Member
        </div>
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {days.map((day, i) => (
            <div 
              key={i} 
              className="w-14 flex-shrink-0 p-2 border-r border-slate/10 flex flex-col items-center justify-center bg-white"
            >
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
                {/* Staff Info Column */}
                <div className="w-64 flex-shrink-0 p-3 border-r border-slate/10 bg-white group-hover:bg-slate/5 flex flex-col justify-center sticky left-0 z-10">
                  <span className="text-sm font-bold text-midnight truncate">{employee.name}</span>
                  <span className="text-[11px] text-slate font-medium">{employee.contractedHours} hrs/wk</span>
                </div>
                
                {/* Days Columns */}
                <div className="flex-1 flex">
                  {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = `${employee.id}_${dateStr}`;
                    const code = cellData[key] || null;
                    
                    // Simple logic to mock category for now based on code
                    let category: 'work' | 'absence' | 'float' | 'empty' = 'empty';
                    if (code) {
                      if (['AL', 'RO', 'ML'].includes(code)) category = 'absence';
                      else if (['Kg', 'Uj', 'Th'].includes(code)) category = 'float';
                      else category = 'work';
                    }

                    const isActive = pickerState.isOpen && 
                                     pickerState.staffId === employee.id && 
                                     pickerState.dateStr === dateStr;

                    return (
                      <div key={i} className="w-14 flex-shrink-0 p-1 flex items-center justify-center border-r border-slate/10/50">
                        <RotaCell 
                          code={code} 
                          category={category} 
                          isActive={isActive}
                          onClick={(e) => handleCellClick(e, employee.id, day)} 
                        />
                      </div>
                    );
                  })}
                  
                  {/* Total Hours Column (Mocked calculation) */}
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

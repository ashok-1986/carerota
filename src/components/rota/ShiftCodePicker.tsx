'use client';

import { SHIFT_CODES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ShiftCodePickerProps {
  isOpen: boolean;
  onSelect: (code: string | null) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function ShiftCodePicker({ isOpen, onSelect, onClose, position }: ShiftCodePickerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose} 
            aria-hidden="true" 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ 
              position: 'fixed', 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
            className="z-50 bg-white border border-slate/20 shadow-xl rounded-lg p-3 w-64 grid grid-cols-3 gap-2"
          >
            {SHIFT_CODES.map((shift) => {
              // Basic color mapping for the picker buttons
              const isWork = shift.category === 'work';
              const isAbsence = shift.category === 'absence';
              const isFloat = shift.category === 'float';
              
              return (
                <button
                  key={shift.code}
                  onClick={() => {
                    onSelect(shift.code);
                    onClose();
                  }}
                  className={cn(
                    "py-2 px-1 text-xs font-bold rounded-md border flex flex-col items-center justify-center transition-colors hover:bg-slate/5",
                    isWork && "text-midnight border-blue-200 bg-blue-50/50",
                    isAbsence && "text-amethyst border-amethyst/30 bg-amethyst/5",
                    isFloat && "text-teal border-teal/30 bg-teal/5"
                  )}
                  title={shift.label}
                >
                  <span className="text-sm">{shift.code}</span>
                </button>
              );
            })}
            
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="col-span-3 mt-1 py-2 text-xs font-medium text-red-600 border border-dashed border-red-200 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              Clear selected cells
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

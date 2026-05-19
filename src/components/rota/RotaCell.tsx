'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SHIFT_CODES } from '@/lib/constants';
import { cellHover } from '@/lib/animations';

interface RotaCellProps {
  code: string | null;
  category?: 'work' | 'absence' | 'float' | 'empty';
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
}

function getShiftColors(code: string | null): string {
  if (!code) return 'bg-slate/5 border-slate/10 text-transparent';

  if (code === 'N') return 'bg-midnight text-white border-midnight font-bold';
  if (code === 'LD') return 'bg-gold/15 text-amber-800 border-gold/30 font-bold';
  if (code === 'Su') return 'bg-teal/20 text-teal-700 border-teal/30 font-bold';

  const shiftDef = SHIFT_CODES.find((s) => s.code === code);
  const cat = shiftDef?.category ?? 'empty';

  if (cat === 'work') return 'bg-blue-50 border-blue-200 text-midnight font-bold';
  if (cat === 'absence') return 'bg-amethyst/10 border-amethyst/30 text-amethyst font-medium';
  if (cat === 'float') return 'bg-teal/10 border-teal/30 text-teal font-medium';

  return 'bg-slate/5 border-slate/10 text-transparent';
}

export function RotaCell({ code, onMouseDown, onMouseEnter, isActive }: RotaCellProps) {
  const colorClass = getShiftColors(code);

  return (
    <motion.button
      whileHover={cellHover.whileHover}
      transition={cellHover.transition}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-12 h-10 border rounded-md flex items-center justify-center text-[13px] font-bold transition-colors cursor-pointer outline-none",
        colorClass,
        isActive && "ring-2 ring-gold border-gold relative z-10 shadow-sm"
      )}
    >
      {code}
    </motion.button>
  );
}

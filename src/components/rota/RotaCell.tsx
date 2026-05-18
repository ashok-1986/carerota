'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SHIFT_CELL_COLORS } from '@/lib/constants';
import { cellHover } from '@/lib/animations';

interface RotaCellProps {
  code: string | null;
  category?: 'work' | 'absence' | 'float' | 'empty';
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
}

export function RotaCell({ code, category = 'empty', onMouseDown, onMouseEnter, isActive }: RotaCellProps) {
  const colorClass = SHIFT_CELL_COLORS[category] || SHIFT_CELL_COLORS.empty;

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

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RotaCellProps {
  code: string | null;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
}

function getShiftColors(code: string | null): string {
  if (!code) return 'bg-white border-slate/10 text-transparent';

  switch (code) {
    case 'E': return 'bg-sky-100 border border-sky-200 text-sky-800 font-bold';
    case 'L': return 'bg-violet-100 border border-violet-200 text-violet-800 font-bold';
    case 'N': return 'bg-midnight text-white border border-midnight font-bold';
    case 'LD': return 'bg-amber-100 border border-amber-200 text-amber-800 font-bold';
    case 'RO': return 'bg-slate/8 border border-slate/15 text-slate/50 font-medium';
    case 'AL': return 'bg-teal/15 border border-teal/30 text-teal font-medium';
    case 'ML': return 'bg-amethyst/15 border border-amethyst/30 text-amethyst font-medium';
    default: return 'bg-white border-slate/10 text-transparent';
  }
}

export function RotaCell({ code, onMouseDown, onMouseEnter, isActive }: RotaCellProps) {
  const colorClass = getShiftColors(code);

  return (
    <motion.button
      whileHover={code ? { scale: 1.05 } : {}}
      transition={{ duration: 0.12 }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-[36px] h-[36px] border rounded-md flex items-center justify-center text-[12px] font-bold transition-all cursor-pointer outline-none",
        colorClass,
        isActive && "ring-2 ring-gold border-gold relative z-10 shadow-sm"
      )}
    >
      {code}
    </motion.button>
  );
}
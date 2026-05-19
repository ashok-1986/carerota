'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RotaCellProps {
  code: string | null;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
}

function getShiftColors(code: string | null): { bg: string; text: string; border: string } {
  if (!code) return { bg: 'bg-white', text: 'text-transparent', border: 'border-slate/15' };

  switch (code) {
    case 'E': return { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' };
    case 'L': return { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' };
    case 'N': return { bg: 'bg-midnight', text: 'text-white', border: 'border-midnight' };
    case 'LD': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' };
    case 'Su': return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' };
    case 'RO': return { bg: 'bg-slate/5', text: 'text-slate/40', border: 'border-slate/15' };
    case 'AL': return { bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/20' };
    case 'ML': return { bg: 'bg-amethyst/10', text: 'text-amethyst', border: 'border-amethyst/20' };
    case 'SL': return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' };
    case 'PL': return { bg: 'bg-amethyst/10', text: 'text-amethyst', border: 'border-amethyst/20' };
    case 'TR': return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' };
    case 'M': return { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' };
    case 'OOH': return { bg: 'bg-slate/10', text: 'text-slate-700', border: 'border-slate/20' };
    case 'HO': return { bg: 'bg-slate/10', text: 'text-slate-700', border: 'border-slate/20' };
    default: return { bg: 'bg-white', text: 'text-transparent', border: 'border-slate/15' };
  }
}

export function RotaCell({ code, onMouseDown, onMouseEnter, isActive }: RotaCellProps) {
  const { bg, text, border } = getShiftColors(code);

  return (
    <motion.button
      whileHover={code ? { scale: 1.08, y: -1 } : {}}
      whileTap={code ? { scale: 0.95 } : {}}
      transition={{ duration: 0.12 }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-[36px] h-[36px] border rounded-lg flex items-center justify-center text-[12px] font-bold transition-all cursor-pointer outline-none shadow-sm",
        bg, text, border,
        isActive && "ring-2 ring-gold border-gold relative z-10 shadow-md"
      )}
    >
      {code}
    </motion.button>
  );
}
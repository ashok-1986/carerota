'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FloorTabsProps {
  floors: { id: string; name: string; code?: string }[];
  activeFloorId: string;
  onTabChange: (id: string) => void;
  staffCountByFloor?: Record<string, number>;
}

export function FloorTabs({ floors, activeFloorId, onTabChange, staffCountByFloor = {} }: FloorTabsProps) {
  return (
    <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm border border-slate/15 p-1.5 rounded-2xl">
      {floors.map((floor) => {
        const isActive = activeFloorId === floor.id;
        const count = staffCountByFloor[floor.id] ?? 0;

        return (
          <button
            key={floor.id}
            onClick={() => onTabChange(floor.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 outline-none flex items-center gap-2",
              isActive
                ? "bg-midnight text-white shadow-sm"
                : "text-slate hover:text-midnight hover:bg-slate/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFloorTab"
                className="absolute inset-0 bg-midnight rounded-xl"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{floor.name}</span>
            {count > 0 && (
              <span className={cn(
                "relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                isActive
                  ? "bg-white/15 text-white/70 border-white/10"
                  : "bg-slate/8 text-slate border-slate/20"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FloorTabsProps {
  floors: { id: string; name: string }[];
  activeFloorId: string;
  onTabChange: (id: string) => void;
}

export function FloorTabs({ floors, activeFloorId, onTabChange }: FloorTabsProps) {
  return (
    <div className="flex space-x-1 bg-slate/10 p-1 rounded-lg">
      {floors.map((floor) => {
        const isActive = activeFloorId === floor.id;
        
        return (
          <button
            key={floor.id}
            onClick={() => onTabChange(floor.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-md transition-colors outline-none",
              isActive ? "text-midnight" : "text-slate hover:text-midnight/70"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFloorTab"
                className="absolute inset-0 bg-white shadow-sm rounded-md"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{floor.name}</span>
          </button>
        );
      })}
    </div>
  );
}

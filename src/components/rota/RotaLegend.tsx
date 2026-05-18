import { SHIFT_CODES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function RotaLegend() {
  const categories = ['work', 'absence', 'float'];

  return (
    <div className="mt-8 border-t border-slate/10 pt-6">
      <h4 className="text-sm font-semibold text-slate mb-4 uppercase tracking-wider">Shift Codes Legend</h4>
      
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {categories.map(category => (
          <div key={category} className="flex flex-col gap-2">
            <h5 className="text-xs font-bold text-midnight capitalize">{category}</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SHIFT_CODES.filter(s => s.category === category).map(shift => {
                const isWork = category === 'work';
                const isAbsence = category === 'absence';
                const isFloat = category === 'float';
                
                return (
                  <div key={shift.code} className="flex items-center gap-2 min-w-[120px]">
                    <div className={cn(
                      "w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold border",
                      isWork && "text-midnight border-blue-200 bg-blue-50/50",
                      isAbsence && "text-amethyst border-amethyst/30 bg-amethyst/5",
                      isFloat && "text-teal border-teal/30 bg-teal/5"
                    )}>
                      {shift.code}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-midnight">{shift.label}</span>
                      {shift.hours > 0 && <span className="text-[10px] text-slate">{shift.hours} hrs</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

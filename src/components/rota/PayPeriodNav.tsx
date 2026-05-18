import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface PayPeriodNavProps {
  startDate: Date;
  endDate: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function PayPeriodNav({ startDate, endDate, onPrevious, onNext }: PayPeriodNavProps) {
  return (
    <div className="flex items-center gap-4 bg-white border border-slate/20 rounded-lg p-1 shadow-sm">
      <button 
        onClick={onPrevious}
        className="p-2 hover:bg-slate/5 rounded-md text-slate transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-2 px-2 text-sm font-semibold text-midnight min-w-[200px] justify-center">
        <CalendarIcon size={16} className="text-gold" />
        <span>
          {format(startDate, 'd MMM yyyy')} - {format(endDate, 'd MMM yyyy')}
        </span>
      </div>

      <button 
        onClick={onNext}
        className="p-2 hover:bg-slate/5 rounded-md text-slate transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export const SHIFT_CODES = [
  { code: 'LD', label: 'Long Day',         hours: 12,   category: 'work',    floors: ['care'] },
  { code: 'N',  label: 'Night',             hours: 10,   category: 'work',    floors: ['care'] },
  { code: 'E',  label: 'Early',             hours: 7.5,  category: 'work',    floors: ['ancillary', 'office'] },
  { code: 'L',  label: 'Late',              hours: 8,    category: 'work',    floors: ['ancillary'] },
  { code: 'Su', label: 'Supernumerary',     hours: 12,   category: 'work',    floors: ['care'] },
  { code: '1-1',label: 'One-to-One',        hours: 12,   category: 'work',    floors: ['care'] },
  { code: '9-5',label: 'Office Hours',      hours: 7.5,  category: 'work',    floors: ['office'] },
  { code: 'RO', label: 'Rest Off',          hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'AL', label: 'Annual Leave',      hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'ML', label: 'Maternity Leave',   hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'Kg', label: 'Float — King George', hours: 0,  category: 'float',   floors: ['care'] },
  { code: 'Uj', label: 'Float — Union Jack',  hours: 0,  category: 'float',   floors: ['care'] },
  { code: 'Th', label: 'Float — Thames',      hours: 0,  category: 'float',   floors: ['care'] },
] as const;

export const DEFAULT_FLOOR_NAMES = ['Unit 1', 'Unit 2', 'Unit 3', 'Office', 'Ancillary'];
export const PAY_PERIOD_START_DAY = 19;
export const BUDGET_WARNING_THRESHOLD = 0.85;   // 85% — show amber warning
export const DBS_WARNING_DAYS = 30;              // flag DBS expiring within 30 days

export const SHIFT_CELL_COLORS: Record<string, string> = {
  work:    'bg-blue-50 border-blue-200 text-midnight',
  absence: 'bg-amethyst/10 border-amethyst/30 text-amethyst',
  float:   'bg-teal/10 border-teal/30 text-teal',
  empty:   'bg-pearl border-slate/20 text-slate',
};

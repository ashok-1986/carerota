// Updated cost types per sprint 1.0 requirements
export type CostStaff = {
  id: string;
  role: string;
  employmentType: 'full_time' | 'part_time' | 'bank';
  contractedHours: number | null; // weekly hours, number
  payRateHourly: number | null;    // pence per hour, integer
};

export type CostEntry = {
  staffId: string;
  shiftCode: string;
  shiftDate: string; // ISO YYYY-MM-DD
  hours: number;     // derived from SHIFT_CODES
  category: 'work' | 'absence' | 'float';
};

export type CostSnapshot = {
  budgetedHours: number;
  scheduledHours: number;
  projectedCost: number;      // pence
  budgetCapMonthly: number;    // pence
  variance: number;            // pence (budgetCapMonthly - projectedCost)
  capUtilisation: number;      // ratio (0‑∞)
  agencyCost: number;          // pence
  totalCost: number;           // pence
  status: 'safe' | 'warning' | 'danger';
  costByRole: Record<string, number>; // pence per role
};


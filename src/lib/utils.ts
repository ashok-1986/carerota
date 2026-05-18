import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { startOfDay, addMonths, subMonths, setDate, eachDayOfInterval, format, isBefore } from 'date-fns';

export function getPayPeriod(startDay: number = 19, referenceDate: Date = new Date()) {
  const today = startOfDay(referenceDate);
  const currentMonthStart = setDate(today, startDay);
  
  let start: Date;
  let end: Date;
  
  if (isBefore(today, currentMonthStart)) {
    start = setDate(subMonths(today, 1), startDay);
  } else {
    start = currentMonthStart;
  }
  
  // setDate with 0 goes to last day of previous month, which correctly handles startDay = 1
  end = setDate(addMonths(start, 1), startDay - 1);
  
  const days = eachDayOfInterval({ start, end });
  const label = `${format(start, 'd MMM')} — ${format(end, 'd MMM yyyy')}`;
  
  return { start, end, days, label };
}

export function formatCurrency(amountGbp: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountGbp);
}

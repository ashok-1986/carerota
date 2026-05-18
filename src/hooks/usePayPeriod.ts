import { useMemo } from 'react';
import { getPayPeriod } from '@/lib/utils';
import { PAY_PERIOD_START_DAY } from '@/lib/constants';

export function usePayPeriod(startDay: number = PAY_PERIOD_START_DAY, referenceDate: Date = new Date()) {
  return useMemo(() => {
    return getPayPeriod(startDay, referenceDate);
  }, [startDay, referenceDate.getTime()]);
}

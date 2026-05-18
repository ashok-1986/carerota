import { useQuery } from '@tanstack/react-query';

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  employmentType: string;
  contractedHours: number | null;
  payRateHourly: number | null;
  authUserId: string | null;
  isActive: boolean;
  homeFloorId: string | null;
  floorName: string | null;
  floorCode: string | null;
};

export function useStaff() {
  return useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff list');
      const json = await res.json();
      return json.data;
    },
  });
}

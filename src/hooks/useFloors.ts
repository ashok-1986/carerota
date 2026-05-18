import { useQuery } from '@tanstack/react-query';

export type FloorInfo = {
  id: string;
  name: string;
};

export function useFloors() {
  return useQuery<FloorInfo[]>({
    queryKey: ['floors'],
    queryFn: async () => {
      const res = await fetch('/api/floors');
      if (!res.ok) throw new Error('Failed to fetch floors');
      return res.json();
    },
  });
}

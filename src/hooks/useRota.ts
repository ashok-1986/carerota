import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BulkUpsertPayload } from '@/db/queries/rota';

export function useRotaEntries(homeId: string, startDate: string, endDate: string, floorId?: string) {
  return useQuery({
    queryKey: ['rota', homeId, startDate, endDate, floorId],
    queryFn: async () => {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      if (floorId) params.append('floorId', floorId);
      const res = await fetch(`/api/rota?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch rota entries');
      return res.json();
    },
  });
}

export function useBulkUpdateCells() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: BulkUpsertPayload[]) => {
      const res = await fetch('/api/rota/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error('Failed to bulk update cells');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the rota queries to refetch data
      // We can be more precise if needed, but invalidating ['rota'] will catch all
      queryClient.invalidateQueries({ queryKey: ['rota'] });
    },
  });
}

export function usePublishRota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ start, end }: { start: string; end: string }) => {
      const res = await fetch('/api/rota/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      });
      if (!res.ok) throw new Error('Failed to publish rota');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rota'] });
    },
  });
}

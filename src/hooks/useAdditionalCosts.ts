import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type AdditionalCost = {
  id: string;
  homeId: string;
  rotaMonth: string;
  category: string;
  description: string;
  amount: string;
  addedBy: string;
  createdAt: string;
};

export type AdditionalCostsResponse = {
  entries: AdditionalCost[];
  categorySubtotals: Record<string, number>;
  totalAdditional: number;
};

export function useAdditionalCosts(rotaMonth: string) {
  return useQuery<AdditionalCostsResponse>({
    queryKey: ['additionalCosts', rotaMonth],
    queryFn: async () => {
      const res = await fetch(`/api/costs?rotaMonth=${encodeURIComponent(rotaMonth)}`);
      if (!res.ok) throw new Error('Failed to fetch additional costs');
      return res.json();
    },
    enabled: !!rotaMonth,
  });
}

type AddCostPayload = {
  category: string;
  description: string;
  amount: number;
  rotaMonth: string;
};

export function useAddAdditionalCost(rotaMonth: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddCostPayload) => {
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add cost entry');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalCosts', rotaMonth] });
      toast.success('Cost entry added');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteAdditionalCost(rotaMonth: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/costs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete cost entry');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalCosts', rotaMonth] });
      toast.success('Cost entry removed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type LeaveRequest = {
  id: string;
  homeId: string;
  staffId: string;
  staffName: string;
  role: string;
  leaveType: 'AL' | 'ML' | 'sick' | 'paternity' | 'compassionate' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
};

export type LeaveBalance = {
  contractedAnnualLeave: number;
  approvedDays: number;
  remainingDays: number;
};

export function useLeaveRequests(status?: string) {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leaveRequests', status],
    queryFn: async () => {
      const url = status ? `/api/leave?status=${status}` : '/api/leave';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useLeaveBalance(staffId: string, homeId?: string, year?: number) {
  return useQuery<LeaveBalance>({
    queryKey: ['leaveBalance', staffId, year],
    queryFn: async () => {
      if (!staffId) return { contractedAnnualLeave: 0, approvedDays: 0, remainingDays: 0 };
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      const qs = params.toString();
      const url = `/api/leave/balance/${staffId}${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch leave balance');
      const json = await res.json();
      return json.data as LeaveBalance;
    },
    enabled: !!staffId,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      staffId: string;
      leaveType: 'AL' | 'ML' | 'sick' | 'paternity' | 'compassionate' | 'other';
      startDate: string;
      endDate: string;
      notes?: string;
    }) => {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to create leave request');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.staffId] });
    },
  });
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: 'approved' | 'declined';
      notes?: string;
    }) => {
      const res = await fetch(`/api/leave/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to review leave request');
      return res.json();
    },
    onSuccess: (response) => {
      const request = response.data as LeaveRequest | undefined;
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rota'] }); // Refetch rota entries because AL cells might have been inserted!
      if (request?.staffId) {
        queryClient.invalidateQueries({ queryKey: ['leaveBalance', request.staffId] });
      }
    },
  });
}

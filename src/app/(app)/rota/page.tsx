'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PayPeriodNav } from '@/components/rota/PayPeriodNav';
import { FloorTabs } from '@/components/rota/FloorTabs';
import { RotaToolbar } from '@/components/rota/RotaToolbar';
import { MonthlyRotaGrid } from '@/components/rota/MonthlyRotaGrid';
import { RotaLegend } from '@/components/rota/RotaLegend';
import { CostBar } from '@/components/rota/CostBar';
import { CostDashboard } from '@/components/rota/CostDashboard';
import { format, addMonths } from 'date-fns';
import { useRotaEntries, usePublishRota } from '@/hooks/useRota';
import { useFloors } from '@/hooks/useFloors';
import { usePayPeriod } from '@/hooks/usePayPeriod';
import { useCost } from '@/hooks/useCost';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { PatternSetup } from '@/components/rota/PatternSetup';
import { PublishReview } from '@/components/rota/PublishReview';
import { ExportCsvDialog } from '@/components/export/ExportCsvDialog';
import { RotaErrorBoundary } from '@/components/shared/RotaErrorBoundary';

export default function RotaPage() {
  const { data: session } = useSession();
  const homeId = session?.user?.homeId || 'active-home';
  const queryClient = useQueryClient();

  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const payPeriod = usePayPeriod(19, referenceDate);

  const startDateStr = format(payPeriod.start, 'yyyy-MM-dd');
  const endDateStr = format(payPeriod.end, 'yyyy-MM-dd');

  const { data: floors = [], isLoading: isLoadingFloors } = useFloors();
  const [selectedFloorId, setSelectedFloorId] = useState<string | undefined>(undefined);
  const activeFloorId = selectedFloorId || floors[0]?.id;

  const [isPatternSetupOpen, setIsPatternSetupOpen] = useState(false);
  const [isPublishReviewOpen, setIsPublishReviewOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFillingPatterns, setIsFillingPatterns] = useState(false);

  const { data, isLoading: isLoadingEntries, error } = useRotaEntries(
    homeId,
    startDateStr,
    endDateStr,
    activeFloorId
  );

  const { mutate: publishRota, isPending: isPublishing } = usePublishRota();

  const handlePreviousPeriod = () => {
    setReferenceDate((prev) => addMonths(prev, -1));
  };

  const handleNextPeriod = () => {
    setReferenceDate((prev) => addMonths(prev, 1));
  };

  const handleFillFromPattern = async () => {
    if (!startDateStr || !endDateStr) return;

    setIsFillingPatterns(true);
    try {
      const payload: { startDate: string; endDate: string; floorId?: string } = {
        startDate: startDateStr,
        endDate: endDateStr,
      };
      if (activeFloorId) {
        payload.floorId = activeFloorId;
      }

      const res = await fetch('/api/rota/pattern/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Server error applying patterns');
      }

      await queryClient.invalidateQueries({ queryKey: ['rota'] });
      toast.success('Monthly rota successfully pre-populated from repeating patterns!');
    } catch (err) {
      toast.error(`Failed to apply templates: ${(err as Error).message}`);
    } finally {
      setIsFillingPatterns(false);
    }
  };

  const handleConfirmPublish = () => {
    setIsPublishReviewOpen(false);
    toast.promise(
      new Promise((resolve, reject) => {
        publishRota(
          { start: startDateStr, end: endDateStr },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: ['rota'] });
              resolve(data);
            },
            onError: (err) => reject(err),
          }
        );
      }),
      {
        loading: 'Publishing monthly rota...',
        success: 'Rota published successfully and audit logged!',
        error: (err) => `Failed to publish rota: ${err.message}`,
      }
    );
  };

  // Build cost data from entries + staff
  // entries from API have: code (string like "LD"), staffId, shiftDate
  // staff from sections have: payRateHourly (in pence), role, etc.
  type CostEntry = { shiftCode: string; staffId: string; shiftDate: string; hours: number; category: 'work' | 'absence' | 'float' };
  type ApiCostStaff = { id: string; name: string; role: string; employmentType?: string; contractedHours?: number | null; payRateHourly?: number | null; homeFloorId?: string | null };
  type ApiEntry = { code?: string; staffId?: string; shiftDate?: string; hours?: number | string; category?: string; isPublished?: boolean };

  const shiftCodeMap: Record<string, { hours: number; category: 'work' | 'absence' | 'float' }> = {
    LD: { hours: 12, category: 'work' },
    N: { hours: 10, category: 'work' },
    E: { hours: 7.5, category: 'work' },
    L: { hours: 8, category: 'work' },
    Su: { hours: 12, category: 'work' },
    '1-1': { hours: 12, category: 'work' },
    '9-5': { hours: 7.5, category: 'work' },
    RO: { hours: 0, category: 'absence' },
    AL: { hours: 0, category: 'absence' },
    ML: { hours: 0, category: 'absence' },
    Kg: { hours: 0, category: 'float' },
    Uj: { hours: 0, category: 'float' },
    Th: { hours: 0, category: 'float' },
  };

  const costEntries: CostEntry[] = (data?.entries || []).map((e: ApiEntry) => {
    const code = e.code || '';
    const shiftInfo = shiftCodeMap[code] ?? { hours: 0, category: 'work' as const };
    const rawHours = typeof e.hours === 'number' ? e.hours : (parseFloat(String(e.hours || '0')) || 0);
    return {
      shiftCode: code,
      staffId: e.staffId || '',
      shiftDate: e.shiftDate || '',
      hours: rawHours > 0 ? rawHours : shiftInfo.hours,
      category: shiftInfo.category,
    };
  });

  const costStaff: import('@/types/cost').CostStaff[] = (data?.sections || []).flatMap((sec: { staff: ApiCostStaff[] }) =>
    sec.staff.map((s: ApiCostStaff) => ({
      id: s.id,
      role: s.role || 'caregiver',
      employmentType: (s.employmentType as 'full_time' | 'part_time' | 'bank') || 'full_time',
      contractedHours: typeof s.contractedHours === 'number' ? s.contractedHours : parseFloat(String(s.contractedHours || '0')) || 0,
      payRateHourly: typeof s.payRateHourly === 'number' ? s.payRateHourly : parseFloat(String(s.payRateHourly || '0')) || 0,
      homeFloorId: activeFloorId ?? '',
    }))
  );

  const patternStaffList = costStaff.map((s) => {
    const ch = typeof s.contractedHours === 'number' ? s.contractedHours : parseFloat(String(s.contractedHours || '0')) || 0;
    return {
      id: s.id,
      name: (s as ApiCostStaff).name || s.id,
      role: s.role,
      employmentType: s.employmentType,
      contractedHours: ch,
      homeFloorId: (typeof (s as ApiCostStaff).homeFloorId === 'string' ? (s as ApiCostStaff).homeFloorId : null) ?? null,
    };
  });

  const budgetCapGbp = 33500;
  const costSummary = useCost(costEntries, costStaff, budgetCapGbp, payPeriod.days);

  const isLoading = isLoadingFloors || isLoadingEntries || isPublishing;

  const isDraft = data?.entries && data.entries.length > 0
    ? data.entries.some((e: ApiEntry) => !e.isPublished)
    : true;

  const activeFloorName = floors.find(f => f.id === activeFloorId)?.name || 'Care Home';

  return (
    <RotaErrorBoundary>
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Monthly Rota"
        description={`Plan and publish the schedule for ${activeFloorName}.`}
        breadcrumbs={[
          { label: 'CareRota' },
          { label: 'Rota' }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        {floors.length > 0 ? (
          <FloorTabs
            floors={floors}
            activeFloorId={activeFloorId || ''}
            onTabChange={setSelectedFloorId}
          />
        ) : (
          <div className="h-10 w-48 bg-slate/5 rounded-lg animate-pulse" />
        )}

        <PayPeriodNav
          startDate={payPeriod.start}
          endDate={payPeriod.end}
          onPrevious={handlePreviousPeriod}
          onNext={handleNextPeriod}
        />
      </div>

      <RotaToolbar
        isDraft={isDraft}
        onPublish={() => setIsPublishReviewOpen(true)}
        onExport={() => setIsExportDialogOpen(true)}
        onOpenPatternSetup={() => setIsPatternSetupOpen(true)}
        onFillFromPattern={handleFillFromPattern}
        isFilling={isFillingPatterns}
      />

      {!isLoading && !error && data && (
        <div className="flex flex-col gap-6 mb-6">
          <CostBar
            projectedCost={costSummary.projectedCost}
            budgetCapGbp={budgetCapGbp}
            variance={costSummary.variance}
            isOverBudget={costSummary.isOverBudget}
            capUtilisation={costSummary.capUtilisation}
            status={costSummary.status}
            scheduledHours={costSummary.scheduledHours}
            budgetedHours={costSummary.budgetedHours}
          />

          <CostDashboard
            costByRole={costSummary.costByRole}
            projectedCost={costSummary.projectedCost}
            scheduledHours={costSummary.scheduledHours}
            budgetedHours={costSummary.budgetedHours}
            isOverBudget={costSummary.isOverBudget}
            variance={costSummary.variance}
            status={costSummary.status}
          />
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center justify-center h-64 border border-slate/20 rounded-xl bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : error ? (
        <div className="mt-6 p-4 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl">
          Failed to load rota entries. Please try again.
        </div>
      ) : (
        <MonthlyRotaGrid
          days={payPeriod.days}
          sections={data?.sections || []}
          initialEntries={data?.entries || []}
          homeId={homeId}
        />
      )}

      <RotaLegend />

      {isPatternSetupOpen && (
        <PatternSetup
          isOpen={isPatternSetupOpen}
          onClose={() => setIsPatternSetupOpen(false)}
          staffList={patternStaffList}
        />
      )}

      {isPublishReviewOpen && (
        <PublishReview
          isOpen={isPublishReviewOpen}
          onClose={() => setIsPublishReviewOpen(false)}
          onConfirmPublish={handleConfirmPublish}
          entries={data?.entries || []}
          staffList={patternStaffList}
          floors={floors}
          dates={payPeriod.days.map((d: Date) => format(d, 'yyyy-MM-dd'))}
          isPublishing={isPublishing}
        />
      )}

      {isExportDialogOpen && (
        <ExportCsvDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          startDate={startDateStr}
          endDate={endDateStr}
          floors={floors}
          activeFloorId={activeFloorId}
        />
      )}
    </div>
    </RotaErrorBoundary>
  );
}

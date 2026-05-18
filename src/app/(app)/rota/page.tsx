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
import { SHIFT_CODES } from '@/lib/constants';
import { useQueryClient } from '@tanstack/react-query';

import { PatternSetup } from '@/components/rota/PatternSetup';
import { PublishReview } from '@/components/rota/PublishReview';
import { ExportCsvDialog } from '@/components/export/ExportCsvDialog';

export default function RotaPage() {
  const { data: session } = useSession();
  const homeId = session?.user?.homeId || 'active-home';
  const queryClient = useQueryClient();

  // Reference date for tracking active pay periods
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const payPeriod = usePayPeriod(19, referenceDate);
  
  const startDateStr = format(payPeriod.start, 'yyyy-MM-dd');
  const endDateStr = format(payPeriod.end, 'yyyy-MM-dd');

  // Floor navigation
  const { data: floors = [], isLoading: isLoadingFloors } = useFloors();
  const [selectedFloorId, setSelectedFloorId] = useState<string | undefined>(undefined);
  const activeFloorId = selectedFloorId || floors[0]?.id;

  // Dialog State Management
  const [isPatternSetupOpen, setIsPatternSetupOpen] = useState(false);
  const [isPublishReviewOpen, setIsPublishReviewOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFillingPatterns, setIsFillingPatterns] = useState(false);

  // Fetch rota entries
  const { data, isLoading: isLoadingEntries, error } = useRotaEntries(
    homeId, 
    startDateStr, 
    endDateStr, 
    activeFloorId
  );

  // Publish mutation
  const { mutate: publishRota, isPending: isPublishing } = usePublishRota();

  const handlePreviousPeriod = () => {
    setReferenceDate((prev) => addMonths(prev, -1));
  };

  const handleNextPeriod = () => {
    setReferenceDate((prev) => addMonths(prev, 1));
  };

  // Triggers pattern application to monthly schedule grid
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
      
      // Invalidate query caching to reload all entries inside grid dynamically
      await queryClient.invalidateQueries({ queryKey: ['rota'] });
      toast.success('Monthly rota successfully pre-populated from repeating patterns!');
    } catch (err) {
      toast.error(`Failed to apply templates: ${(err as Error).message}`);
    } finally {
      setIsFillingPatterns(false);
    }
  };

  // Triggers the final DB publish action from the compliance reviewed checklist
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

  // Convert raw API response entries/staff into useCost hook types
  type CostEntry = { code?: string; staffId: string; shiftDate: string; isPublished?: boolean };
  type CostStaff = { id: string; role: string; name: string; employmentType?: string; contractedHours?: number; payRateHourly?: number };
  const costEntries = (data?.entries || []).map((e: CostEntry) => {
    const shiftCodeInfo = SHIFT_CODES.find((sc) => sc.code === e.code);
    return {
      staffId: e.staffId,
      shiftCode: e.code || '',
      shiftDate: e.shiftDate,
      hours: shiftCodeInfo?.hours || 0,
      category: shiftCodeInfo?.category || 'work',
    };
  });

  const costStaff = (data?.sections || []).flatMap((sec: { staff: CostStaff[] }) => sec.staff).map((s: CostStaff) => ({
    id: s.id,
    role: s.role,
    name: s.name,
    employmentType: s.employmentType || 'full_time',
    contractedHours: s.contractedHours || 0,
    payRateHourly: s.payRateHourly || 0,
  }));

  const budgetCapGbp = 33500; // Default budget cap for Marlborough Court
  const costSummary = useCost(costEntries, costStaff, budgetCapGbp, payPeriod.days);

  const isLoading = isLoadingFloors || isLoadingEntries || isPublishing;

  // Compute draft status based on loaded entries
  const isDraft = data?.entries && data.entries.length > 0 
    ? data.entries.some((e: CostEntry) => !e.isPublished) 
    : true;

  const activeFloorName = floors.find(f => f.id === activeFloorId)?.name || 'Care Home';

  return (
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

      {/* Live Cost Metrics Dashboard */}
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

      {/* 1. Weekly Repeated Patterns Editor Dialog */}
      {isPatternSetupOpen && (
        <PatternSetup
          isOpen={isPatternSetupOpen}
          onClose={() => setIsPatternSetupOpen(false)}
          staffList={costStaff}
        />
      )}

      {/* 2. visual checklist & CQC publishing review Dialog */}
      {isPublishReviewOpen && (
        <PublishReview
          isOpen={isPublishReviewOpen}
          onClose={() => setIsPublishReviewOpen(false)}
          onConfirmPublish={handleConfirmPublish}
          entries={data?.entries || []}
          staffList={costStaff}
          floors={floors}
          dates={payPeriod.days.map((d: Date) => format(d, 'yyyy-MM-dd'))}
          isPublishing={isPublishing}
        />
      )}

      {/* 3. Softworks CSV Exporter Dialog */}
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
  );
}

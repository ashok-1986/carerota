'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { detectGaps, detectComplianceIssues, CoverageGap, ComplianceIssue } from '@/lib/rota';
import { SHIFT_CODES } from '@/lib/constants';
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface PublishReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  entries: any[];
  staffList: any[];
  floors: any[];
  dates: string[];
  isPublishing: boolean;
}

export function PublishReview({
  isOpen,
  onClose,
  onConfirmPublish,
  entries,
  staffList,
  floors,
  dates,
  isPublishing,
}: PublishReviewProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // 1. Run validation rules
  // Convert frontend entries & staff lists to lib types
  const typedEntries = entries.map((e) => ({
    id: e.id,
    staffId: e.staffId,
    shiftDate: e.shiftDate,
    shiftCodeId: e.shiftCodeId,
    homeFloorId: e.homeFloorId,
  }));

  const typedStaffList = staffList.map((s) => ({
    id: s.id,
    name: s.name,
    contractedHours: Number(s.contractedHours) || 0,
    role: s.role,
    employmentType: s.employmentType || 'full_time',
    homeFloorId: s.homeFloorId,
  }));

  const typedShiftCodes = SHIFT_CODES.map((sc, idx) => ({
    id: sc.code, // use code as ID for lookups in this validation context since it matches the code
    code: sc.code,
    label: sc.label,
    hours: sc.hours,
    category: sc.category as any,
  }));

  // Resolve shift codes matching code strings for validation
  const mappedEntries = entries.map((e) => {
    // entry code is in e.code or e.shiftCodeCode
    const code = e.code || SHIFT_CODES.find((sc) => sc.code === e.code)?.code;
    return {
      id: e.id,
      staffId: e.staffId,
      shiftDate: e.shiftDate,
      shiftCodeId: code || null, // map code directly as ID for validation lookup
      homeFloorId: e.homeFloorId,
    };
  });

  const gaps = detectGaps(mappedEntries, dates, floors, typedShiftCodes);
  const complianceIssues = detectComplianceIssues(mappedEntries, typedStaffList, typedShiftCodes, dates);

  const errors = complianceIssues.filter((i) => i.severity === 'error');
  const warnings = complianceIssues.filter((i) => i.severity === 'warning');

  const hasCriticalIssues = gaps.length > 0 || errors.length > 0;

  const handleConfirm = () => {
    if (hasCriticalIssues && !acknowledged) {
      toast.error('Please check the acknowledgement box to proceed with critical warnings.');
      return;
    }
    onConfirmPublish();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-pearl/95 dark:bg-midnight/95 backdrop-blur-xl border border-slate/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 rounded-xl text-gold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate dark:text-pearl">Publish Review & Compliance Checklist</DialogTitle>
              <DialogDescription className="text-sm text-slate/60 dark:text-pearl/60 mt-1">
                Verify coverage, staffing targets, and Care Quality Commission (CQC) compliance standards before publishing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 1. Gaps Checklist */}
        <div className="space-y-4 my-2">
          <h3 className="text-sm font-semibold text-slate/80 dark:text-pearl/80 uppercase tracking-wider">
            1. Floor Coverage Status
          </h3>
          {gaps.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium">
              <CheckCircle size={18} />
              Full coverage confirmed across all floors and shifts!
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-medium">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Coverage Gaps Detected ({gaps.length})</div>
                  <div className="text-xs opacity-80 mt-0.5">Some floors have no active work shifts scheduled on certain days.</div>
                </div>
              </div>
              <div className="max-h-[120px] overflow-y-auto border border-slate/10 dark:border-pearl/10 rounded-xl divide-y divide-slate/10 dark:divide-pearl/10 bg-white dark:bg-slate-900 text-xs">
                {gaps.map((gap, i) => (
                  <div key={i} className="p-2.5 flex justify-between items-center text-slate/70 dark:text-pearl/70">
                    <span>{gap.message}</span>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">Gap</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Compliance Checklist */}
        <div className="space-y-4 my-4">
          <h3 className="text-sm font-semibold text-slate/80 dark:text-pearl/80 uppercase tracking-wider">
            2. CQC Compliance & Shift Checks
          </h3>
          {complianceIssues.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium">
              <CheckCircle size={18} />
              Zero compliance or shift pattern warnings detected!
            </div>
          ) : (
            <div className="space-y-3">
              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
                    <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">CQC Compliance Violations ({errors.length})</div>
                      <div className="text-xs opacity-80 mt-0.5">Critical rest break or consecutive work shift warnings that must be reviewed.</div>
                    </div>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto border border-slate/10 dark:border-pearl/10 rounded-xl divide-y divide-slate/10 dark:divide-pearl/10 bg-white dark:bg-slate-900 text-xs">
                    {errors.map((error, i) => (
                      <div key={i} className="p-2.5 flex justify-between items-center text-slate/70 dark:text-pearl/70">
                        <span>{error.message}</span>
                        <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/5">Violation</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-medium">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Contract Hour Mismatches ({warnings.length})</div>
                      <div className="text-xs opacity-80 mt-0.5">Staff scheduled hours differ from their contracted hours limit.</div>
                    </div>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto border border-slate/10 dark:border-pearl/10 rounded-xl divide-y divide-slate/10 dark:divide-pearl/10 bg-white dark:bg-slate-900 text-xs">
                    {warnings.map((warning, i) => (
                      <div key={i} className="p-2.5 flex justify-between items-center text-slate/70 dark:text-pearl/70">
                        <span>{warning.message}</span>
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5">Warning</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Acknowledgement for warnings */}
        {hasCriticalIssues && (
          <div className="p-4 bg-slate/5 dark:bg-pearl/5 border border-slate/10 dark:border-pearl/10 rounded-2xl flex items-start gap-3 my-4">
            <input
              type="checkbox"
              id="acknowledge-check"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 cursor-pointer w-4 h-4 text-gold border-slate/30 rounded focus:ring-gold"
            />
            <label htmlFor="acknowledge-check" className="text-xs leading-relaxed text-slate/70 dark:text-pearl/70 select-none cursor-pointer">
              <strong>I acknowledge the coverage gaps and/or CQC compliance warnings</strong> listed above. I confirm that Marlborough Court will operate safely with these manual exceptions in place.
            </label>
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-3 border-t border-slate/10 dark:border-pearl/10 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPublishing} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPublishing || (hasCriticalIssues && !acknowledged)}
            className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-white font-medium gap-2 disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                Confirm and Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

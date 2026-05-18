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
import { Download, Calendar, ArrowRight, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface ExportCsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  floors: Array<{ id: string; name: string; code?: string }>;
  activeFloorId?: string;
}

export function ExportCsvDialog({
  isOpen,
  onClose,
  startDate,
  endDate,
  floors,
  activeFloorId,
}: ExportCsvDialogProps) {
  const [filterByFloor, setFilterByFloor] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState(activeFloorId || floors[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });

      if (filterByFloor && selectedFloorId) {
        params.append('floorId', selectedFloorId);
      }

      const downloadUrl = `/api/export/csv?${params.toString()}`;
      
      // Trigger a clean, direct browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Payroll_Export_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Softworks payroll CSV generated successfully!');
      onClose();
    } catch {
      toast.error('Failed to export payroll data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-pearl/95 dark:bg-midnight/95 backdrop-blur-xl border border-slate/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-500">
              <Download size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate dark:text-pearl">Export Payroll Rota</DialogTitle>
              <DialogDescription className="text-sm text-slate/60 dark:text-pearl/60 mt-1">
                Download a Softworks-compatible CSV file of scheduled shifts and cost allocations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Active Period Details */}
          <div className="p-4 bg-slate/5 dark:bg-pearl/5 border border-slate/10 dark:border-pearl/10 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate/50 dark:text-pearl/50 uppercase tracking-wider">
              <Calendar size={14} className="text-gold" />
              Target Pay Period
            </div>
            <div className="flex items-center gap-2.5 text-slate dark:text-pearl font-medium text-sm">
              <span>{format(parseISO(startDate), 'dd MMM yyyy')}</span>
              <ArrowRight size={14} className="text-slate/40 dark:text-pearl/40" />
              <span>{format(parseISO(endDate), 'dd MMM yyyy')}</span>
            </div>
          </div>

          {/* Scope Filters */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate/60 dark:text-pearl/60 uppercase tracking-wider">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFilterByFloor(false)}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all ${
                  !filterByFloor
                    ? 'bg-gold/10 border-gold/45 text-gold font-semibold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate/15 text-slate/75 hover:bg-slate/5 dark:text-pearl/75'
                }`}
              >
                Entire Home
              </button>
              <button
                type="button"
                onClick={() => setFilterByFloor(true)}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all ${
                  filterByFloor
                    ? 'bg-gold/10 border-gold/45 text-gold font-semibold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate/15 text-slate/75 hover:bg-slate/5 dark:text-pearl/75'
                }`}
              >
                Filter by Unit/Floor
              </button>
            </div>
          </div>

          {filterByFloor && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <label htmlFor="floor-select" className="text-xs font-semibold text-slate/50 dark:text-pearl/50">
                Select Cost Center Unit
              </label>
              <select
                id="floor-select"
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate/20 rounded-xl text-slate dark:text-pearl outline-none focus:border-gold transition-colors text-sm"
              >
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name} ({floor.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-slate/5 dark:bg-pearl/5 border border-slate/10 dark:border-pearl/10 rounded-xl flex items-start gap-2 text-xs text-slate/50 dark:text-pearl/50">
            <Info size={14} className="text-gold shrink-0 mt-0.5" />
            <span>This Softworks export is pre-validated with employee numbers, scheduled cost centers, and rounded hours for direct HR ingestion.</span>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-3 border-t border-slate/10 dark:border-pearl/10 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isExporting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-white font-medium gap-2 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Download CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

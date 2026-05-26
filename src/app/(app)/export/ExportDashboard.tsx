'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, Loader2, ArrowRightLeft } from 'lucide-react';
import type { StaffHoursSummary } from '@/db/queries/analytics';

interface Floor {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
  homeFloorId: string | null;
  isActive: boolean;
}

interface ExportDashboardProps {
  floors: Floor[];
  staff: Staff[];
  periods: { startStr: string; endStr: string; label: string }[];
  initialHours: StaffHoursSummary[];
}

export default function ExportDashboard({ floors, staff, periods, initialHours }: ExportDashboardProps) {
  // Section A State (Softworks CSV Export)
  const [csvPeriodStart, setCsvPeriodStart] = useState(periods[0]?.startStr || '');
  const [csvFloorIds, setCsvFloorIds] = useState<string[]>(floors.map(f => f.id));
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  // Section B State (PDF Noticeboard Export)
  const [pdfPeriodStart, setPdfPeriodStart] = useState(periods[0]?.startStr || '');
  const [pdfFloorIds, setPdfFloorIds] = useState<string[]>(floors.map(f => f.id));
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Section C State (Staff Hours Report)
  const [reportPeriodStart, setReportPeriodStart] = useState(periods[0]?.startStr || '');
  const [hoursData, setHoursData] = useState<StaffHoursSummary[]>(initialHours);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [isExportingReportCsv, setIsExportingReportCsv] = useState(false);

  // CSV period calculation
  const csvPeriod = useMemo(() => {
    const p = periods.find(x => x.startStr === csvPeriodStart);
    if (!p) return { days: 30 };
    const start = parseISO(p.startStr);
    const end = parseISO(p.endStr);
    return { days: differenceInDays(end, start) + 1 };
  }, [csvPeriodStart, periods]);

  // CSV Staff Count
  const csvStaffCount = useMemo(() => {
    return staff.filter(s => s.isActive && s.homeFloorId && csvFloorIds.includes(s.homeFloorId)).length;
  }, [csvFloorIds, staff]);

  // PDF Staff Count
  const pdfStaffCount = useMemo(() => {
    return staff.filter(s => s.isActive && s.homeFloorId && pdfFloorIds.includes(s.homeFloorId)).length;
  }, [pdfFloorIds, staff]);

  const handleCsvDownload = async () => {
    if (csvFloorIds.length === 0) {
      toast.error('Please select at least one floor');
      return;
    }
    setIsDownloadingCsv(true);
    try {
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payPeriodStart: csvPeriodStart, floorIds: csvFloorIds }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `softworks-rota-${csvPeriodStart}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Softworks CSV payroll export downloaded successfully');
      } else {
        toast.error('Failed to export CSV');
      }
    } catch {
      toast.error('Error downloading CSV export');
    }
    setIsDownloadingCsv(false);
  };

  const handlePdfDownload = async () => {
    if (pdfFloorIds.length === 0) {
      toast.error('Please select at least one floor');
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payPeriodStart: pdfPeriodStart, floorIds: pdfFloorIds }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noticeboard-rota-${pdfPeriodStart}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Noticeboard PDF downloaded successfully');
      } else {
        toast.error('Failed to export PDF');
      }
    } catch {
      toast.error('Error downloading PDF export');
    }
    setIsDownloadingPdf(false);
  };

  // Fetch updated hours report when pay period is changed in Section C
  const handleFetchHours = async (periodStart: string) => {
    setReportPeriodStart(periodStart);
    setIsLoadingHours(true);
    try {
      const p = periods.find(x => x.startStr === periodStart);
      if (!p) return;
      const res = await fetch(`/api/export/hours-summary?start=${p.startStr}&end=${p.endStr}`);
      if (res.ok) {
        const json = await res.json();
        setHoursData(json.data);
      } else {
        toast.error('Failed to load staff hours');
      }
    } catch {
      toast.error('Error loading staff hours report');
    }
    setIsLoadingHours(false);
  };

  // Export Staff Hours Report as CSV
  const handleExportHoursCsv = async () => {
    setIsExportingReportCsv(true);
    try {
      const headers = ['Staff Name', 'Role', 'Employment Type', 'Floor/Dept', 'Work Shifts', 'Total Hours', 'Contracted Hours', 'Variance'];
      const rows = hoursData.map(h => [
        h.staffName,
        h.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        h.employmentType === 'full_time' ? 'Full-time' : h.employmentType === 'part_time' ? 'Part-time' : 'Bank',
        h.floorName || 'General',
        h.totalShifts.toString(),
        h.totalHours.toFixed(2),
        h.contractedHours.toFixed(2),
        h.variance.toFixed(2),
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staff-hours-report-${reportPeriodStart}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Hours summary table exported successfully');
    } catch {
      toast.error('Failed to export hours table');
    }
    setIsExportingReportCsv(false);
  };

  const getVarianceColor = (v: number) => {
    if (Math.abs(v) <= 2) return 'text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200';
    if (Math.abs(v) <= 5) return 'text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200';
    return 'text-danger font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200';
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-8">
      {/* Grid containing CSV and PDF exports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Softworks CSV Export */}
        <Card className="border border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center text-midnight">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-sans text-midnight">Softworks CSV Export</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-sans">Generate files for payroll imports.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-midnight">Select Pay Period</Label>
              <Select value={csvPeriodStart} onValueChange={(val) => setCsvPeriodStart(val || '')}>
                <SelectTrigger className="w-full text-sm h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.startStr} value={p.startStr}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-midnight block">Select Floors</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {floors.map(floor => (
                  <div key={floor.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`csv-floor-${floor.id}`}
                      checked={csvFloorIds.includes(floor.id)}
                      onChange={() => {
                        setCsvFloorIds(prev => prev.includes(floor.id) ? prev.filter(id => id !== floor.id) : [...prev, floor.id]);
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-teal focus:ring-gold focus:ring-offset-2 accent-teal"
                    />
                    <Label htmlFor={`csv-floor-${floor.id}`} className="text-sm font-medium text-midnight cursor-pointer">
                      {floor.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <p className="text-xs text-slate font-medium">
                Estimated rows: <span className="font-bold text-midnight">{csvStaffCount}</span> staff × <span className="font-bold text-midnight">{csvPeriod.days}</span> days = ~<span className="font-bold text-midnight">{csvStaffCount * csvPeriod.days}</span> rows
              </p>
              <Button onClick={handleCsvDownload} disabled={isDownloadingCsv} className="bg-midnight hover:bg-midnight/90 text-white font-bold h-11 px-6 rounded-lg transition-all cursor-pointer">
                {isDownloadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download CSV
              </Button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-sans">
              Softworks Employee Scheduler format · DD/MM/YYYY dates · One row per staff per day
            </p>
          </CardContent>
        </Card>

        {/* Section B: PDF Noticeboard Export */}
        <Card className="border border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center text-midnight">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-sans text-midnight">PDF Rota Export</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-sans">Create noticeboard-ready floor schedules.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-midnight">Select Pay Period</Label>
              <Select value={pdfPeriodStart} onValueChange={(val) => setPdfPeriodStart(val || '')}>
                <SelectTrigger className="w-full text-sm h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.startStr} value={p.startStr}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-midnight block">Select Floors</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {floors.map(floor => (
                  <div key={floor.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`pdf-floor-${floor.id}`}
                      checked={pdfFloorIds.includes(floor.id)}
                      onChange={() => {
                        setPdfFloorIds(prev => prev.includes(floor.id) ? prev.filter(id => id !== floor.id) : [...prev, floor.id]);
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-teal focus:ring-gold focus:ring-offset-2 accent-teal"
                    />
                    <Label htmlFor={`pdf-floor-${floor.id}`} className="text-sm font-medium text-midnight cursor-pointer">
                      {floor.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <p className="text-xs text-slate font-medium">
                Active Staff: <span className="font-bold text-midnight">{pdfStaffCount}</span> on {pdfFloorIds.length} floors
              </p>
              <Button onClick={handlePdfDownload} disabled={isDownloadingPdf} className="bg-gold hover:bg-gold/90 text-midnight font-bold h-11 px-6 rounded-lg transition-all cursor-pointer">
                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download PDF
              </Button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-sans">
              One page per floor layout · Suitable for noticeboard printing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section C: Staff Hours Report */}
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/50 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center text-midnight">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold font-sans text-midnight">Staff Hours Report</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-sans">Overview of scheduled hours vs contracted hours.</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={reportPeriodStart} onValueChange={(val) => handleFetchHours(val || '')}>
              <SelectTrigger className="w-full sm:w-56 text-sm h-10 border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.startStr} value={p.startStr}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportHoursCsv} disabled={isExportingReportCsv || hoursData.length === 0} variant="outline" className="border-slate-200 text-midnight font-bold h-10 cursor-pointer">
              {isExportingReportCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Table to CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingHours ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : hoursData.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hours report data available.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-midnight hover:bg-midnight">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-midnight text-white font-bold text-xs uppercase tracking-wider p-4 z-10">Staff Name</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4">Role</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4">Type</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4">Floor</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4 text-center">Shifts</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4 text-right">Total Hours</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4 text-right">Contracted Hours</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase tracking-wider p-4 text-center">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hoursData.map((h, i) => (
                    <TableRow key={h.staffId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <TableCell className="sticky left-0 font-bold text-sm text-midnight p-4 bg-inherit border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{h.staffName}</TableCell>
                      <TableCell className="text-sm font-medium text-slate p-4">{formatRole(h.role)}</TableCell>
                      <TableCell className="text-sm text-slate p-4 capitalize">
                        {h.employmentType === 'full_time' ? 'Full-time' : h.employmentType === 'part_time' ? 'Part-time' : 'Bank'}
                      </TableCell>
                      <TableCell className="text-sm text-slate p-4 font-semibold">{h.floorName || 'General'}</TableCell>
                      <TableCell className="text-sm text-midnight p-4 text-center font-semibold">{h.totalShifts}</TableCell>
                      <TableCell className="text-sm text-midnight p-4 text-right font-bold">{h.totalHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-sm text-slate p-4 text-right font-medium">{h.contractedHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-sm p-4 text-center">
                        <span className={getVarianceColor(h.variance)}>
                          {h.variance >= 0 ? '+' : ''}{h.variance.toFixed(1)}h
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

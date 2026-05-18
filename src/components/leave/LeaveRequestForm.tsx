"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema } from "@/lib/validations";
import { useCreateLeaveRequest } from "@/hooks/useLeave";
import { useStaff } from "@/hooks/useStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { LeaveBalance } from "./LeaveBalance";
import { toast } from "sonner";
import { Calendar, User, FileText, AlertTriangle } from "lucide-react";
import { z } from "zod";

type FormValues = z.infer<typeof leaveRequestSchema>;

type LeaveRequestFormProps = {
  fixedStaffId?: string;
  onSuccess?: () => void;
  isManager?: boolean;
};

export function LeaveRequestForm({ fixedStaffId, onSuccess, isManager = true }: LeaveRequestFormProps) {
  const { data: staffList, isLoading: isStaffLoading } = useStaff();
  const createMutation = useCreateLeaveRequest();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      staffId: fixedStaffId || "",
      leaveType: "AL",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  const selectedStaffId = watch("staffId");
  const leaveType = watch("leaveType");

  const onSubmit = async (values: FormValues) => {
    // Validate dates range order
    if (new Date(values.startDate) > new Date(values.endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    try {
      await createMutation.mutateAsync({
        staffId: values.staffId,
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        notes: values.notes || undefined,
      });
      toast.success("Leave request submitted successfully!");
      reset({
        staffId: fixedStaffId || "",
        leaveType: "AL",
        startDate: "",
        endDate: "",
        notes: "",
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit leave request");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white p-6 rounded-lg border border-slate/20 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-midnight font-sans">Request Leave</h3>
          <p className="text-xs text-slate">Submit a new annual leave or absence request.</p>
        </div>

        {/* Staff Selection */}
        {isManager && !fixedStaffId ? (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-midnight">
              <User className="h-4 w-4 text-slate" />
              Staff Member
            </Label>
            <div className="relative">
              {isStaffLoading ? (
                <div className="h-8 w-full animate-pulse rounded-lg bg-slate/10" />
              ) : (
                <Select
                  value={selectedStaffId}
                  onValueChange={(val) => setValue("staffId", val as string, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Select staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {errors.staffId && (
              <span className="text-[11px] font-medium text-danger">{errors.staffId.message}</span>
            )}
          </div>
        ) : null}

        {/* Leave Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-midnight">
            <FileText className="h-4 w-4 text-slate" />
            Leave Type
          </Label>
          <Select
            value={leaveType}
            onValueChange={(val) => setValue("leaveType", (val || "AL") as any, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AL">Annual Leave (AL)</SelectItem>
              <SelectItem value="ML">Maternity Leave (ML)</SelectItem>
              <SelectItem value="sick">Sick Leave (sick)</SelectItem>
              <SelectItem value="other">Other Absence</SelectItem>
            </SelectContent>
          </Select>
          {errors.leaveType && (
            <span className="text-[11px] font-medium text-danger">{errors.leaveType.message}</span>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-midnight">
              <Calendar className="h-4 w-4 text-slate" />
              Start Date
            </Label>
            <Input
              type="date"
              className="h-8 text-sm"
              {...register("startDate")}
            />
            {errors.startDate && (
              <span className="text-[11px] font-medium text-danger">{errors.startDate.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-midnight">
              <Calendar className="h-4 w-4 text-slate" />
              End Date
            </Label>
            <Input
              type="date"
              className="h-8 text-sm"
              {...register("endDate")}
            />
            {errors.endDate && (
              <span className="text-[11px] font-medium text-danger">{errors.endDate.message}</span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-midnight">Notes / Reason</Label>
          <Textarea
            rows={3}
            placeholder="Add any specific details here..."
            className="text-sm resize-none"
            {...register("notes")}
          />
          {errors.notes && (
            <span className="text-[11px] font-medium text-danger">{errors.notes.message}</span>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-gold hover:bg-gold/90 text-midnight font-semibold h-9 rounded-md transition-colors"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Submitting..." : "Submit Leave Request"}
        </Button>
      </form>

      {/* Dynamic Interactive Leave Balance Display */}
      <div className="flex flex-col justify-start">
        {selectedStaffId ? (
          <LeaveBalance staffId={selectedStaffId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 border-2 border-dashed border-slate/20 rounded-lg bg-white">
            <User className="h-10 w-10 text-slate/30 mb-3" />
            <p className="text-sm font-medium text-slate text-center font-sans">
              Select a staff member to view their real-time annual leave balance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

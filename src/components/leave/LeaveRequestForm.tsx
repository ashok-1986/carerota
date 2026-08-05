"use client";

import { useState } from "react";
import { useStaff } from "@/hooks/useStaff";
import { useCreateLeaveRequest } from "@/hooks/useLeave";
import { toast } from "sonner";

type LeaveType = "AL" | "ML" | "sick" | "paternity" | "compassionate" | "other";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "AL", label: "Annual Leave (AL)" },
  { value: "ML", label: "Maternity Leave (ML)" },
  { value: "sick", label: "Sick Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
  { value: "other", label: "Other Absence" },
];

type LeaveRequestFormProps = {
  fixedStaffId?: string;
  onSuccess?: () => void;
  isManager?: boolean;
};

export default function LeaveRequestForm({
  fixedStaffId,
  onSuccess,
  isManager = true,
}: LeaveRequestFormProps) {
  const [staffId, setStaffId] = useState(fixedStaffId || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("AL");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: staffList } = useStaff();
  const createMutation = useCreateLeaveRequest();

  const showStaffSelect = isManager && !fixedStaffId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (endDate && startDate && endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync({
        staffId,
        leaveType,
        startDate,
        endDate,
        notes: reason || undefined,
      });
      toast.success("Leave request submitted successfully!");

      setStartDate("");
      setEndDate("");
      setLeaveType("AL");
      setReason("");
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message || "Error submitting leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Request Leave
        </h3>
        <form className="mt-5 sm:flex sm:flex-col" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {showStaffSelect && (
              <div className="sm:col-span-6">
                <label
                  htmlFor="staff-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  Staff Member
                </label>
                <select
                  id="staff-select"
                  name="staff-select"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select staff member...
                  </option>
                  {staffList?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-3">
              <label
                htmlFor="leave-type"
                className="block text-sm font-medium text-gray-700"
              >
                Leave Type
              </label>
              <select
                id="leave-type"
                name="leave-type"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                name="start-date"
                id="start-date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                name="end-date"
                id="end-date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const shiftSchema = z.object({
  shiftCodeId: z.number(),
  staffId: z.number(),
  date: z.string(),
});

export const leaveTypeEnum = z.enum([
  "AL",
  "ML",
  "sick",
  "paternity",
  "compassionate",
  "other",
]);

export const leaveRequestSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID format"),
  leaveType: leaveTypeEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  notes: z.string().max(500, "Notes must be 500 characters or fewer").optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  },
);

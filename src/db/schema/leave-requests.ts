import { pgTable, uuid, varchar, date, text, timestamp } from "drizzle-orm/pg-core";
import { homes } from "./homes";
import { staff } from "./staff";

export const leaveRequests = pgTable('leave_requests', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull().references(() => homes.id),
  staffId:     uuid('staff_id').notNull().references(() => staff.id),
  leaveType:   varchar('leave_type').notNull(),
  startDate:   date('start_date').notNull(),
  endDate:     date('end_date').notNull(),
  status:      varchar('status').default('pending').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy:  uuid('reviewed_by'),
  reviewedAt:  timestamp('reviewed_at'),
  notes:       text('notes'),
});

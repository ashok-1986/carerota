import { pgTable, uuid, smallint, timestamp } from "drizzle-orm/pg-core";
import { staff } from "./staff";
import { shiftCodes } from "./shift-codes";

export const staffPatterns = pgTable('staff_patterns', {
  id:               uuid('id').primaryKey().defaultRandom(),
  staffId:          uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dayOfWeek:        smallint('day_of_week').notNull(), // 1 (Mon) to 7 (Sun)
  shiftCodeId:      uuid('shift_code_id').references(() => shiftCodes.id, { onDelete: 'set null' }),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

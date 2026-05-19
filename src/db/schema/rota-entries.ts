import { pgTable, uuid, date, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { homes } from "./homes";
import { staff } from "./staff";
import { homeFloors } from "./floors";
import { shiftCodes } from "./shift-codes";

export const rotaEntries = pgTable('rota_entries', {
  id:             uuid('id').primaryKey().defaultRandom(),
  homeId:         uuid('home_id').notNull().references(() => homes.id),
  staffId:        uuid('staff_id').notNull().references(() => staff.id),
  homeFloorId:    uuid('home_floor_id').notNull().references(() => homeFloors.id),
  shiftDate:      date('shift_date').notNull(),
  shiftCodeId:    uuid('shift_code_id').references(() => shiftCodes.id),
  actualFloorId:  uuid('actual_floor_id').references(() => homeFloors.id),
  rotaMonth:      date('rota_month').notNull(),
  isPublished:    boolean('is_published').default(false).notNull(),
  createdBy:      uuid('created_by').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  staffDayFloor: unique('rota_entries_staff_day_floor_unique').on(table.staffId, table.shiftDate, table.homeFloorId),
}));

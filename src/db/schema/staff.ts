import { pgTable, uuid, varchar, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { homes } from "./homes";
import { homeFloors } from "./floors";

export const staff = pgTable('staff', {
  id:               uuid('id').primaryKey().defaultRandom(),
  homeId:           uuid('home_id').notNull().references(() => homes.id),
  homeFloorId:      uuid('home_floor_id').references(() => homeFloors.id),
  name:             varchar('name', { length: 255 }).notNull(),
  role:             varchar('role', { length: 50 }).notNull(),
  employmentType:   varchar('employment_type').notNull(), // full_time|part_time|bank
  contractedHours:  decimal('contracted_hours', { precision: 5, scale: 2 }),
  payRateHourly:    decimal('pay_rate_hourly', { precision: 8, scale: 2 }),
  authUserId:       uuid('auth_user_id'),
  isActive:         boolean('is_active').default(true).notNull(),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

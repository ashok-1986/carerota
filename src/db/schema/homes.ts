import { pgTable, uuid, varchar, smallint, decimal, timestamp, text, jsonb } from "drizzle-orm/pg-core";

export const homes = pgTable('homes', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  name:                varchar('name', { length: 255 }).notNull(),
  groupId:             uuid('group_id'),           // Future: care_groups FK
  payrollStartDay:     smallint('payroll_start_day').default(19).notNull(),
  budgetCapMonthly:    decimal('budget_cap_monthly', { precision: 10, scale: 2 }),
  budgetNotes:         text('budget_notes'),
  homeSettings:        jsonb('home_settings').default('{}'),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
});

import { pgTable, uuid, date, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { homes } from "./homes";

export const additionalCosts = pgTable('additional_costs', {
  id: uuid('id').primaryKey().defaultRandom(),
  homeId: uuid('home_id').notNull().references(() => homes.id),
  rotaMonth: date('rota_month').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  addedBy: uuid('added_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

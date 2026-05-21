import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { homes } from "./homes";

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  homeId: uuid('home_id').notNull().references(() => homes.id),
  url: text('url').notNull(),
  description: text('description'),
  events: text('events').array().notNull(), // ['rota.published', 'leave.approved', 'budget.updated']
  secret: text('secret').notNull(), // HMAC signing secret
  isActive: boolean('is_active').default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

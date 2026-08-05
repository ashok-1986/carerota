import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

// Shared rate-limit store. In-memory Map (src/lib/rate-limit.ts) is not shared
// across serverless instances and grows unbounded; this table provides a
// distributed counter keyed by identifier, with periodic pruning of expired rows.
export const rateLimits = pgTable('rate_limits', {
  identifier: text('identifier').notNull(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.identifier] }),
]);

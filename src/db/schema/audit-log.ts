import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

// APPEND ONLY. No UPDATE or DELETE ever.
export const auditLog = pgTable('audit_log', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull(),
  userId:      uuid('user_id').notNull(),
  action:      varchar('action', { length: 100 }).notNull(),
  entityType:  varchar('entity_type', { length: 50 }).notNull(),
  entityId:    uuid('entity_id').notNull(),
  beforeValue: jsonb('before_value'),
  afterValue:  jsonb('after_value'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  ipAddress:   varchar('ip_address', { length: 45 }),
});

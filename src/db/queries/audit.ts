import { db } from '../../lib/db';
import { auditLog } from '../schema/audit-log';

export async function insertAuditLog(data: typeof auditLog.$inferInsert) {
  return db.insert(auditLog).values(data).returning();
}

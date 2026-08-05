import { db } from './db';
import { auditLog } from '@/db/schema';

export async function logAction(action: string, details: Record<string, unknown>, ipAddress?: string | null) {
  try {
    await db.insert(auditLog).values({
      homeId: (details.homeId as string) || '',
      userId: (details.userId as string) || '',
      action,
      entityType: (details.entityType as string) || '',
      entityId: (details.entityId as string) || '',
      beforeValue: details.beforeValue || null,
      afterValue: details.afterValue || null,
      ipAddress: ipAddress || null,
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

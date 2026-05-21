import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { insertAuditLog } from '@/db/queries/audit';

export async function GET() {
  const session = await auth();
  if (!session?.user?.homeId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { homeId } = session.user;
    const logs = await db.select().from(auditLog).where(eq(auditLog.homeId, homeId));

    const csvRows = [
      ['Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Details'],
      ...logs.map(log => [
        log.createdAt.toISOString(),
        log.userId || '',
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.afterValue || {}).replace(/"/g, '""') // basic escape
      ])
    ];

    const csvContent = csvRows.map(e => e.join(',')).join('\n');

    await insertAuditLog({
      homeId,
      userId: session.user.id,
      action: 'AUDIT_LOG_EXPORTED',
      entityType: 'home',
      entityId: homeId,
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_log_${homeId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

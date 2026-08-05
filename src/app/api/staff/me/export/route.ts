import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { staff, rotaEntries, leaveRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '@/lib/audit'
import { getClientIp } from '@/lib/client-ip'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const userId = session.user.id
  const homeId = session.user.homeId

  // Fetch all personal data for this user
  const [staffRecord] = await db
    .select()
    .from(staff)
    .where(eq(staff.authUserId, userId))

  if (!staffRecord) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
  }

  const rotaHistory = await db
    .select()
    .from(rotaEntries)
    .where(eq(rotaEntries.staffId, staffRecord.id))

  const leaveHistory = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.staffId, staffRecord.id))

  // Assemble export — never include pay rates for non-manager export
  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: session.user.email,
    dataController: 'Gold Care Homes Ltd',
    dataProcessor: 'Alchemetryx Ltd (CareRota)',
    personalData: {
      name: staffRecord.name,
      email: session.user.email,
      role: staffRecord.role,
      employmentType: staffRecord.employmentType,
      contractedHoursPerWeek: staffRecord.contractedHours,
      floor: staffRecord.homeFloorId,
      activeStatus: staffRecord.isActive,
      createdAt: staffRecord.createdAt,
    },
    scheduleHistory: rotaHistory.map(r => ({
      date: r.shiftDate,
      shiftCode: r.shiftCodeId,
      isPublished: r.isPublished,
    })),
    leaveHistory: leaveHistory.map(l => ({
      type: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status,
      requestedAt: l.requestedAt,
    })),
  }

  // Audit log this export
  await logAction('DATA_EXPORT_REQUESTED', {
    homeId: homeId || 'unknown',
    userId,
    entityType: 'staff',
    entityId: staffRecord.id,
    afterValue: { exportedAt: exportData.exportedAt },
  }, getClientIp(req))

  // Return as downloadable JSON file
  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="carerota-data-export-${Date.now()}.json"`,
    },
  })
}

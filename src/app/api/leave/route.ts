import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff as staffTable, leaveRequests, users } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { leaveRequestSchema } from '@/lib/validations';
import { createLeaveRequest, getLeaveRequests } from '@/db/queries/leave';
import { logAction } from '@/lib/audit';
import { getClientIp } from '@/lib/client-ip';
import { sendLeaveRequestNotification } from '@/lib/email';
import { isManager } from '@/lib/authz';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  if (!isManager(role)) {
    return NextResponse.json({ error: 'Forbidden: Invalid role permissions' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'declined' | 'all' | null;
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const rows = await getLeaveRequests(homeId, {
      status: status || undefined,
      staffId: staffId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error in GET /api/leave:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role, id: userId } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = leaveRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { staffId, leaveType, startDate, endDate, notes } = result.data;

    const isManagerRole = isManager(role);

    if (isManagerRole) {
      const [staffMember] = await db
        .select()
        .from(staffTable)
        .where(and(eq(staffTable.id, staffId), eq(staffTable.homeId, homeId)))
        .limit(1);

      if (!staffMember) {
        return NextResponse.json({ error: 'Forbidden: Staff member does not belong to your home' }, { status: 403 });
      }
    } else {
      const [staffMember] = await db
        .select()
        .from(staffTable)
        .where(and(eq(staffTable.homeId, homeId), eq(staffTable.authUserId, userId || '')))
        .limit(1);

      const resolvedStaffId = staffMember?.id || (userId === staffId ? userId : null);

      if (!resolvedStaffId || resolvedStaffId !== staffId) {
        return NextResponse.json({ error: 'Forbidden: You can only request leave for yourself' }, { status: 403 });
      }
    }

    const [existing] = await db
      .select({ id: leaveRequests.id })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.staffId, staffId),
          eq(leaveRequests.status, 'approved'),
          lte(leaveRequests.startDate, endDate),
          gte(leaveRequests.endDate, startDate),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Staff member already has approved leave overlapping this date range' }, { status: 409 });
    }

    const newRequest = await createLeaveRequest({
      homeId,
      staffId,
      leaveType,
      startDate,
      endDate,
      status: 'pending',
      notes: notes || null,
    });

    await logAction('leave.request.created', {
      homeId,
      userId: userId,
      entityType: 'leave_request',
      entityId: newRequest.id,
      staffId,
      leaveType,
      startDate,
      endDate,
    }, getClientIp(req));

    const [staffInfo] = await db
      .select({ name: staffTable.name })
      .from(staffTable)
      .where(eq(staffTable.id, staffId))
      .limit(1);

    const [managerStaff] = await db
      .select({ authUserId: staffTable.authUserId })
      .from(staffTable)
      .where(and(eq(staffTable.homeId, homeId), eq(staffTable.role, 'home_manager')))
      .limit(1);

    if (staffInfo && managerStaff?.authUserId) {
      const [managerUser] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, managerStaff.authUserId))
        .limit(1);

      if (managerUser?.email) {
        await sendLeaveRequestNotification(
          newRequest,
          staffInfo.name,
          managerUser.email,
        );
      }
    }

    return NextResponse.json({ data: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/leave:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

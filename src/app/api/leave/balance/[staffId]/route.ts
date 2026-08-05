import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLeaveBalance } from '@/db/queries/leave';
import { isManager } from '@/lib/authz';

type RouteParams = {
  params: Promise<{
    staffId: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // 1. Verify session exists
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { homeId, role, id: userId } = session.user;
  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  try {
    const { staffId } = await params;

    // 2. Authorize: manager/admin or the staff member themselves
    const isManagerRole = isManager(role);

    if (!isManagerRole) {
      // If not manager, must match session user's staff record
      const [staffMember] = await db
        .select()
        .from(staff)
        .where(
          and(
            eq(staff.homeId, homeId),
            eq(staff.authUserId, userId)
          )
        )
        .limit(1);

      const resolvedStaffId = staffMember?.id || (userId === staffId ? userId : null);

      if (!resolvedStaffId || resolvedStaffId !== staffId) {
        return new NextResponse('Forbidden: You can only view your own leave balance', { status: 403 });
      }
    } else {
      // If manager, verify staff member belongs to manager's home
      const [staffMember] = await db
        .select()
        .from(staff)
        .where(and(eq(staff.id, staffId), eq(staff.homeId, homeId)))
        .limit(1);

      if (!staffMember) {
        return new NextResponse('Forbidden: Staff member does not belong to your home', { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const data = await getLeaveBalance(staffId, homeId, year);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/leave/balance/[staffId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

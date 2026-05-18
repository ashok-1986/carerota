import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff as staffTable, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateLeaveStatus } from '@/db/queries/leave';
import { logAction } from '@/lib/audit';
import { sendLeaveApprovalEmail, sendLeaveDeclineEmail } from '@/lib/email';
import { z } from 'zod';
import { blockRotaForLeave } from '@/lib/rota';

const patchSchema = z.object({
  status: z.enum(['approved', 'declined']),
  notes: z.string().optional().nullable(),
});

type RouteParams = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role, id: userId } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  const allowedRoles = ['home_manager', 'manager', 'admin'];
  if (!allowedRoles.includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden: Only managers can review leave' }, { status: 403 });
  }

  try {
    const { requestId } = await params;
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { status, notes } = result.data;

    const [managerStaff] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.authUserId, userId))
      .limit(1);
    const reviewerId = managerStaff?.id || userId;

    const { request: leaveReq, updatedRequest } = await updateLeaveStatus(
      requestId,
      homeId,
      status,
      reviewerId,
      notes || undefined,
    );

    const [staffMember] = await db
      .select({
        name: staffTable.name,
        authUserId: staffTable.authUserId,
      })
      .from(staffTable)
      .where(eq(staffTable.id, leaveReq.staffId))
      .limit(1);

    if (status === 'approved') {
      await blockRotaForLeave(requestId, homeId, reviewerId);

      if (staffMember?.authUserId) {
        const [userRecord] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, staffMember.authUserId))
          .limit(1);

        if (userRecord?.email) {
          await sendLeaveApprovalEmail(
            updatedRequest,
            staffMember.name,
            userRecord.email,
          );
        }
      }
    }

    if (status === 'declined') {
      if (staffMember?.authUserId) {
        const [userRecord] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, staffMember.authUserId))
          .limit(1);

        if (userRecord?.email) {
          await sendLeaveDeclineEmail(
            updatedRequest,
            staffMember.name,
            userRecord.email,
            notes,
          );
        }
      }
    }

    await logAction('leave.status.updated', {
      homeId,
      userId: reviewerId,
      entityType: 'leave_request',
      entityId: requestId,
      beforeStatus: leaveReq.status,
      afterStatus: status,
      notes: notes || undefined,
    });

    return NextResponse.json({ data: updatedRequest });
  } catch (error) {
    console.error('Error in PATCH /api/leave/[requestId]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

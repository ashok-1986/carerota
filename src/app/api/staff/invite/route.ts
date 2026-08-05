import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff, users } from '@/db/schema';
import { logAction } from '@/lib/audit';
import { getClientIp } from '@/lib/client-ip';
import { fireWebhook } from '@/lib/webhooks';
import { isManager } from '@/lib/authz';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, email, role: staffRole, employmentType, contractedHours, payRateHourly, homeFloorId } = await req.json();

    if (!name || !email || !staffRole) {
      return NextResponse.json({ error: 'Missing required fields: name, email, role' }, { status: 400 });
    }

    const homeId = session.user.homeId;
    if (!homeId) {
      return NextResponse.json({ error: 'Home association missing' }, { status: 403 });
    }

    // Atomically get-or-create the user linked to this email. Using an upsert
    // (rather than select-then-insert) closes the TOCTOU race where two
    // concurrent invites for the same email both try to insert a new user row.
    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        name,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name },
      })
      .returning();
    const userId = user.id;

    const [staffMember] = await db.insert(staff).values({
      homeId,
      homeFloorId: homeFloorId || null,
      name,
      role: staffRole,
      employmentType: employmentType || 'bank',
      contractedHours: contractedHours || null,
      // Input is in pounds (matches updateStaff); stored as pence.
      payRateHourly: payRateHourly ? (Number(payRateHourly) * 100).toString() : null,
      authUserId: userId,
      isActive: true,
    }).returning();

    await logAction('staff.invite.sent', {
      homeId,
      userId: session.user.id,
      entityType: 'staff',
      entityId: staffMember.id,
    }, getClientIp(req));

    // Fire webhook staff.added
    await fireWebhook(homeId, 'staff.added', {
      staffId: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      email,
      employmentType: staffMember.employmentType,
    });

    return NextResponse.json({ data: staffMember }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/staff/invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAction } from '@/lib/audit';
import { fireWebhook } from '@/lib/webhooks';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles = ['home_manager', 'manager', 'admin'];
  if (!allowedRoles.includes(session.user.role || '')) {
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

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Pre-emptively create the user so they are correctly linked
      const [newUser] = await db.insert(users).values({
        id: crypto.randomUUID(),
        email: email,
        name: name,
      }).returning();
      userId = newUser.id;
    }

    const [staffMember] = await db.insert(staff).values({
      homeId,
      homeFloorId: homeFloorId || null,
      name,
      role: staffRole,
      employmentType: employmentType || 'bank',
      contractedHours: contractedHours || null,
      payRateHourly: payRateHourly || null,
      authUserId: userId,
      isActive: true,
    }).returning();

    await logAction('staff.invite.sent', {
      homeId,
      userId: session.user.id,
      entityType: 'staff',
      entityId: staffMember.id,
    });

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

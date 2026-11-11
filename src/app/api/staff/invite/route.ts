import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff, users, homeFloors } from '@/db/schema';
import { logAction } from '@/lib/audit';
import { getClientIp } from '@/lib/client-ip';
import { fireWebhook } from '@/lib/webhooks';
import { isManager } from '@/lib/authz';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const inviteSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.string().min(1).max(50),
  employmentType: z.enum(['full_time', 'part_time', 'bank']).optional().default('bank'),
  contractedHours: z.number().nullable().optional(),
  payRateHourly: z.number().nullable().optional(),
  homeFloorId: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const homeId = session.user.homeId;
  if (!homeId) {
    return NextResponse.json({ error: 'Home association missing' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = inviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const {
      name,
      email,
      role: staffRole,
      employmentType,
      contractedHours,
      payRateHourly,
      homeFloorId,
    } = result.data;

    if (homeFloorId) {
      const [floor] = await db
        .select()
        .from(homeFloors)
        .where(and(eq(homeFloors.id, homeFloorId), eq(homeFloors.homeId, homeId)))
        .limit(1);

      if (!floor) {
        return NextResponse.json({ error: 'Forbidden: Floor does not belong to home' }, { status: 400 });
      }
    }

    const { staffMember, user } = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ id: crypto.randomUUID(), email, name })
        .onConflictDoUpdate({ target: users.email, set: { name } })
        .returning();

      const [staffMember] = await tx.insert(staff).values({
        homeId,
        homeFloorId: homeFloorId || null,
        name,
        role: staffRole,
        employmentType: employmentType || 'bank',
        contractedHours: contractedHours ? contractedHours.toString() : null,
        payRateHourly: payRateHourly ? (Number(payRateHourly) * 100).toString() : null,
        authUserId: user.id,
        isActive: true,
      }).returning();

      return { staffMember, user };
    });
    void user;

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

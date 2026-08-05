import { NextRequest, NextResponse } from 'next/server';
import { applyPatternsToPeriod } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { hasRole, PUBLISH_ROLES } from '@/lib/authz';

const applyPatternSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  floorId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Verify session exists → 401 if not
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Extract homeId and role
  const homeId = session.user.homeId;
  const role = session.user.role;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  // 3. Manager role only for applying patterns
  if (!hasRole(role, PUBLISH_ROLES)) {
    return new NextResponse('Forbidden: Only managers can apply patterns', { status: 403 });
  }

  try {
    const body = await req.json();
    const result = applyPatternSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.message, { status: 400 });
    }

    const { startDate, endDate, floorId } = result.data;

    // 4. Verify the requested floorId belongs to that homeId → 403 if not
    if (floorId) {
      const [floor] = await db
        .select()
        .from(homeFloors)
        .where(and(eq(homeFloors.id, floorId), eq(homeFloors.homeId, homeId)))
        .limit(1);
      if (!floor) {
        return new NextResponse(`Forbidden: Floor ${floorId} does not belong to home`, { status: 403 });
      }
    }

    const createdBy = session.user.id || 'system';
    await applyPatternsToPeriod(homeId, startDate, endDate, createdBy, floorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error applying patterns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

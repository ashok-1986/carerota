import { NextRequest, NextResponse } from 'next/server';
import { bulkUpsertEntries } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { hasRole, PUBLISH_ROLES } from '@/lib/authz';

const bulkUpsertSchema = z.object({
  updates: z.array(z.object({
    staffId: z.string(),
    homeFloorId: z.string(),
    shiftDate: z.string(),
    shiftCodeId: z.string().nullable(),
    rotaMonth: z.string(),
  }))
});

export async function POST(req: NextRequest) {
  // 1. Verify session exists → 401 if not
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Extract homeId and role from session user
  const homeId = session.user.homeId;
  const role = session.user.role;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  // 4. Verify user role is in the allowed list → 403 if not (manager only)
  if (!hasRole(role, PUBLISH_ROLES)) {
    return new NextResponse('Forbidden: Only managers can perform bulk updates', { status: 403 });
  }

  try {
    const body = await req.json();
    const result = bulkUpsertSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.message, { status: 400 });
    }

    const { updates } = result.data;

    if (updates.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 3. Verify the requested floorId belongs to that homeId → 403 if not
    const uniqueFloorIds = Array.from(new Set(updates.map(u => u.homeFloorId)));
    for (const floorId of uniqueFloorIds) {
      const [floor] = await db
        .select()
        .from(homeFloors)
        .where(and(eq(homeFloors.id, floorId), eq(homeFloors.homeId, homeId)))
        .limit(1);
      if (!floor) {
        return new NextResponse(`Forbidden: Floor ${floorId} does not belong to home`, { status: 403 });
      }
    }

    // Map updates to DB shape: force homeId and createdBy from active session user
    const dbUpdates = updates.map(u => ({
      ...u,
      homeId,
      createdBy: session.user.id || 'system',
    }));

    await bulkUpsertEntries(dbUpdates);

    return NextResponse.json({ success: true, count: dbUpdates.length });
  } catch (error) {
    console.error('Error in bulk upsert:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rotaEntries, auditLog } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const publishSchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
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
  const allowedRoles = ['home_manager', 'manager'];
  if (!allowedRoles.includes(role || '')) {
    return new NextResponse('Forbidden: Only managers can publish the rota', { status: 403 });
  }

  try {
    const body = await req.json();
    const result = publishSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.message, { status: 400 });
    }

    const { start, end } = result.data;

    // Run in transaction to update entries and write audit log
    const summary = await db.transaction(async (tx) => {
      // Perform the update
      const updatedEntries = await tx
        .update(rotaEntries)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(
          and(
            eq(rotaEntries.homeId, homeId),
            gte(rotaEntries.shiftDate, start),
            lte(rotaEntries.shiftDate, end)
          )
        )
        .returning();

      // Log to audit log
      await tx.insert(auditLog).values({
        homeId,
        userId: session.user.id,
        action: 'publish_rota',
        entityType: 'rota',
        entityId: homeId, // Use homeId as entityId for a global rota action
        beforeValue: { isPublished: false, period: { start, end } },
        afterValue: { isPublished: true, period: { start, end }, count: updatedEntries.length },
      });

      return {
        success: true,
        count: updatedEntries.length,
        period: { start, end }
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error publishing rota:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

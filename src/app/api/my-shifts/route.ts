import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rotaEntries, shiftCodes, staff } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 });
  }

  try {
    // Resolve the staff record linked to this auth user. rotaEntries.staffId
    // references staff.id, NOT the auth users.id held in session.user.id.
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(eq(staff.authUserId, userId))
      .limit(1);

    if (!staffMember) {
      return NextResponse.json({ error: 'No staff record linked to this account' }, { status: 404 });
    }

    const rows = await db
      .select({
        id: rotaEntries.id,
        shiftDate: rotaEntries.shiftDate,
        code: shiftCodes.code,
        homeFloorId: rotaEntries.homeFloorId,
        isPublished: rotaEntries.isPublished,
      })
      .from(rotaEntries)
      .leftJoin(shiftCodes, eq(rotaEntries.shiftCodeId, shiftCodes.id))
      .where(
        and(
          eq(rotaEntries.staffId, staffMember.id),
          gte(rotaEntries.shiftDate, start),
          lte(rotaEntries.shiftDate, end),
        ),
      )
      .orderBy(rotaEntries.shiftDate);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching my shifts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rotaEntries, shiftCodes } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staffId = session.user.id;
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 });
  }

  try {
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
          eq(rotaEntries.staffId, staffId),
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

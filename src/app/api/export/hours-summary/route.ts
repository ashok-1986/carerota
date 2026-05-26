import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStaffHoursSummary } from '@/db/queries/analytics';
import { z } from 'zod';

const querySchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { homeId } = session.user;
  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const result = querySchema.safeParse({ start, end });
  if (!result.success) {
    return new NextResponse(result.error.message, { status: 400 });
  }

  try {
    const hoursSummary = await getStaffHoursSummary(homeId, result.data.start, result.data.end);
    return NextResponse.json({ data: hoursSummary });
  } catch (error) {
    console.error('Error fetching staff hours summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

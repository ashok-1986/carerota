import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  // 1. Verify session exists → 401 if not
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const homeId = session.user.homeId;
  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  try {
    const floors = await db
      .select({
        id: homeFloors.id,
        name: homeFloors.name,
      })
      .from(homeFloors)
      .where(eq(homeFloors.homeId, homeId));

    return NextResponse.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

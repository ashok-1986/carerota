import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStaffByHome } from '@/db/queries/staff';

export async function GET() {
  // 1. Verify session exists
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { homeId } = session.user;
  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  try {
    const staffList = await getStaffByHome(homeId);
    return NextResponse.json({ data: staffList });
  } catch (error) {
    console.error('Error fetching staff in GET /api/staff:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
  return new NextResponse('Not Implemented', { status: 501 });
}

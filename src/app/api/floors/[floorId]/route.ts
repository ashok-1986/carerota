import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateFloorName } from '@/db/queries/floors';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).max(50),
});

type RouteParams = { params: Promise<{ floorId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { floorId } = await params;
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const updated = await updateFloorName(floorId, session.user.homeId, result.data.name);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating floor name:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

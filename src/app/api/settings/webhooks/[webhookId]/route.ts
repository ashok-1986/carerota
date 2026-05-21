import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toggleWebhook, deleteWebhook } from '@/db/queries/webhooks';
import { z } from 'zod';

type RouteParams = { params: Promise<{ webhookId: string }> };

const patchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { webhookId } = await params;
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const updated = await toggleWebhook(webhookId, session.user.homeId, result.data.isActive);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error toggling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { webhookId } = await params;
    const deleted = await deleteWebhook(webhookId, session.user.homeId);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

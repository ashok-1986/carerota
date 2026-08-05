import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isManager } from '@/lib/authz';
import { toggleWebhook, deleteWebhook } from '@/db/queries/webhooks';
import { logAction } from '@/lib/audit';
import { getClientIp } from '@/lib/client-ip';
import { z } from 'zod';

type RouteParams = { params: Promise<{ webhookId: string }> };

const patchSchema = z.object({ isActive: z.boolean() });

function stripSecret<T extends { secret?: unknown }>(webhook: T): Omit<T, 'secret'> {
  const { secret: _secret, ...rest } = webhook;
  void _secret;
  return rest;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isManager(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { webhookId } = await params;
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const updated = await toggleWebhook(webhookId, session.user.homeId, result.data.isActive);
    return NextResponse.json({ data: updated ? stripSecret(updated) : updated });
  } catch (error) {
    console.error('Error toggling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isManager(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { webhookId } = await params;
    const deleted = await deleteWebhook(webhookId, session.user.homeId);

    if (deleted) {
      await logAction('WEBHOOK_DELETED', {
        homeId: session.user.homeId,
        userId: session.user.id,
        entityType: 'webhook',
        entityId: webhookId,
        beforeValue: stripSecret(deleted),
      }, getClientIp(req));
    }

    return NextResponse.json({ data: deleted ? stripSecret(deleted) : deleted });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

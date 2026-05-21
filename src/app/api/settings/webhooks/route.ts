import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWebhooksByHome, createWebhook } from '@/db/queries/webhooks';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const postSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  events: z.array(z.string()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhooks = await getWebhooksByHome(session.user.homeId);
  return NextResponse.json({ data: webhooks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const result = postSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const { url, description, events } = result.data;
    const secret = randomBytes(32).toString('hex');

    const webhook = await createWebhook({
      homeId: session.user.homeId,
      url,
      description,
      events,
      secret,
      isActive: true,
    });

    return NextResponse.json({ data: webhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

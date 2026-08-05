import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isManager } from '@/lib/authz';
import { encryptSecret } from '@/lib/crypto';
import { getWebhooksByHome, createWebhook } from '@/db/queries/webhooks';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const postSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  events: z.array(z.string()),
});

function stripSecret<T extends { secret?: unknown }>(webhook: T): Omit<T, 'secret'> {
  const { secret: _secret, ...rest } = webhook;
  void _secret;
  return rest;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isManager(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const webhooks = await getWebhooksByHome(session.user.homeId);
  return NextResponse.json({ data: webhooks.map(stripSecret) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isManager(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const result = postSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const { url, description, events } = result.data;
    const plaintextSecret = randomBytes(32).toString('hex');

    const webhook = await createWebhook({
      homeId: session.user.homeId,
      url,
      description,
      events,
      secret: encryptSecret(plaintextSecret),
      isActive: true,
    });

    // Return the plaintext secret exactly once (in the creation response) so the
    // UI can show it to the admin; the stored value is encrypted at rest.
    return NextResponse.json({ data: { ...webhook, secret: plaintextSecret } });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

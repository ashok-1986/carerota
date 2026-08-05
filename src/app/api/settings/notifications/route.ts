import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHomeById, updateHomeSettings } from '@/db/queries/homes';
import { z } from 'zod';
import { isManager } from '@/lib/authz';

// Strict schema matching the known notification settings (see
// NotificationsTab defaultSettings). .strict() rejects unknown keys so a
// malicious or malformed body cannot persist arbitrary home settings.
const patchSchema = z.object({
  emailOnRotaPublish: z.boolean().optional(),
  emailOnLeaveRequest: z.boolean().optional(),
  emailOnLeaveApproval: z.boolean().optional(),
  gapAlertEnabled: z.boolean().optional(),
  gapAlertThreshold: z.number().int().min(0).optional(),
  budgetWarningThreshold: z.number().min(0).max(100).optional(),
}).strict();

export async function GET() {
  const session = await auth();
  if (!session?.user?.homeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const home = await getHomeById(session.user.homeId);
  return NextResponse.json({ data: home?.homeSettings || {} });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  if (!isManager(role)) {
    return NextResponse.json({ error: 'Forbidden: Only managers can update settings' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const updatedHome = await updateHomeSettings(homeId, result.data);

    return NextResponse.json({ data: updatedHome?.homeSettings });
  } catch (error) {
    console.error('Error in PATCH /api/settings/notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

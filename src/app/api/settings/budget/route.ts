import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateHomeBudget } from '@/db/queries/homes';
import { insertAuditLog } from '@/db/queries/audit';
import { fireWebhook } from '@/lib/webhooks';
import { z } from 'zod';

const patchSchema = z.object({
  budgetCapMonthly: z.number().nullable().optional(),
  budgetNotes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role, id: userId } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  const allowedRoles = ['home_manager', 'manager', 'admin'];
  if (!allowedRoles.includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden: Only managers can update budget' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { budgetCapMonthly, budgetNotes } = result.data;

    const updatedHome = await updateHomeBudget(
      homeId, 
      budgetCapMonthly !== undefined ? budgetCapMonthly?.toString() ?? null : null, 
      budgetNotes ?? null
    );

    await insertAuditLog({
      homeId,
      userId,
      action: 'BUDGET_CAP_UPDATED',
      entityType: 'home',
      entityId: homeId,
      afterValue: { budgetCapMonthly, budgetNotes },
    });

    await fireWebhook(homeId, 'budget.updated', {
      budgetCapMonthly,
      budgetNotes,
    });

    return NextResponse.json({ data: updatedHome });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

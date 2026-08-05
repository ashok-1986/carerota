import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHomeById, updateHomeBudget } from '@/db/queries/homes';
import { insertAuditLog } from '@/db/queries/audit';
import { getClientIp } from '@/lib/client-ip';
import { fireWebhook } from '@/lib/webhooks';
import { z } from 'zod';

const patchSchema = z.object({
  budgetCapMonthly: z.number().nullable().optional(),
  budgetNotes: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.homeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const home = await getHomeById(session.user.homeId);
    if (!home) {
      return NextResponse.json({ error: 'Home not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        budgetCapMonthly: home.budgetCapMonthly,
        budgetNotes: home.budgetNotes,
        name: home.name,
        payrollStartDay: home.payrollStartDay,
      }
    });
  } catch (error) {
    console.error('Error fetching budget settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { homeId, role, id: userId } = session.user;
  if (!homeId) {
    return NextResponse.json({ error: 'Forbidden: Home association missing' }, { status: 403 });
  }

  if (role !== 'home_manager') {
    return NextResponse.json({ error: 'Forbidden: Only home_manager can update budget' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { budgetCapMonthly, budgetNotes } = result.data;

    // Fetch the previous settings for the audit log
    const currentHome = await getHomeById(homeId);
    const beforeValue = currentHome ? {
      budgetCapMonthly: currentHome.budgetCapMonthly,
      budgetNotes: currentHome.budgetNotes,
    } : null;

    const updatedHome = await updateHomeBudget(
      homeId, 
      budgetCapMonthly !== undefined ? budgetCapMonthly?.toString() ?? null : null, 
      budgetNotes ?? null
    );

    const afterValue = {
      budgetCapMonthly: budgetCapMonthly !== undefined ? budgetCapMonthly?.toString() ?? null : null,
      budgetNotes: budgetNotes ?? null,
    };

    await insertAuditLog({
      homeId,
      userId,
      action: 'BUDGET_CAP_UPDATED',
      entityType: 'home',
      entityId: homeId,
      beforeValue,
      afterValue,
      ipAddress: getClientIp(req),
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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { additionalCosts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAction } from '@/lib/audit';

const VALID_CATEGORIES = ['agency', 'inventory', 'maintenance', 'training', 'equipment', 'other'] as const;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const homeId = session.user.homeId as string;
  if (!homeId) return new NextResponse('Forbidden', { status: 403 });

  const { searchParams } = new URL(request.url);
  const rotaMonth = searchParams.get('rotaMonth');

  if (!rotaMonth) return new NextResponse('Missing rotaMonth query param', { status: 400 });

  try {
    const rows = await db
      .select()
      .from(additionalCosts)
      .where(and(
        eq(additionalCosts.homeId, homeId),
        eq(additionalCosts.rotaMonth, rotaMonth)
      ))
      .orderBy(additionalCosts.createdAt);

    const categorySubtotals: Record<string, number> = {};
    for (const row of rows) {
      const amt = Number(row.amount) || 0;
      categorySubtotals[row.category] = (categorySubtotals[row.category] ?? 0) + amt;
    }

    const totalAdditional = Object.values(categorySubtotals).reduce((s, v) => s + v, 0);

    return NextResponse.json({
      entries: rows,
      categorySubtotals,
      totalAdditional,
    });
  } catch (error) {
    console.error('Error fetching additional costs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const homeId = session.user.homeId as string;
  if (!homeId) return new NextResponse('Forbidden', { status: 403 });

  if (session.user.role !== 'manager') return new NextResponse('Forbidden: manager role required', { status: 403 });

  try {
    const body = await request.json();
    const { category, description, amount, rotaMonth } = body;

    if (!category || !description || amount == null || !rotaMonth) {
      return new NextResponse('Missing required fields: category, description, amount, rotaMonth', { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return new NextResponse(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse('Amount must be a positive number', { status: 400 });
    }

    if (!description || description.trim().length === 0) {
      return new NextResponse('Description is required', { status: 400 });
    }

    const created = await db.insert(additionalCosts).values({
      homeId,
      rotaMonth,
      category,
      description: description.trim(),
      amount: parsedAmount.toFixed(2),
      addedBy: session.user.id as string,
    }).returning();

    const record = created[0];

    await logAction('cost.entry.added', {
      homeId,
      userId: session.user.id as string,
      entityType: 'additional_cost',
      entityId: record.id,
      afterValue: {
        category,
        description: description.trim(),
        amount: parsedAmount.toFixed(2),
        rotaMonth,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating additional cost entry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const homeId = session.user.homeId as string;
  if (!homeId) return new NextResponse('Forbidden', { status: 403 });

  if (session.user.role !== 'manager') return new NextResponse('Forbidden: manager role required', { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('Missing id query param', { status: 400 });

    const existing = await db
      .select()
      .from(additionalCosts)
      .where(and(eq(additionalCosts.id, id), eq(additionalCosts.homeId, homeId)))
      .limit(1);

    if (!existing.length) {
      return new NextResponse('Not found or access denied', { status: 404 });
    }

    await db.delete(additionalCosts).where(eq(additionalCosts.id, id));

    await logAction('cost.entry.removed', {
      homeId,
      userId: session.user.id as string,
      entityType: 'additional_cost',
      entityId: id,
      beforeValue: {
        category: existing[0].category,
        description: existing[0].description,
        amount: existing[0].amount,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting additional cost entry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

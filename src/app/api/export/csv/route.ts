import { NextRequest, NextResponse } from 'next/server';
import { getStaffByHome } from '@/db/queries/staff';
import { getRotaEntriesForPeriod } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generatePayrollRows, convertToCsv } from '@/lib/csv';
import { addMonths, subDays, parseISO, format } from 'date-fns';
import { insertAuditLog } from '@/db/queries/audit';

const exportSchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  floorId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const homeId = session.user.homeId;
  const role = session.user.role;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  const allowedRoles = ['home_manager', 'manager'];
  if (!allowedRoles.includes(role || '')) {
    return new NextResponse('Forbidden: Only managers can export payroll data', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const floorId = searchParams.get('floorId') || undefined;

  const result = exportSchema.safeParse({ start, end, floorId });
  if (!result.success) {
    return new NextResponse(result.error.message, { status: 400 });
  }

  const { start: startDate, end: endDate, floorId: targetFloorId } = result.data;

  if (targetFloorId) {
    const [floor] = await db
      .select()
      .from(homeFloors)
      .where(and(eq(homeFloors.id, targetFloorId), eq(homeFloors.homeId, homeId)))
      .limit(1);
    if (!floor) {
      return new NextResponse(`Forbidden: Floor ${targetFloorId} does not belong to home`, { status: 403 });
    }
  }

  try {
    const [staffList, entries, floors] = await Promise.all([
      getStaffByHome(homeId),
      getRotaEntriesForPeriod(homeId, startDate, endDate),
      db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId)),
    ]);

    const filteredStaff = targetFloorId
      ? staffList.filter((s) => s.homeFloorId === targetFloorId)
      : staffList;

    const filteredEntries = targetFloorId
      ? entries.filter((e) => e.homeFloorId === targetFloorId)
      : entries;

    const rows = generatePayrollRows(filteredEntries, filteredStaff, floors);
    const csvContent = convertToCsv(rows);

    const filename = `Marlborough_Court_Payroll_${startDate}_to_${endDate}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating payroll export:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const homeId = session.user.homeId;
  const role = session.user.role;
  const userId = session.user.id;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  const allowedRoles = ['home_manager', 'manager'];
  if (!allowedRoles.includes(role || '')) {
    return new NextResponse('Forbidden: Only managers can export payroll data', { status: 403 });
  }

  try {
    const { payPeriodStart, floorIds } = await req.json();
    if (!payPeriodStart || !Array.isArray(floorIds)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const startDate = payPeriodStart;
    const start = parseISO(startDate);
    const end = subDays(addMonths(start, 1), 1);
    const endDateStr = format(end, 'yyyy-MM-dd');

    const [staffList, entries, floors] = await Promise.all([
      getStaffByHome(homeId),
      getRotaEntriesForPeriod(homeId, startDate, endDateStr),
      db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId)),
    ]);

    // Filter staff and entries based on selected floorIds
    const filteredStaff = staffList.filter((s) => s.homeFloorId && floorIds.includes(s.homeFloorId));
    const filteredEntries = entries.filter((e) => e.homeFloorId && floorIds.includes(e.homeFloorId));

    // Generate CSV
    const rows = generatePayrollRows(filteredEntries, filteredStaff, floors);
    const csvContent = convertToCsv(rows);

    // Audit log the export
    await insertAuditLog({
      homeId,
      userId,
      action: 'CSV_EXPORTED',
      entityType: 'home',
      entityId: homeId,
      afterValue: { payPeriodStart, floorIds, rowCount: rows.length },
    });

    const filename = `softworks-rota-${payPeriodStart}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating payroll CSV export:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

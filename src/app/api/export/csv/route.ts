import { NextRequest, NextResponse } from 'next/server';
import { getStaffByHome } from '@/db/queries/staff';
import { getRotaEntriesForPeriod } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generatePayrollRows, convertToCsv } from '@/lib/csv';

const exportSchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  floorId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  // 1. Verify session exists → 401 if not
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Extract homeId and role
  const homeId = session.user.homeId;
  const role = session.user.role;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  // 4. Verify user role is in the allowed list → 403 if not (manager/admin only for payroll exports)
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

  // 3. Verify the requested floorId belongs to that homeId → 403 if not
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
    // Get live data
    const [staffList, entries, floors] = await Promise.all([
      getStaffByHome(homeId),
      getRotaEntriesForPeriod(homeId, startDate, endDate),
      db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId)),
    ]);

    // Filter staff and entries if targetFloorId is specified
    const filteredStaff = targetFloorId
      ? staffList.filter((s) => s.homeFloorId === targetFloorId)
      : staffList;

    const filteredEntries = targetFloorId
      ? entries.filter((e) => e.homeFloorId === targetFloorId)
      : entries;

    // Generate CSV
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

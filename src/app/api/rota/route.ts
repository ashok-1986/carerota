import { NextRequest, NextResponse } from 'next/server';
import { getStaffByHome } from '@/db/queries/staff';
import { getRotaEntriesForPeriod } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { isManager } from '@/lib/authz';

const querySchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  floorId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  // 1. Verify session exists
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Extract homeId and role from session user
  const homeId = session.user.homeId;
  const role = session.user.role;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  // 4. Verify user role is in the allowed list: home_manager, manager, admin
  if (!isManager(role)) {
    return new NextResponse('Forbidden: Invalid role permissions', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const floorId = searchParams.get('floorId') || undefined;

  const result = querySchema.safeParse({ start, end, floorId });
  if (!result.success) {
    return new NextResponse(result.error.message, { status: 400 });
  }

  const { start: startDate, end: endDate, floorId: targetFloorId } = result.data;

  // 3. Verify the requested floorId belongs to that homeId → 403 if not
  if (targetFloorId) {
    try {
      const [floor] = await db
        .select()
        .from(homeFloors)
        .where(and(eq(homeFloors.id, targetFloorId), eq(homeFloors.homeId, homeId)))
        .limit(1);
      if (!floor) {
        return new NextResponse('Forbidden: Floor does not belong to home', { status: 403 });
      }
    } catch (e) {
      console.error('Error verifying floor:', e);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  try {
    const [staffList, entries] = await Promise.all([
      getStaffByHome(homeId),
      getRotaEntriesForPeriod(homeId, startDate, endDate)
    ]);

    // Group staff into sections based on role and floor name
    type StaffMember = { id: string; name: string; contractedHours: number; role: string; employmentType: string; homeFloorId: string | null; payRateHourly: number };
    type SectionData = { title: string; staff: StaffMember[] };
    const sectionsMap = new Map<string, SectionData>();
    
    // Filter staff list if floorId is provided
    const filteredStaffList = targetFloorId 
      ? staffList.filter((s) => s.homeFloorId === targetFloorId)
      : staffList;

    filteredStaffList.forEach((staff) => {
      const sectionName = staff.role.includes('RN') || staff.role.includes('Nurse') ? 'RNs' : 
                          staff.role.includes('Carer') || staff.role.includes('HCA') ? 'Carers' : 
                          staff.role || 'Other';
      
      const groupKey = `${sectionName} - ${staff.floorName || 'General'}`;

      if (!sectionsMap.has(groupKey)) {
        sectionsMap.set(groupKey, {
          title: groupKey,
          staff: []
        });
      }

      const section = sectionsMap.get(groupKey);
      if (section) {
        section.staff.push({
          id: staff.id,
          name: staff.name,
          contractedHours: Number(staff.contractedHours) || 0,
          role: staff.role,
          employmentType: staff.employmentType,
          homeFloorId: staff.homeFloorId,
          payRateHourly: Number(staff.payRateHourly) || 0,
        });
      }
    });

    const sections = Array.from(sectionsMap.values());

    // Filter entries by targetFloorId if floorId is provided
    const filteredEntries = targetFloorId
      ? entries.filter((e) => e.homeFloorId === targetFloorId)
      : entries;

    return NextResponse.json({
      sections,
      entries: filteredEntries
    });
  } catch (error) {
    console.error('Error fetching rota:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

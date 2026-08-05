import { NextRequest, NextResponse } from 'next/server';
import { getStaffPatternsForHome, upsertStaffPatterns } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shiftCodes } from '@/db/schema';
import { z } from 'zod';
import { isManager, hasRole, PUBLISH_ROLES } from '@/lib/authz';

const upsertPatternSchema = z.object({
  patterns: z.array(z.object({
    staffId: z.string().uuid(),
    dayOfWeek: z.number().int().min(1).max(7),
    shiftCode: z.string().nullable(),
  }))
});

export async function GET() {
  // 1. Verify session exists
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

  // 3. Verify role
  if (!isManager(role)) {
    return new NextResponse('Forbidden: Invalid role permissions', { status: 403 });
  }

  try {
    const patterns = await getStaffPatternsForHome(homeId);
    return NextResponse.json({ success: true, patterns });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 1. Verify session exists
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

  // 3. Manager role only for updates
  if (!hasRole(role, PUBLISH_ROLES)) {
    return new NextResponse('Forbidden: Only managers can update patterns', { status: 403 });
  }

  try {
    const body = await req.json();
    const result = upsertPatternSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.message, { status: 400 });
    }

    const { patterns } = result.data;

    // Fetch all shift codes to build code -> UUID mapping
    const codes = await db
      .select({ id: shiftCodes.id, code: shiftCodes.code })
      .from(shiftCodes);
    
    const codeToIdMap = new Map<string, string>();
    codes.forEach(c => codeToIdMap.set(c.code, c.id));

    // Map code strings to DB UUIDs
    const dbPatterns = patterns.map(p => ({
      staffId: p.staffId,
      dayOfWeek: p.dayOfWeek,
      shiftCodeId: p.shiftCode ? (codeToIdMap.get(p.shiftCode) || null) : null,
    }));

    await upsertStaffPatterns(dbPatterns, homeId);

    return NextResponse.json({ success: true, count: patterns.length });
  } catch (error) {
    console.error('Error saving patterns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

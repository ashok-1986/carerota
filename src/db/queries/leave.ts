import { db } from '../../lib/db';
import { leaveRequests, staff, homes, homeFloors, rotaEntries, shiftCodes, auditLog } from '../schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { getPayPeriod } from '../../lib/utils';

export type LeaveRequestWithStaff = {
  id: string;
  homeId: string;
  staffId: string;
  staffName: string;
  role: string;
  floorName: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  requestedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  notes: string | null;
};

export type LeaveFilters = {
  status?: 'pending' | 'approved' | 'declined' | 'all';
  staffId?: string;
  startDate?: string;
  endDate?: string;
};

export async function getLeaveRequests(homeId: string, filters?: LeaveFilters) {
  const conditions: ReturnType<typeof eq>[] = [eq(leaveRequests.homeId, homeId)];

  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(leaveRequests.status, filters.status));
  }

  if (filters?.staffId) {
    conditions.push(eq(leaveRequests.staffId, filters.staffId));
  }

  if (filters?.startDate) {
    conditions.push(gte(leaveRequests.startDate, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(leaveRequests.endDate, filters.endDate));
  }

  const rows = await db
    .select({
      id: leaveRequests.id,
      homeId: leaveRequests.homeId,
      staffId: leaveRequests.staffId,
      staffName: staff.name,
      role: staff.role,
      floorName: homeFloors.name,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      status: leaveRequests.status,
      requestedAt: leaveRequests.requestedAt,
      reviewedBy: leaveRequests.reviewedBy,
      reviewedAt: leaveRequests.reviewedAt,
      notes: leaveRequests.notes,
    })
    .from(leaveRequests)
    .innerJoin(staff, eq(leaveRequests.staffId, staff.id))
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(and(...conditions))
    .orderBy(
      sql`CASE WHEN ${leaveRequests.status} = 'pending' THEN 0 ELSE 1 END`,
      desc(leaveRequests.requestedAt),
    );

  return rows;
}

export async function getLeaveRequestById(id: string, homeId: string) {
  const [row] = await db
    .select({
      id: leaveRequests.id,
      homeId: leaveRequests.homeId,
      staffId: leaveRequests.staffId,
      staffName: staff.name,
      role: staff.role,
      floorName: homeFloors.name,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      status: leaveRequests.status,
      requestedAt: leaveRequests.requestedAt,
      reviewedBy: leaveRequests.reviewedBy,
      reviewedAt: leaveRequests.reviewedAt,
      notes: leaveRequests.notes,
    })
    .from(leaveRequests)
    .innerJoin(staff, eq(leaveRequests.staffId, staff.id))
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.homeId, homeId)))
    .limit(1);

  return row || null;
}

export async function createLeaveRequest(data: typeof leaveRequests.$inferInsert) {
  const [newRequest] = await db.insert(leaveRequests).values(data).returning();
  return newRequest;
}

export async function updateLeaveStatus(
  requestId: string,
  homeId: string,
  status: 'approved' | 'declined',
  reviewedBy: string,
  notes?: string,
) {
  const [request] = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.id, requestId), eq(leaveRequests.homeId, homeId)))
    .limit(1);

  if (!request) {
    throw new Error('Leave request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Leave request is not in pending status');
  }

  const [updatedRequest] = await db
    .update(leaveRequests)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      notes: notes || null,
    })
    .where(eq(leaveRequests.id, requestId))
    .returning();

  await db.insert(auditLog).values({
    homeId: request.homeId,
    userId: reviewedBy,
    action: status === 'approved' ? 'approve_leave' : 'decline_leave',
    entityType: 'leave_request',
    entityId: requestId,
    beforeValue: request,
    afterValue: updatedRequest,
  });

  return { request: request, updatedRequest };
}

export async function getLeaveBalance(staffId: string, homeId: string, year?: number) {
  const [staffMember] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.homeId, homeId)))
    .limit(1);

  if (!staffMember) {
    return { contractedAnnualLeave: 0, approvedDays: 0, remainingDays: 0 };
  }

  let contractedAnnualLeave = 0;
  if (staffMember.employmentType === 'full_time') {
    contractedAnnualLeave = 28;
  } else if (staffMember.employmentType === 'part_time') {
    const hours = Number(staffMember.contractedHours) || 0;
    contractedAnnualLeave = Math.min(28, Math.max(0, Math.round((hours / 37.5) * 28 * 10) / 10));
  }

  const targetYear = year ?? new Date().getFullYear();

  const approvedRequests = await db
    .select()
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.staffId, staffId),
        eq(leaveRequests.homeId, homeId),
        eq(leaveRequests.status, 'approved'),
        eq(leaveRequests.leaveType, 'AL'),
        gte(leaveRequests.startDate, `${targetYear}-01-01`),
        lte(leaveRequests.startDate, `${targetYear}-12-31`),
      ),
    );

  let approvedDays = 0;
  for (const req of approvedRequests) {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    approvedDays += diffDays;
  }

  const remainingDays = Math.max(0, contractedAnnualLeave - approvedDays);

  return { contractedAnnualLeave, approvedDays, remainingDays };
}

export async function getLeaveByDateRange(homeId: string, startDate: string, endDate: string) {
  const rows = await db
    .select({
      id: leaveRequests.id,
      staffId: leaveRequests.staffId,
      staffName: staff.name,
      floorName: homeFloors.name,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .innerJoin(staff, eq(leaveRequests.staffId, staff.id))
    .leftJoin(homeFloors, eq(staff.homeFloorId, homeFloors.id))
    .where(
      and(
        eq(leaveRequests.homeId, homeId),
        eq(leaveRequests.status, 'approved'),
        lte(leaveRequests.startDate, endDate),
        gte(leaveRequests.endDate, startDate),
      ),
    )
    .orderBy(asc(leaveRequests.startDate));

  return rows;
}

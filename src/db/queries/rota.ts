import { db } from "@/lib/db";
import { rotaEntries, shiftCodes, staff, staffPatterns } from "@/db/schema";
import { eq, and, gte, lte, or, inArray } from "drizzle-orm";

export async function getRotaEntriesForPeriod(homeId: string, startDate: string, endDate: string) {
  return db
    .select({
      id: rotaEntries.id,
      staffId: rotaEntries.staffId,
      shiftDate: rotaEntries.shiftDate,
      shiftCodeId: rotaEntries.shiftCodeId,
      code: shiftCodes.code,
      category: shiftCodes.category,
      homeFloorId: rotaEntries.homeFloorId,
      actualFloorId: rotaEntries.actualFloorId,
      isPublished: rotaEntries.isPublished,
    })
    .from(rotaEntries)
    .leftJoin(shiftCodes, eq(rotaEntries.shiftCodeId, shiftCodes.id))
    .where(
      and(
        eq(rotaEntries.homeId, homeId),
        gte(rotaEntries.shiftDate, startDate),
        lte(rotaEntries.shiftDate, endDate)
      )
    );
}

export type BulkUpsertPayload = {
  homeId: string;
  staffId: string;
  homeFloorId: string;
  shiftDate: string;
  shiftCodeId: string | null;
  rotaMonth: string;
  createdBy: string;
};

export async function bulkUpsertEntries(entries: BulkUpsertPayload[]) {
  if (entries.length === 0) return;
  
  // Note: in Neon / PostgreSQL, ON CONFLICT requires a unique constraint.
  // We need a unique constraint on (staffId, shiftDate) in the DB schema for upsert, 
  // or we can delete and insert. For simplicity in this iteration, we'll delete the overlapping entries
  // and insert the new ones within a transaction.
  
  return db.transaction(async (tx) => {
    // 1. Fetch existing entries in bulk
    const existingRows = await tx.select()
      .from(rotaEntries)
      .where(
        or(
          ...entries.map(e => and(
            eq(rotaEntries.staffId, e.staffId),
            eq(rotaEntries.shiftDate, e.shiftDate)
          ))
        )
      );

    const existingMap = new Map();
    for (const row of existingRows) {
      existingMap.set(`${row.staffId}-${row.shiftDate}`, row);
    }

    const toInsert = [];
    const toUpdate = [];
    const toDeleteIds = [];

    for (const entry of entries) {
      const existing = existingMap.get(`${entry.staffId}-${entry.shiftDate}`);

      if (existing) {
        if (entry.shiftCodeId === null) {
          toDeleteIds.push(existing.id);
        } else {
          toUpdate.push({
            id: existing.id,
            shiftCodeId: entry.shiftCodeId,
            updatedAt: new Date(),
          });
        }
      } else if (entry.shiftCodeId !== null) {
        toInsert.push({
          homeId: entry.homeId,
          staffId: entry.staffId,
          homeFloorId: entry.homeFloorId,
          shiftDate: entry.shiftDate,
          shiftCodeId: entry.shiftCodeId,
          rotaMonth: entry.rotaMonth,
          createdBy: entry.createdBy,
        });
      }
    }

    if (toDeleteIds.length > 0) {
      await tx.delete(rotaEntries).where(inArray(rotaEntries.id, toDeleteIds));
    }

    if (toInsert.length > 0) {
      await tx.insert(rotaEntries).values(toInsert);
    }

    // Update needs individual statements unless using a more complex case query
    for (const update of toUpdate) {
       await tx.update(rotaEntries)
         .set({ shiftCodeId: update.shiftCodeId, updatedAt: update.updatedAt })
         .where(eq(rotaEntries.id, update.id));
    }
  });
}

export async function getStaffPatternsForHome(homeId: string) {
  return db
    .select({
      id: staffPatterns.id,
      staffId: staffPatterns.staffId,
      dayOfWeek: staffPatterns.dayOfWeek,
      shiftCodeId: staffPatterns.shiftCodeId,
      code: shiftCodes.code,
    })
    .from(staffPatterns)
    .innerJoin(staff, eq(staffPatterns.staffId, staff.id))
    .leftJoin(shiftCodes, eq(staffPatterns.shiftCodeId, shiftCodes.id))
    .where(eq(staff.homeId, homeId));
}

export async function upsertStaffPatterns(patterns: { staffId: string, dayOfWeek: number, shiftCodeId: string | null }[], homeId: string) {
  return db.transaction(async (tx) => {
    // Ensure every targeted staff member belongs to the caller's home so a
    // manager cannot assign patterns for staff outside their home.
    const staffIds = patterns.map((p) => p.staffId);
    if (staffIds.length) {
      const scoped = await tx
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.homeId, homeId), inArray(staff.id, staffIds)));
      if (scoped.length !== new Set(staffIds).size) {
        throw new Error('Forbidden: One or more staff members are not in your home');
      }
    }

    for (const pattern of patterns) {
      // Delete existing day pattern for staff
      await tx
        .delete(staffPatterns)
        .where(
          and(
            eq(staffPatterns.staffId, pattern.staffId),
            eq(staffPatterns.dayOfWeek, pattern.dayOfWeek)
          )
        );
      
      // Insert if shiftCodeId is provided
      if (pattern.shiftCodeId) {
        await tx.insert(staffPatterns).values({
          staffId: pattern.staffId,
          dayOfWeek: pattern.dayOfWeek,
          shiftCodeId: pattern.shiftCodeId,
        });
      }
    }
  });
}

export async function applyPatternsToPeriod(
  homeId: string,
  startDate: string,
  endDate: string,
  createdBy: string,
  targetFloorId?: string
) {
  return db.transaction(async (tx) => {
    // 1. Get staff
    const query = tx
      .select({
        id: staff.id,
        homeFloorId: staff.homeFloorId,
      })
      .from(staff)
      .where(
        and(
          eq(staff.homeId, homeId),
          eq(staff.isActive, true)
        )
      );
    
    const staffList = await query;
    const filteredStaff = targetFloorId 
      ? staffList.filter(s => s.homeFloorId === targetFloorId)
      : staffList;

    if (!filteredStaff.length) return;

    // 2. Fetch patterns for these staff members
    const staffIds = filteredStaff.map(s => s.id);
    const patterns = await tx
      .select({
        staffId: staffPatterns.staffId,
        dayOfWeek: staffPatterns.dayOfWeek,
        shiftCodeId: staffPatterns.shiftCodeId,
      })
      .from(staffPatterns)
      .where(inArray(staffPatterns.staffId, staffIds));

    // Map staffId -> dayOfWeek -> shiftCodeId
    const patternMap = new Map<string, Map<number, string>>();
    patterns.forEach(p => {
      if (!patternMap.has(p.staffId)) {
        patternMap.set(p.staffId, new Map());
      }
      if (p.shiftCodeId) {
        patternMap.get(p.staffId)!.set(p.dayOfWeek, p.shiftCodeId);
      }
    });

    // 3. Generate all dates in the period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // 4. Upsert rota entries
    const upserts = [];
    for (const member of filteredStaff) {
      const memberPatterns = patternMap.get(member.id);
      if (!memberPatterns) continue;

      for (const d of dates) {
        // Map Javascript Sunday=0..Saturday=6 to Monday=1..Sunday=7
        const jsDay = d.getDay();
        const dayOfWeek = jsDay === 0 ? 7 : jsDay;

        const shiftCodeId = memberPatterns.get(dayOfWeek);
        if (shiftCodeId) {
          const shiftDateStr = d.toISOString().split('T')[0];
          
          upserts.push({
            homeId,
            staffId: member.id,
            homeFloorId: member.homeFloorId!,
            shiftDate: shiftDateStr,
            shiftCodeId,
            actualFloorId: member.homeFloorId,
            rotaMonth: startDate, // Pay period start date
            isPublished: false,
            createdBy,
          });
        }
      }
    }

    // Perform bulk upsert/insert
    if (upserts.length > 0) {
      for (const item of upserts) {
        // Delete any existing entry for this staff + date to prevent duplicates
        await tx
          .delete(rotaEntries)
          .where(
            and(
              eq(rotaEntries.staffId, item.staffId),
              eq(rotaEntries.shiftDate, item.shiftDate)
            )
          );
        
        // Insert new entry
        await tx.insert(rotaEntries).values(item);
      }
    }
  });
}

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding database...");

  console.log("  truncating tables...");
  try { await sql`TRUNCATE TABLE "rota_entries" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "leave_requests" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "staff_patterns" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "staff" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "home_floors" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "shift_codes" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "account" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "session" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "verificationToken" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "user" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "homes" CASCADE`; } catch { /* ignore */ }
  try { await sql`TRUNCATE TABLE "audit_log" CASCADE`; } catch { /* ignore */ }

  const [home] = await db.insert(schema.homes).values({
    name: "Marlborough Court",
    payrollStartDay: 19,
    budgetCapMonthly: "33500.00"
  }).returning();

  const insertedFloors = await db.insert(schema.homeFloors).values([
    { homeId: home.id, name: "Kings", code: "Kg", floorType: "care_floor", sortOrder: 1 },
    { homeId: home.id, name: "Upton / Jenkins", code: "Uj", floorType: "care_floor", sortOrder: 2 },
    { homeId: home.id, name: "The Thames", code: "Th", floorType: "care_floor", sortOrder: 3 },
  ]).returning();

  const insertedShiftCodes = await db.insert(schema.shiftCodes).values([
    { code: "LD", label: "Long Day", hours: "11.5", category: "work", floors: ["care", "all"] },
    { code: "E", label: "Early", hours: "8", category: "work", floors: ["care", "all"] },
    { code: "L", label: "Late", hours: "8", category: "work", floors: ["care", "all"] },
    { code: "N", label: "Night", hours: "11.5", category: "work", floors: ["care", "all"] },
    { code: "RO", label: "Rest of Day", hours: "0", category: "work", floors: ["care", "all"] },
    { code: "AL", label: "Annual Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "ML", label: "Mat Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "SL", label: "Sick Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "PL", label: "Paternity Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "HO", label: "Home Office", hours: "8", category: "work", floors: ["ancillary", "all"] },
    { code: "TR", label: "Training", hours: "8", category: "work", floors: ["all"] },
    { code: "M", label: "Meeting", hours: "2", category: "work", floors: ["all"] },
    { code: "OOH", label: "Out of Hours", hours: "4", category: "work", floors: ["ancillary"] },
  ]).returning();

  const insertedStaff = await db.insert(schema.staff).values([
    { homeId: home.id, homeFloorId: insertedFloors[0].id, name: "Sarah Johnson", role: "home_manager", employmentType: "full_time", contractedHours: "36.00", payRateHourly: "18.00", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[0].id, name: "Emily Davis", role: "caregiver", employmentType: "full_time", contractedHours: "36.00", payRateHourly: "14.50", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[0].id, name: "Michael Brown", role: "caregiver", employmentType: "full_time", contractedHours: "36.00", payRateHourly: "14.50", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[1].id, name: "Jessica Wilson", role: "caregiver", employmentType: "part_time", contractedHours: "24.00", payRateHourly: "14.50", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[1].id, name: "David Taylor", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "15.00", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[1].id, name: "Rachel Martinez", role: "senior_caregiver", employmentType: "full_time", contractedHours: "36.00", payRateHourly: "16.00", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[2].id, name: "James Anderson", role: "caregiver", employmentType: "full_time", contractedHours: "36.00", payRateHourly: "14.50", isActive: true },
    { homeId: home.id, homeFloorId: insertedFloors[2].id, name: "Emma Thompson", role: "caregiver", employmentType: "part_time", contractedHours: "24.00", payRateHourly: "14.50", isActive: true },
  ]).returning();

  const today = new Date();
  const entriesToInsert = [];
  for (const member of insertedStaff) {
    for (let i = 1; i <= 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isBank = member.employmentType === "bank";

      if (isWeekend || isBank) continue;

      const patternDay = dow === 0 ? 7 : dow;
      let codeIndex = (patternDay + insertedStaff.indexOf(member)) % 3;
      if (codeIndex === 0) codeIndex = 2;

      entriesToInsert.push({
        homeId: home.id,
        staffId: member.id,
        homeFloorId: member.homeFloorId!,
        shiftDate: d.toISOString().split("T")[0],
        shiftCodeId: insertedShiftCodes[codeIndex].id,
        rotaMonth: new Date(today.getFullYear(), today.getMonth(), 19).toISOString().split("T")[0],
        isPublished: true,
        createdBy: insertedStaff[0].id,
      });
    }
  }

  if (entriesToInsert.length > 0) {
    for (const e of entriesToInsert) {
      await db.insert(schema.rotaEntries).values(e);
    }
  }

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error seeding database:", e.message);
  process.exit(1);
});
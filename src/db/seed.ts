import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle" });

import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

function hashToUUID(hash: string): string {
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

function deterministicUUID(seed: string): string {
  const md5 = createHash("md5").update(seed).digest("hex");
  return hashToUUID(md5);
}

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

  const homeId = deterministicUUID("home-marlborough-court");
  await db.insert(schema.homes).values({
    id: homeId,
    name: "Marlborough Court Care Home",
    payrollStartDay: 19,
    budgetCapMonthly: "33500.00"
  }).onConflictDoNothing().execute();

  const floorDefs = [
    { seed: "floor-king-george", name: "King George", code: "Kg", floorType: "care_floor", sortOrder: 1 },
    { seed: "floor-union-jack", name: "Union Jack", code: "Uj", floorType: "care_floor", sortOrder: 2 },
    { seed: "floor-thames", name: "The Thames", code: "Th", floorType: "care_floor", sortOrder: 3 },
    { seed: "floor-office", name: "Office", code: "Of", floorType: "office", sortOrder: 4 },
    { seed: "floor-ancillary", name: "Ancillary", code: "An", floorType: "ancillary", sortOrder: 5 },
  ];
  const floorIds: Record<string, string> = {};
  for (const f of floorDefs) {
    const id = deterministicUUID(f.seed);
    floorIds[f.code] = id;
    await db.insert(schema.homeFloors).values({
      id,
      homeId,
      name: f.name,
      code: f.code,
      floorType: f.floorType,
      sortOrder: f.sortOrder,
    }).onConflictDoNothing().execute();
  }

  const shiftCodeDefs = [
    { code: "LD", label: "Long Day", hours: "11.5", category: "work", floors: ["care", "all"] },
    { code: "E", label: "Early", hours: "8", category: "work", floors: ["care", "all"] },
    { code: "L", label: "Late", hours: "8", category: "work", floors: ["care", "all"] },
    { code: "N", label: "Night", hours: "11.5", category: "work", floors: ["care", "all"] },
    { code: "Su", label: "Supernumerary", hours: "12", category: "work", floors: ["care", "all"] },
    { code: "RO", label: "Rest Off", hours: "0", category: "absence", floors: ["care", "all"] },
    { code: "AL", label: "Annual Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "ML", label: "Maternity Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "SL", label: "Sick Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "PL", label: "Paternity Leave", hours: "0", category: "absence", floors: ["all"] },
    { code: "HO", label: "Home Office", hours: "8", category: "work", floors: ["ancillary", "all"] },
    { code: "TR", label: "Training", hours: "8", category: "work", floors: ["all"] },
    { code: "M", label: "Meeting", hours: "2", category: "work", floors: ["all"] },
    { code: "OOH", label: "Out of Hours", hours: "4", category: "work", floors: ["ancillary"] },
  ];
  const shiftCodeIds: Record<string, string> = {};
  for (const s of shiftCodeDefs) {
    const id = deterministicUUID(`shift-${s.code}`);
    shiftCodeIds[s.code] = id;
    await db.insert(schema.shiftCodes).values({
      id,
      code: s.code,
      label: s.label,
      hours: s.hours,
      category: s.category,
      floors: s.floors,
    }).onConflictDoNothing().execute();
  }

  interface StaffDef {
    name: string;
    role: string;
    employmentType: string;
    contractedHours: string;
    payRateHourly: string;
    floorCode: string;
  }

  const staffDefs: StaffDef[] = [
    // King George — Senior Carers (4)
    { name: "Abena Owusu", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Akosua Mensah", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Elizabeth Enchill", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Rachel Martinez", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },

    // King George — Caregivers (16)
    { name: "Dorcas Asante", role: "registered_nurse", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "18.50", floorCode: "Kg" },
    { name: "Rosemund Owoahene", role: "registered_nurse", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "18.50", floorCode: "Kg" },
    { name: "Priya Sharma", role: "registered_nurse", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "18.50", floorCode: "Kg" },
    { name: "Michael Nkrumah", role: "registered_nurse", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "18.50", floorCode: "Kg" },

    { name: "Joyce Mensah", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Mavis Darko", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Comfort Boateng", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Grace Amponsah", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Blessing Adjei", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Emily Davis", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Yaa Asante", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Kg" },
    { name: "James Okafor", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Kg" },
    { name: "Samuel Boateng", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Emmanuel Asare", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Kg" },
    { name: "Sarah Johnson", role: "home_manager", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "18.00", floorCode: "Kg" },
    { name: "Kofi Mensah", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Kg" },

    // Union Jack (5)
    { name: "Nisha Patel", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Uj" },
    { name: "Amara Diallo", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "Fatima Sesay", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "Jessica Wilson", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "David Taylor", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Uj" },

    // Thames (5)
    { name: "Emma Thompson", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Th" },
    { name: "Priya Nair", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Th" },
    { name: "Michael Brown", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Th" },
    { name: "Kofi Mensah", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Th" },
    { name: "James Anderson", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Th" },
  ];

  const staffIds: string[] = [];
  for (const s of staffDefs) {
    const id = deterministicUUID(`staff-${s.name}-${s.floorCode}`);
    staffIds.push(id);
    await db.insert(schema.staff).values({
      id,
      homeId,
      homeFloorId: floorIds[s.floorCode],
      name: s.name,
      role: s.role,
      employmentType: s.employmentType,
      contractedHours: s.contractedHours,
      payRateHourly: s.payRateHourly,
      isActive: true,
    }).onConflictDoNothing().execute();
  }

  console.log(`  inserted ${staffDefs.length} staff`);

  const periodStart = new Date("2026-05-19");
  const periodEnd = new Date("2026-06-18");
  const rotaMonth = "2026-05-19";

  const N  = shiftCodeIds["N"];
  const LD = shiftCodeIds["LD"];
  const E  = shiftCodeIds["E"];
  const L  = shiftCodeIds["L"];

  let count = 0;
  for (let idx = 0; idx < staffDefs.length; idx++) {
    const s = staffDefs[idx];
    const staffId = staffIds[idx];
    const floorId = floorIds[s.floorCode];

    for (const date of getDateRange(periodStart, periodEnd)) {
      const dow = date.getDay();
      const dateStr = date.toISOString().split("T")[0];
      let shiftCodeId: string | null = null;

      if (s.role === "registered_nurse") {
        if (dow === 1 || dow === 2 || dow === 3 || dow === 6 || dow === 0) {
          shiftCodeId = N;
        }
      } else if (s.role === "senior_caregiver") {
        if (dow === 1 || dow === 2 || dow === 4 || dow === 5) {
          shiftCodeId = LD;
        }
      } else if (s.employmentType === "bank") {
        if (dow === 3 || dow === 6) {
          shiftCodeId = LD;
        }
      } else if (s.employmentType === "part_time") {
        if (dow === 1) shiftCodeId = E;
        else if (dow === 3) shiftCodeId = L;
        else if (dow === 5) shiftCodeId = E;
      } else {
        const isEven = idx % 2 === 0;
        if (dow === 1) shiftCodeId = isEven ? E : L;
        else if (dow === 2) shiftCodeId = isEven ? L : E;
        else if (dow === 4) shiftCodeId = isEven ? E : L;
        else if (dow === 5) shiftCodeId = isEven ? L : E;
      }

      if (shiftCodeId) {
        await db.insert(schema.rotaEntries).values({
          homeId,
          staffId,
          homeFloorId: floorId,
          shiftDate: dateStr,
          shiftCodeId,
          rotaMonth,
          isPublished: true,
          createdBy: staffIds[0],
        }).onConflictDoNothing().execute();
        count++;
      }
    }
  }

  console.log(`  inserted ${count} rota entries`);
  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error seeding database:", e.message);
  process.exit(1);
});

function* getDateRange(start: Date, end: Date) {
  const cur = new Date(start);
  while (cur <= end) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}
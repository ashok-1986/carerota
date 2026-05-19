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

  console.log("  ensuring unique constraint on rota_entries...");
  try {
    await sql`
      ALTER TABLE rota_entries
      ADD CONSTRAINT rota_entries_staff_day_floor_unique
      UNIQUE (staff_id, shift_date, home_floor_id)
    `;
    console.log("  unique constraint created");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) {
      console.log("  unique constraint already exists");
    } else {
      console.log("  constraint note:", msg.slice(0, 100));
    }
  }

  console.log("  inserting home...");
  const homeId = deterministicUUID("home-marlborough-court");
  await db.insert(schema.homes).values({
    id: homeId,
    name: "Marlborough Court Care Home",
    payrollStartDay: 19,
    budgetCapMonthly: "33500.00"
  }).onConflictDoNothing().execute();

  console.log("  inserting floors...");
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
      id, homeId, name: f.name, code: f.code,
      floorType: f.floorType, sortOrder: f.sortOrder,
    }).onConflictDoNothing().execute();
  }

  console.log("  inserting shift codes...");
  const shiftCodeDefs = [
    { code: "LD", label: "Long Day", hours: "11.5", category: "work" },
    { code: "E", label: "Early", hours: "8", category: "work" },
    { code: "L", label: "Late", hours: "8", category: "work" },
    { code: "N", label: "Night", hours: "11.5", category: "work" },
    { code: "Su", label: "Supernumerary", hours: "12", category: "work" },
    { code: "RO", label: "Rest Off", hours: "0", category: "absence" },
    { code: "AL", label: "Annual Leave", hours: "0", category: "absence" },
    { code: "ML", label: "Maternity Leave", hours: "0", category: "absence" },
    { code: "SL", label: "Sick Leave", hours: "0", category: "absence" },
    { code: "PL", label: "Paternity Leave", hours: "0", category: "absence" },
    { code: "HO", label: "Home Office", hours: "8", category: "work" },
    { code: "TR", label: "Training", hours: "8", category: "work" },
    { code: "M", label: "Meeting", hours: "2", category: "work" },
    { code: "OOH", label: "Out of Hours", hours: "4", category: "work" },
  ];
  const shiftCodeIds: Record<string, string> = {};
  for (const s of shiftCodeDefs) {
    const id = deterministicUUID(`shift-${s.code}`);
    shiftCodeIds[s.code] = id;
    await db.insert(schema.shiftCodes).values({
      id, code: s.code, label: s.label, hours: s.hours,
      category: s.category, floors: ["all"],
    }).onConflictDoNothing().execute();
  }

  interface StaffDef {
    name: string; role: string; employmentType: string;
    contractedHours: string; payRateHourly: string; floorCode: string;
  }

  const staffDefs: StaffDef[] = [
    { name: "Abena Owusu", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Akosua Mensah", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Elizabeth Enchill", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
    { name: "Rachel Martinez", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Kg" },
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
    { name: "Nisha Patel", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Uj" },
    { name: "Amara Diallo", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "Fatima Sesay", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "Jessica Wilson", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Uj" },
    { name: "David Taylor", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Uj" },
    { name: "Emma Thompson", role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "12.50", floorCode: "Th" },
    { name: "Priya Nair", role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "14.50", floorCode: "Th" },
    { name: "Michael Brown", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Th" },
    { name: "Kofi Mensah", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "13.00", floorCode: "Th" },
    { name: "James Anderson", role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "12.50", floorCode: "Th" },
  ];

  console.log("  inserting staff...");
  const staffIds: string[] = [];
  for (const s of staffDefs) {
    const id = deterministicUUID(`staff-${s.name}-${s.floorCode}`);
    staffIds.push(id);
    await db.insert(schema.staff).values({
      id, homeId, homeFloorId: floorIds[s.floorCode],
      name: s.name, role: s.role, employmentType: s.employmentType,
      contractedHours: s.contractedHours, payRateHourly: s.payRateHourly, isActive: true,
    }).onConflictDoNothing().execute();
  }
  console.log(`  inserted ${staffDefs.length} staff`);

  const N  = shiftCodeIds["N"];
  const LD = shiftCodeIds["LD"];
  const E  = shiftCodeIds["E"];
  const L  = shiftCodeIds["L"];
  const RO = shiftCodeIds["RO"];

  console.log("  building rota entry batches...");
  const periodStart = new Date("2026-05-19");
  const periodEnd = new Date("2026-06-18");
  const rotaMonth = "2026-05-19";

  const allDays = getDays(periodStart, periodEnd);
  const BATCH = 50;

  let totalCount = 0;
  let batch: string[] = [];

  for (let idx = 0; idx < staffDefs.length; idx++) {
    const s = staffDefs[idx];
    const staffId = staffIds[idx];
    const floorId = floorIds[s.floorCode];

    for (const date of allDays) {
      const dow = date.getDay();
      const dateStr = date.toISOString().split("T")[0];
      let shiftCodeId: string = RO;

      if (s.role === "registered_nurse") {
        if (dow === 1 || dow === 2 || dow === 3 || dow === 6 || dow === 0) shiftCodeId = N;
        else shiftCodeId = RO;
      } else if (s.role === "senior_caregiver") {
        if (dow === 1 || dow === 2 || dow === 4 || dow === 5) shiftCodeId = LD;
        else shiftCodeId = RO;
      } else if (s.employmentType === "bank") {
        if (dow === 3 || dow === 6) shiftCodeId = LD;
        else shiftCodeId = RO;
      } else if (s.employmentType === "part_time") {
        if (dow === 1) shiftCodeId = E;
        else if (dow === 3) shiftCodeId = L;
        else if (dow === 5) shiftCodeId = E;
        else shiftCodeId = RO;
      } else {
        const isEven = idx % 2 === 0;
        if (dow === 1) shiftCodeId = isEven ? E : L;
        else if (dow === 2) shiftCodeId = isEven ? L : E;
        else if (dow === 4) shiftCodeId = isEven ? E : L;
        else if (dow === 5) shiftCodeId = isEven ? L : E;
        else shiftCodeId = RO;
      }

      batch.push(
        `('${crypto.randomUUID()}','${homeId}','${staffId}','${floorId}','${dateStr}','${shiftCodeId}','${rotaMonth}',true,'${staffIds[0]}')`
      );

      if (batch.length >= BATCH) {
        const rows = batch.join(",\n");
        await sql.unsafe(
          `INSERT INTO rota_entries (id, home_id, staff_id, home_floor_id, shift_date, shift_code_id, rota_month, is_published, created_by) VALUES ${rows} ON CONFLICT (staff_id, shift_date, home_floor_id) DO UPDATE SET shift_code_id = EXCLUDED.shift_code_id, updated_at = NOW()`
        );
        totalCount += batch.length;
        console.log(`    ${totalCount} / 930 entries written...`);
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    const rows = batch.join(",\n");
    await sql.unsafe(
      `INSERT INTO rota_entries (id, home_id, staff_id, home_floor_id, shift_date, shift_code_id, rota_month, is_published, created_by) VALUES ${rows} ON CONFLICT (staff_id, shift_date, home_floor_id) DO UPDATE SET shift_code_id = EXCLUDED.shift_code_id, updated_at = NOW()`
    );
    totalCount += batch.length;
  }

  console.log(`  upserted ${totalCount} rota entries`);
  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error("Error seeding database:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});

function getDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}
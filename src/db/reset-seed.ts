import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle" });

import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";
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

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  // ──────────────────────────────────────────────
  // STEP 0: Get home and floor IDs
  // ──────────────────────────────────────────────
  console.log("=== STEP 0: Fetching home and floor IDs ===");
  const homes = await db.select().from(schema.homes).limit(1).execute();
  if (homes.length === 0) {
    console.error("No home found. Run db:seed first to create a home.");
    process.exit(1);
  }
  const homeId = homes[0].id;
  console.log(`  homeId = ${homeId}`);

  const floorRows = await db.select().from(schema.homeFloors).execute();
  const floorIds: Record<string, string> = {};
  for (const f of floorRows) {
    floorIds[f.code] = f.id;
  }
  console.log(`  floorIds: Kg=${floorIds["Kg"]}, Uj=${floorIds["Uj"]}, Th=${floorIds["Th"]}`);

  // ──────────────────────────────────────────────
  // STEP 1: Wipe all dependent data
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 1: Wiping existing data ===");
  await sql`DELETE FROM staff_patterns`;
  console.log("  staff_patterns deleted");
  await sql`DELETE FROM leave_requests`;
  console.log("  leave_requests deleted");
  await sql`DELETE FROM additional_costs`;
  console.log("  additional_costs deleted");
  await sql`DELETE FROM rota_entries`;
  console.log("  rota_entries deleted");
  await sql`DELETE FROM staff`;
  console.log("  staff deleted");
  await sql`DELETE FROM shift_codes`;
  console.log("  shift_codes deleted");
  console.log("  All data wiped.");

  // ──────────────────────────────────────────────
  // STEP 2: Insert 13 corrected shift codes
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 2: Inserting 13 shift codes ===");
  const shiftCodeDefs = [
    { code: "LD", label: "Long Day",        hours: "12.00", category: "work",    floors: ["care", "all"] },
    { code: "N",  label: "Night",           hours: "10.00", category: "work",    floors: ["care", "all"] },
    { code: "E",  label: "Early",           hours: "7.50",  category: "work",    floors: ["care", "ancillary", "office", "all"] },
    { code: "L",  label: "Late",            hours: "8.00",  category: "work",    floors: ["care", "ancillary", "all"] },
    { code: "Su", label: "Supernumerary",   hours: "12.00", category: "work",    floors: ["care"] },
    { code: "1-1",label: "One-to-One",      hours: "12.00", category: "work",    floors: ["care"] },
    { code: "9-5",label: "Office Hours",    hours: "7.50",  category: "work",    floors: ["office", "all"] },
    { code: "RO", label: "Rest Off",        hours: "0.00",  category: "absence", floors: ["all"] },
    { code: "AL", label: "Annual Leave",    hours: "0.00",  category: "absence", floors: ["all"] },
    { code: "ML", label: "Maternity Leave", hours: "0.00",  category: "absence", floors: ["all"] },
    { code: "Kg", label: "Float King George",hours: "0.00",  category: "float",  floors: ["care"] },
    { code: "Uj", label: "Float Union Jack", hours: "0.00",  category: "float",  floors: ["care"] },
    { code: "Th", label: "Float Thames",    hours: "0.00",  category: "float",  floors: ["care"] },
  ];
  const shiftCodeIds: Record<string, string> = {};
  for (const sc of shiftCodeDefs) {
    const id = deterministicUUID(`shift-${sc.code}`);
    shiftCodeIds[sc.code] = id;
    await db.insert(schema.shiftCodes).values({
      id, code: sc.code, label: sc.label, hours: sc.hours,
      category: sc.category, floors: sc.floors,
    }).execute();
  }
  console.log("  13 shift codes inserted.");

  console.log("\n  === Shift Code Verification ===");
  const insertedShifts = await db.select({
    code: schema.shiftCodes.code,
    category: schema.shiftCodes.category,
    hours: schema.shiftCodes.hours,
  }).from(schema.shiftCodes).orderBy(schema.shiftCodes.code).execute();
  for (const s of insertedShifts) {
    console.log(`    ${s.code.padEnd(4)} | category=${s.category?.toString().padEnd(7)} | hours=${s.hours}`);
  }

  const roSc = insertedShifts.find(s => s.code === "RO")!;
  const nSc  = insertedShifts.find(s => s.code === "N")!;
  const ldSc = insertedShifts.find(s => s.code === "LD")!;
  console.log(`\n  CRITICAL:`);
  console.log(`    RO: category=${roSc.category} (expect: absence), hours=${roSc.hours} (expect: 0.00)`);
  console.log(`    N:  category=${nSc.category}  (expect: work),    hours=${nSc.hours}  (expect: 10.00)`);
  console.log(`    LD: category=${ldSc.category} (expect: work),    hours=${ldSc.hours} (expect: 12.00)`);
  if (roSc.category === "absence" && nSc.category === "work" && ldSc.category === "work") {
    console.log("  ✓ All critical shift codes correct");
  } else {
    console.error("  ✗ CRITICAL FAILURE in shift codes — aborting");
    process.exit(1);
  }

  // ──────────────────────────────────────────────
  // STEP 3: Fix floor names
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 3: Updating floor names ===");
  await sql`UPDATE home_floors SET name = 'Union Jack' WHERE code = 'Uj'`;
  await sql`UPDATE home_floors SET name = 'King George' WHERE code = 'Kg'`;
  await sql`UPDATE home_floors SET name = 'Thames' WHERE code = 'Th'`;
  const updatedFloors = await db.select({
    name: schema.homeFloors.name,
    code: schema.homeFloors.code,
    sortOrder: schema.homeFloors.sortOrder,
  }).from(schema.homeFloors).orderBy(schema.homeFloors.sortOrder).execute();
  for (const f of updatedFloors) {
    console.log(`  ${f.name.padEnd(16)} | ${f.code}`);
  }

  // ──────────────────────────────────────────────
  // STEP 4: Insert 30 staff
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 4: Inserting 30 staff ===");

  interface StaffDef {
    name: string; role: string; employmentType: string;
    contractedHours: string; payRateHourly: string; floorCode: string;
  }

  const staffDefs: StaffDef[] = [
    // payRateHourly is stored in PENCE (e.g. "1850" = £18.50) to match the
    // canonical unit used by the UI, CSV export and cost calculations.
    // ── KING GEORGE FLOOR — 20 staff ──
    { name: "Dorcas Asante",     role: "registered_nurse",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1850", floorCode: "Kg" },
    { name: "Rosemund Owoahene", role: "registered_nurse",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1850", floorCode: "Kg" },
    { name: "Priya Sharma",      role: "registered_nurse",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1850", floorCode: "Kg" },
    { name: "Michael Nkrumah",   role: "registered_nurse",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1850", floorCode: "Kg" },
    { name: "Abena Owusu",       role: "senior_caregiver",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Kg" },
    { name: "Akosua Mensah",     role: "senior_caregiver",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Kg" },
    { name: "Elizabeth Enchill", role: "senior_caregiver",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Kg" },
    { name: "Rachel Martinez",   role: "senior_caregiver",  employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Kg" },
    { name: "Comfort Boateng",   role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Emily Davis",       role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Emmanuel Asare",    role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Grace Amponsah",    role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "James Okafor",      role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Joyce Mensah",      role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Mavis Darko",       role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Blessing Adjei",    role: "caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Nisha Patel",       role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Yaa Asante",        role: "caregiver", employmentType: "part_time", contractedHours: "22", payRateHourly: "1250", floorCode: "Kg" },
    { name: "Samuel Boateng",    role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "1300", floorCode: "Kg" },
    { name: "Daniel Acheampong", role: "caregiver", employmentType: "bank", contractedHours: "0", payRateHourly: "1300", floorCode: "Kg" },
    // ── UNION JACK FLOOR — 5 staff ──
    { name: "Amara Diallo",      role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Uj" },
    { name: "Fatima Sesay",      role: "caregiver",       employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Uj" },
    { name: "Patrick Mensah",    role: "caregiver",       employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Uj" },
    { name: "Linda Asante",      role: "caregiver",       employmentType: "part_time", contractedHours: "22",   payRateHourly: "1250", floorCode: "Uj" },
    { name: "David Osei",        role: "caregiver",       employmentType: "bank",       contractedHours: "0",    payRateHourly: "1300", floorCode: "Uj" },
    // ── THAMES FLOOR — 5 staff ──
    { name: "Sarah Acheampong",  role: "senior_caregiver", employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1450", floorCode: "Th" },
    { name: "John Boateng",      role: "caregiver",        employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Th" },
    { name: "Mary Adjei",        role: "caregiver",        employmentType: "full_time", contractedHours: "37.5", payRateHourly: "1250", floorCode: "Th" },
    { name: "Robert Mensah",     role: "caregiver",        employmentType: "part_time", contractedHours: "22",   payRateHourly: "1250", floorCode: "Th" },
    { name: "Catherine Owusu",   role: "caregiver",        employmentType: "bank",      contractedHours: "0",    payRateHourly: "1300", floorCode: "Th" },
  ];

  const staffIds: string[] = [];
  for (let idx = 0; idx < staffDefs.length; idx++) {
    const s = staffDefs[idx];
    const id = deterministicUUID(`staff-${s.name}-${s.floorCode}`);
    staffIds.push(id);
    await db.insert(schema.staff).values({
      id, homeId, homeFloorId: floorIds[s.floorCode],
      name: s.name, role: s.role, employmentType: s.employmentType,
      contractedHours: s.contractedHours, payRateHourly: s.payRateHourly, isActive: true,
    }).execute();
  }
  console.log(`  ${staffDefs.length} staff inserted.`);

  // ──────────────────────────────────────────────
  // STEP 5: Generate rota entries (current + next pay period)
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 5: Generating rota entries ===");

  const N   = shiftCodeIds["N"];
  const LD  = shiftCodeIds["LD"];
  const E   = shiftCodeIds["E"];
  const L   = shiftCodeIds["L"];
  const RO  = shiftCodeIds["RO"];

  const PAY_PERIOD_START_DAY = 19;
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), PAY_PERIOD_START_DAY);
  const periodStart =
    today.getTime() < currentMonthStart.getTime()
      ? new Date(today.getFullYear(), today.getMonth() - 1, PAY_PERIOD_START_DAY)
      : currentMonthStart;
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 2, PAY_PERIOD_START_DAY - 1);
  const rotaMonth = toDateStr(periodStart);

  function getDays(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return days;
  }

  const allDays = getDays(periodStart, periodEnd);
  console.log(`  Period: ${toDateStr(periodStart)} to ${toDateStr(periodEnd)} (${allDays.length} days, current + next pay period)`);

  const BATCH = 25;
  let totalCount = 0;
  let batch: (typeof schema.rotaEntries.$inferInsert)[] = [];

  const conflictTarget: [typeof schema.rotaEntries.staffId, typeof schema.rotaEntries.shiftDate, typeof schema.rotaEntries.homeFloorId] = [
    schema.rotaEntries.staffId,
    schema.rotaEntries.shiftDate,
    schema.rotaEntries.homeFloorId,
  ];

  for (let idx = 0; idx < staffDefs.length; idx++) {
    const s = staffDefs[idx];
    const staffId = staffIds[idx];
    const floorId = floorIds[s.floorCode];

    for (const date of allDays) {
      const dow = date.getDay();
      const dateStr = toDateStr(date);
      let shiftCodeId: string;

      if (s.role === "registered_nurse") {
        shiftCodeId = (dow === 1 || dow === 2 || dow === 3 || dow === 6 || dow === 0) ? N : RO;
      } else if (s.role === "senior_caregiver") {
        shiftCodeId = (dow === 1 || dow === 2 || dow === 4 || dow === 5) ? LD : RO;
      } else if (s.employmentType === "bank") {
        shiftCodeId = (dow === 3 || dow === 6) ? LD : RO;
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

      batch.push({
        id: randomUUID(),
        homeId,
        staffId,
        homeFloorId: floorId,
        shiftDate: dateStr,
        shiftCodeId,
        rotaMonth,
        isPublished: true,
        createdBy: staffIds[0],
      });

      if (batch.length >= BATCH) {
        await db.insert(schema.rotaEntries).values(batch).onConflictDoUpdate({
          target: conflictTarget,
          set: { shiftCodeId: drizzleSql`EXCLUDED.shift_code_id`, updatedAt: drizzleSql`NOW()` },
        }).execute();
        totalCount += batch.length;
        console.log(`    ${totalCount} / ~1860 entries written...`);
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    await db.insert(schema.rotaEntries).values(batch).onConflictDoUpdate({
      target: conflictTarget,
      set: { shiftCodeId: drizzleSql`EXCLUDED.shift_code_id`, updatedAt: drizzleSql`NOW()` },
    }).execute();
    totalCount += batch.length;
  }

  console.log(`  ${totalCount} rota entries upserted.`);

  // ──────────────────────────────────────────────
  // STEP 5.5: Seed sample leave requests
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 5.5: Seeding sample leave requests ===");

  function addDays(d: Date, days: number): string {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return toDateStr(next);
  }

  const leaveSeeds = [
    { staffIdx: 8,  leaveType: "AL",   startOffset: 5,  endOffset: 11, status: "pending",  notes: "Family holiday" },
    { staffIdx: 20, leaveType: "AL",   startOffset: 14, endOffset: 18, status: "pending",  notes: "Annual leave booked" },
    { staffIdx: 22, leaveType: "sick", startOffset: 3,  endOffset: 4,  status: "approved", notes: "Medical appointment" },
    { staffIdx: 23, leaveType: "AL",   startOffset: 20, endOffset: 24, status: "approved", notes: "Pre-approved leave" },
  ];
  for (const l of leaveSeeds) {
    await db.insert(schema.leaveRequests).values({
      id: deterministicUUID(`leave-${l.staffIdx}-${l.leaveType}-${l.startOffset}`),
      homeId,
      staffId: staffIds[l.staffIdx],
      leaveType: l.leaveType,
      startDate: addDays(periodStart, l.startOffset),
      endDate: addDays(periodStart, l.endOffset),
      status: l.status,
      requestedAt: new Date(),
      ...(l.status === "approved" ? { reviewedBy: staffIds[0], reviewedAt: new Date() } : {}),
      notes: l.notes,
    }).execute();
  }
  console.log(`  ${leaveSeeds.length} leave requests seeded (${leaveSeeds.filter(l => l.status === 'pending').length} pending).`);

  // ──────────────────────────────────────────────
  // STEP 5.6: Seed sample additional costs
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 5.6: Seeding sample additional costs ===");

  const costSeeds = [
    { category: "agency",      description: "Agency nurse cover - night shift", amount: "480.00" },
    { category: "inventory",   description: "Care supplies restock",            amount: "152.50" },
    { category: "maintenance", description: "Lift service call-out",            amount: "210.00" },
    { category: "training",    description: "Manual handling refresher",        amount: "85.00" },
  ];
  for (const c of costSeeds) {
    await db.insert(schema.additionalCosts).values({
      id: deterministicUUID(`cost-${c.category}-${rotaMonth}`),
      homeId,
      rotaMonth,
      category: c.category,
      description: c.description,
      amount: c.amount,
      addedBy: staffIds[0],
    }).execute();
  }
  console.log(`  ${costSeeds.length} additional costs seeded for ${rotaMonth}.`);

  // ──────────────────────────────────────────────
  // STEP 6: Verification queries
  // ──────────────────────────────────────────────
  console.log("\n=== STEP 6: Verification ===");

  const staffResult = await sql`SELECT COUNT(*)::int as count FROM staff`;
  console.log(`\n  SELECT COUNT(*) FROM staff;`);
  console.log(`  Result: ${staffResult[0].count} (expected: 30)`);

  const rotaResult = await sql`SELECT COUNT(*)::int as count FROM rota_entries`;
  console.log(`\n  SELECT COUNT(*) FROM rota_entries;`);
  console.log(`  Result: ${rotaResult[0].count} (expected: ~1860)`);

  console.log(`\n  Shift code distribution:`);
  const shiftDist = await sql`
    SELECT sc.code, sc.category, COUNT(*)::int as count
    FROM rota_entries re
    JOIN shift_codes sc ON re.shift_code_id = sc.id
    GROUP BY sc.code, sc.category
    ORDER BY count DESC
  `;
  console.log(`  ${"code".padEnd(6)} | ${"category".padEnd(10)} | count`);
  console.log(`  ${"-".repeat(6)} | ${"-".repeat(10)} | ${"-".repeat(5)}`);
  for (const row of shiftDist) {
    console.log(`  ${(row.code as string).padEnd(6)} | ${(row.category as string).padEnd(10)} | ${row.count}`);
  }

  console.log(`\n  Projected cost (work shifts only):`);
  const costResult = await sql`
    SELECT SUM(sc.hours * st.pay_rate_hourly) as raw_total
    FROM rota_entries re
    JOIN staff st ON re.staff_id = st.id
    JOIN shift_codes sc ON re.shift_code_id = sc.id
    WHERE sc.category = 'work'
  `;
  const rawTotal = costResult[0]?.raw_total;
  console.log(`  SUM(hours * pay_rate) WHERE category='work': ${rawTotal}`);
  if (rawTotal && Number(rawTotal) > 100000) {
    console.log(`  (stored in pence? £${(Number(rawTotal) / 100).toFixed(2)})`);
  } else {
    console.log(`  (£${Number(rawTotal).toFixed(2)})`);
  }

  const workShifts = await sql`
    SELECT COUNT(*)::int as count FROM rota_entries re
    JOIN shift_codes sc ON re.shift_code_id = sc.id
    WHERE sc.category = 'work'
  `;
  console.log(`  Work shift count: ${workShifts[0].count}`);

  console.log("\n=== RESET AND RESEED COMPLETE ===");
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error("Error:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});

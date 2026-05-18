import { db } from "@/lib/db";
import { homes, homeFloors, staff, shiftCodes, rotaEntries, auditLog, leaveRequests } from "./schema";

async function main() {
  console.log("Seeding database...");

  // Delete existing data (reverse order of dependencies)
  await db.delete(auditLog);
  await db.delete(rotaEntries);
  await db.delete(leaveRequests);
  await db.delete(staff);
  await db.delete(homeFloors);
  await db.delete(shiftCodes);
  await db.delete(homes);

  // Insert homes
  const [home] = await db.insert(homes).values({
    name: "Marlborough Court",
    payrollStartDay: 19,
    budgetCapMonthly: "33500.00"
  }).returning();

  // Insert floors
  const insertedFloors = await db.insert(homeFloors).values([
    { homeId: home.id, name: "Kings", code: "Kg", floorType: "care_floor", sortOrder: 1 },
    { homeId: home.id, name: "Upton / Jenkins", code: "Uj", floorType: "care_floor", sortOrder: 2 },
    { homeId: home.id, name: "The Thames", code: "Th", floorType: "care_floor", sortOrder: 3 },
  ]).returning();

  // Insert shift codes
  const insertedShiftCodes = await db.insert(shiftCodes).values([
    { code: "LD", label: "Long Day", hours: "12.00", category: "work", floors: ["care_floor"] },
    { code: "N", label: "Night", hours: "12.00", category: "work", floors: ["care_floor"] },
    { code: "E", label: "Early", hours: "6.00", category: "work", floors: ["care_floor"] },
    { code: "L", label: "Late", hours: "6.00", category: "work", floors: ["care_floor"] },
    { code: "RO", label: "Requested Off", hours: "0.00", category: "absence", floors: ["all"] },
    { code: "AL", label: "Annual Leave", hours: "0.00", category: "absence", floors: ["all"] },
    { code: "S", label: "Sick", hours: "0.00", category: "absence", floors: ["all"] },
  ]).returning();

  // Insert staff (around 20)
  const roles = ['HCA', 'Senior HCA', 'Nurse', 'Team Leader'];
  const employmentTypes = ['full_time', 'part_time', 'bank'];
  const staffToInsert = Array.from({ length: 20 }).map((_, i) => ({
    homeId: home.id,
    homeFloorId: insertedFloors[i % insertedFloors.length].id,
    name: `Staff Member ${i + 1}`,
    role: roles[i % roles.length],
    employmentType: employmentTypes[i % employmentTypes.length],
    contractedHours: (employmentTypes[i % employmentTypes.length] !== 'bank') ? "36.00" : null,
    payRateHourly: "11.50",
    isActive: true
  }));

  await db.insert(staff).values(staffToInsert).returning();

  console.log("Database seeded successfully!");
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});

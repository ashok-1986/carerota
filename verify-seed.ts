import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL || "");

async function main() {
  const [staff] = await sql`SELECT COUNT(*)::text as c FROM staff`;
  const [entries] = await sql`SELECT COUNT(*)::text as c FROM rota_entries`;
  const [homes] = await sql`SELECT COUNT(*)::text as c FROM homes`;
  const [floors] = await sql`SELECT COUNT(*)::text as c FROM home_floors`;
  const [active] = await sql`SELECT COUNT(*)::text as c FROM staff WHERE is_active = true`;
  console.log("homes:", homes.c, "staff:", staff.c, "active:", active.c, "entries:", entries.c, "floors:", floors.c);

  const breakdown = await sql`
    SELECT sc.code, COUNT(*)::text as c
    FROM rota_entries re
    JOIN shift_codes sc ON re.shift_code_id = sc.id
    GROUP BY sc.code
    ORDER BY c DESC
  `;
  breakdown.forEach(r => console.log(r.code, ":", r.c, "entries"));

  const codes = await sql`SELECT code, label, category FROM shift_codes ORDER BY code`;
  console.log("\nShift codes:");
  codes.forEach(x => console.log(" ", x.code, x.label, x.category));
}

main();
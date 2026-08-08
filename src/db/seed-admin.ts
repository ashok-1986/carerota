import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle" });

import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../lib/crypto";

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  const email = (process.env.ADMIN_EMAIL || "ashok@alchemetryx.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    console.error("ADMIN_PASSWORD is not set");
    process.exit(1);
  }

  const passwordHash = hashPassword(password);

  const result = await sql`
    INSERT INTO "user" (email, name, "emailVerified", password_hash)
    VALUES (${email}, 'Manager', NOW(), ${passwordHash})
    ON CONFLICT (email)
    DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
    RETURNING id, email, name, (password_hash IS NOT NULL) AS has_password
  `;

  console.log("Admin user upserted:");
  console.log(result);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error("Error:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});

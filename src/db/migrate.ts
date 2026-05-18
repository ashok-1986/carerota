import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle", override: true });

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATENDPOINT_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED || "";

if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED is not set");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("Running migrations...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "test" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid());
      DROP TABLE IF EXISTS "test";
    `;
    console.log("Database connection successful.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
  console.log("Migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
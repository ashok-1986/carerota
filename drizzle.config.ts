import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.drizzle" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
});
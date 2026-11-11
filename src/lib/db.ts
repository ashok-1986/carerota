import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.drizzle" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

// Fallback placeholder during build-time static analysis if DATABASE_URL is not provided in CI/build environment
const connectionString = process.env.DATABASE_URL || "postgresql://build-placeholder:placeholder@localhost:5432/db";
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

import { db } from './db';
import { rateLimits } from '@/db/schema';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Rate limiter with two backends:
//   1. In-memory Map (default via rateLimit) — fast, process-local, sync so it
//      can be used in NextAuth callbacks. Eviction + periodic sweep prevent
//      unbounded growth.
//   2. Postgres-backed shared store (rateLimitShared) — correct across
//      serverless instances (e.g. Vercel/Neon). Use in route handlers where
//      async is available; enabled explicitly, no env flag required.
// ---------------------------------------------------------------------------

interface Entry { count: number; resetAt: number }

const MAX_MEMORY_ENTRIES = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

const counts = new Map<string, Entry>();
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of counts) {
    if (now > entry.resetAt) counts.delete(key);
  }
  if (counts.size > MAX_MEMORY_ENTRIES) {
    const sorted = [...counts.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const excess = counts.size - MAX_MEMORY_ENTRIES;
    for (let i = 0; i < excess; i++) {
      const [key] = sorted[i];
      counts.delete(key);
    }
  }
}

/** Synchronous, in-memory rate limit. Safe to call from sync callbacks. */
export function rateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 60_000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  sweep(now);

  const record = counts.get(identifier);

  if (!record || now > record.resetAt) {
    counts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Async, shared Postgres-backed rate limit for route handlers. Prunes expired
 * rows periodically to keep the table bounded.
 */
export async function rateLimitShared(
  identifier: string,
  maxRequests = 5,
  windowMs = 60_000
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    // Opportunistic pruning of expired rows (bounded by identifier churn).
    await db
      .delete(rateLimits)
      .where(sql`${rateLimits.resetAt} < ${now}`);

    const [row] = await db
      .insert(rateLimits)
      .values({ identifier, count: 1, resetAt })
      .onConflictDoUpdate({
        target: rateLimits.identifier,
        set: {
          count: sql`CASE
            WHEN ${rateLimits.resetAt} < ${now} THEN 1
            ELSE ${rateLimits.count} + 1
          END`,
          resetAt: sql`CASE
            WHEN ${rateLimits.resetAt} < ${now} THEN ${resetAt}
            ELSE ${rateLimits.resetAt}
          END`,
          updatedAt: now,
        },
      })
      .returning();

    if (row.count > maxRequests) {
      const retryAfter = Math.ceil((new Date(row.resetAt).getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }
    return { allowed: true };
  } catch (error) {
    console.error('Rate limit DB store error:', error);
    return { allowed: false, retryAfter: 60 };
  }
}

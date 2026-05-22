# SECURITY.md — CareRota by Alchemetryx

**Version:** 1.0  
**Date:** May 2026  
**Classification:** Internal — Engineering and Ops  
**Owner:** Ashok / Alchemetryx  
**Stack:** Next.js 16 · Auth.js v5 · Neon PostgreSQL (eu-west-2) · Drizzle ORM · Vercel (lhr1) · Resend

---

## 1. Overview and Security Posture

CareRota handles staff scheduling data for UK residential care homes. While it does not process clinical resident data or payment card data, it does handle:

- **Personal data** of care workers (names, email addresses, employment contracts, pay rates, shift history)
- **Operational data** that is CQC-auditable (rota publications, leave approvals, audit logs)
- **Commercial data** (budget caps, agency costs, home-level financial metrics)

A breach or data leak would not just be a technical failure — it would be a regulatory failure under UK-GDPR and could directly harm the pilot relationship with Gold Care Homes.

This document covers the full security architecture, known risks, controls in place, and outstanding items to address before broader rollout.

---

## 2. Threat Model

### 2.1 Asset Inventory

| Asset | Sensitivity | Location | Risk if Compromised |
|---|---|---|---|
| Staff PII (name, email, phone) | High | Neon DB (eu-west-2) | UK-GDPR breach, ICO notification required |
| Pay rates (hourly rate per staff) | High | Neon DB | Employment law exposure, staff trust damage |
| Rota data (shift assignments) | Medium | Neon DB | Operational disruption, CQC evidence gap |
| Audit logs | High | Neon DB | CQC inspection failure if tampered |
| Budget cap and cost data | Medium | Neon DB | Commercial sensitivity for Gold Care HQ |
| AUTH_SECRET | Critical | Vercel env vars | Full session forgery, all accounts compromised |
| DATABASE_URL | Critical | Vercel env vars | Full DB read/write access |
| RESEND_API_KEY | Medium | Vercel env vars | Phishing emails sent from support@alchemetryx.com |
| Webhook signing secrets | Medium | Neon DB | Spoofed webhook payloads to external systems |
| ADMIN_EMAIL / ADMIN_PASSWORD | High | Vercel env vars | Full admin access to production |

### 2.2 Threat Actors

| Actor | Motivation | Likelihood | Example Attack |
|---|---|---|---|
| External attacker | Data theft, ransomware | Low–Medium | SQL injection, credential stuffing |
| Competitor | Intelligence gathering | Low | Scraping, social engineering |
| Malicious insider | Sabotage, data theft | Low | Exfiltrating staff data before leaving |
| Accidental insider | Misconfiguration | Medium | Wrong homeId in query, exposed env var |
| Phishing victim | Credential compromise | Medium | Manager clicks phishing link, session stolen |

### 2.3 STRIDE Analysis

| Threat | Category | Control in Place | Residual Risk |
|---|---|---|---|
| Session token forgery | Spoofing | AUTH_SECRET signs JWT; short expiry | Low |
| Cross-tenant data access | Tampering | homeId enforced in every query | Medium — needs automated test |
| Audit log deletion | Repudiation | Append-only audit_log table | Low |
| Staff PII exposure via API | Information Disclosure | Session auth on all routes | Low |
| Rota grid DDOS | Denial of Service | Vercel edge, rate limiting TBD | Medium |
| Role escalation (staff → manager) | Elevation of Privilege | Role checked in middleware and API | Low |

---

## 3. Authentication Security

### 3.1 Current Implementation

CareRota uses Auth.js v5 with two providers:

- **Credentials provider:** Admin login using `ADMIN_EMAIL` + `ADMIN_PASSWORD` environment variables
- **Magic link provider:** Staff login via Resend email — no password required

Session strategy: JWT (required for credentials provider with DB adapter).

### 3.2 Controls in Place

```ts
// Auth.js v5 JWT callback — role and homeId baked into token
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.homeId = user.homeId
      token.role = user.role
    }
    return token
  },
  async session({ session, token }) {
    session.user.homeId = token.homeId
    session.user.role = token.role
    return session
  }
}
```

**What this means:** Every session token contains `homeId` and `role`. These are the authoritative values used by every API route. Values from request body or query string are never trusted for authorisation.

### 3.3 Known Weaknesses

| Weakness | Risk | Recommended Fix | Priority |
|---|---|---|---|
| `ADMIN_PASSWORD` is a static string in env vars | If Vercel env vars are compromised, full admin access is lost | Rotate to a randomly generated 32-char password. Store in a password manager. | High |
| No MFA on admin account | Phishing a manager gives full access | Add TOTP via Auth.js or a separate provider before multi-home rollout | High |
| Magic link tokens have no expiry enforcement beyond Auth.js default | Forwarded magic link emails can be reused | Confirm `maxAge` on email provider is set to 600 seconds (10 minutes) | Medium |
| JWT session `maxAge` not explicitly set | Default may be too long | Set `session: { maxAge: 8 * 60 * 60 }` (8-hour sessions) | Medium |
| Dev session fallback in `[...nextauth]/route.ts` only runs in `NODE_ENV !== production` | If `NODE_ENV` is misconfigured, fallback could expose a dev session in production | Add explicit check: `if (process.env.NODE_ENV !== 'development') return NextResponse.next()` | High |

### 3.4 Recommended Auth.js Configuration

Add to `src/lib/auth.ts`:

```ts
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,        // 8 hours
    updateAge: 60 * 60,          // Refresh token every hour
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Never expose sensitive fields in session
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.sub,
          name: token.name,
          email: token.email,
          role: token.role,
          homeId: token.homeId,
          // Never include: password hash, internal IDs, DB connection details
        }
      }
    }
  }
}
```

---

## 4. Authorisation and Multi-Tenancy Security

### 4.1 The Golden Rule

Every database query that touches tenant-scoped data **must** include a `homeId` filter sourced from the verified session token — never from user input.

```ts
// WRONG — trusts user input
const homeId = req.query.homeId
const staff = await db.select().from(staffTable).where(eq(staffTable.homeId, homeId))

// CORRECT — trusts session only
const session = await getServerSession(authConfig)
const homeId = session.user.homeId  // from verified JWT
const staff = await db.select().from(staffTable).where(eq(staffTable.homeId, homeId))
```

### 4.2 RBAC Matrix

| Role | Can Read | Can Write | Can Publish | Can Delete | Can Access Settings |
|---|---|---|---|---|---|
| `home_manager` | All data for their home | All data for their home | Yes | Soft-delete only | Yes |
| `unit_manager` | Their floor only | Their floor only | No | No | No |
| `care_staff` | Own shifts only | No | No | No | No |
| `bank_staff` | Own shifts only | No | No | No | No |
| `system_admin` | All homes | All homes | Yes | Yes | Yes |

### 4.3 Middleware Enforcement

```ts
// middleware.ts — runs on every request
export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.AUTH_SECRET })

  // 1. Unauthenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2. API routes — enforce role
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const role = session.role
    const method = req.method

    // Staff cannot call write endpoints
    if (role === 'care_staff' && method !== 'GET') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/(app)/:path*']
}
```

### 4.4 Cross-Tenant Test Checklist

Run these manually before each major release:

- [ ] Log in as manager of Home A. Call `GET /api/staff?homeId=[Home B ID]` — must return 403 or empty, never Home B data
- [ ] Log in as care_staff. Call `GET /api/rota` — must return only own shifts
- [ ] Log in as care_staff. Call `POST /api/rota/bulk` — must return 403
- [ ] Log in as unit_manager. Call `POST /api/rota/publish` — must return 403
- [ ] Call any API route with no session cookie — must return 401

---

## 5. Data Security

### 5.1 Data in Transit

| Connection | Encryption | Notes |
|---|---|---|
| Browser → Vercel | TLS 1.3 | Enforced by Vercel, HSTS header should be set |
| Vercel → Neon DB | TLS | Neon enforces TLS on all connections |
| Vercel → Resend | TLS | HTTPS API call |
| Webhook delivery | TLS | All webhook URLs must be HTTPS — enforce in validation |

Add HSTS to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 5.2 Data at Rest

| Store | Encryption | Location | Notes |
|---|---|---|---|
| Neon PostgreSQL | AES-256 (Neon managed) | eu-west-2 (Ireland) | UK-GDPR compliant region |
| Vercel env vars | Encrypted at rest | Vercel infrastructure | Never log, never commit |
| Audit logs | No additional encryption needed | Neon DB | Append-only, immutable |

### 5.3 Sensitive Fields

These fields require extra care in logs, error messages, and API responses:

| Field | Table | Rule |
|---|---|---|
| `pay_rate_hourly` | `staff` | Never log. Never include in error messages. Exclude from staff list API unless role = home_manager |
| `email` | `staff`, `users` | Never log in plaintext. Mask in debug output: `a***@domain.com` |
| `AUTH_SECRET` | env | Never log. Never pass to client. Never include in error responses |
| `DATABASE_URL` | env | Never log. Never expose in `/api/health` or similar endpoints |
| Webhook `secret` | `webhooks` | Show once on creation. Never return in GET responses after that |

### 5.4 SQL Injection Prevention

CareRota uses Drizzle ORM with parameterised queries throughout. Raw SQL is prohibited by coding standards.

```ts
// Drizzle parameterises automatically — safe
const staff = await db
  .select()
  .from(staffTable)
  .where(eq(staffTable.homeId, homeId))

// If raw SQL is ever needed — use tagged template (Neon driver parameterises this)
const result = await sql`SELECT * FROM staff WHERE home_id = ${homeId}`

// NEVER do this
const result = await sql.unsafe(`SELECT * FROM staff WHERE home_id = '${homeId}'`)
```

---

## 6. API Security

### 6.1 Input Validation

Every API route must validate its request body against a Zod schema before processing.

```ts
// src/lib/validations.ts — example schemas
export const updateBudgetCapSchema = z.object({
  budgetCapMonthly: z.number().min(0).max(1_000_000),
  budgetNotes: z.string().max(500).optional(),
})

export const createWebhookSchema = z.object({
  url: z.string().url().startsWith('https://'),  // HTTPS only
  description: z.string().max(200).optional(),
  events: z.array(z.enum(['rota.published', 'leave.approved', 'leave.declined', 'budget.updated', 'staff.added'])).min(1),
})
```

```ts
// In API route handler
export async function PATCH(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const parsed = updateBudgetCapSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }

  // Now safe to use parsed.data
}
```

### 6.2 Rate Limiting

Currently not implemented. This is a known gap.

Add Vercel's built-in rate limiting or a simple in-memory limiter for the pilot:

```ts
// src/lib/rate-limit.ts
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(identifier: string, maxRequests = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (record.count >= maxRequests) return false // blocked

  record.count++
  return true // allowed
}
```

Apply to sensitive endpoints:

```ts
// In /api/auth/callback/credentials
const allowed = rateLimit(`login:${ip}`, 5, 60_000)  // 5 login attempts per minute
if (!allowed) return Response.json({ error: 'Too many attempts' }, { status: 429 })
```

Priority endpoints for rate limiting:
- `POST /api/auth/callback/credentials` — 5/minute per IP
- `POST /api/staff/invite` — 10/minute per user
- `POST /api/export/csv` and `/pdf` — 20/minute per user (these are CPU-heavy)
- `POST /api/rota/bulk` — 30/minute per user

### 6.3 CORS

Next.js App Router handles CORS via route handlers. Do not enable permissive CORS globally.

For the analytics API (`GET /api/analytics/summary`) which will be called by external tools:

```ts
// Only allow specific origins
const ALLOWED_ORIGINS = [
  'https://panel.alchemetryx.com',
  'https://app.powerbi.com',  // add when Power BI integration is live
]

export async function GET(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  const headers = {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
  // ...
}
```

### 6.4 Webhook Security

Every outbound webhook delivery must be signed using HMAC-SHA256.

```ts
// src/lib/webhooks.ts
import { createHmac } from 'crypto'

export async function fireWebhook(homeId: string, event: string, payload: object) {
  const webhooks = await getActiveWebhooks(homeId)

  for (const webhook of webhooks) {
    if (!webhook.events.includes(event)) continue

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    })

    const signature = createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex')

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CareRota-Signature': `sha256=${signature}`,
          'X-CareRota-Event': event,
          'X-CareRota-Delivery': crypto.randomUUID(),
        },
        body,
        signal: AbortSignal.timeout(10_000),  // 10 second timeout
      })

      // Log delivery result but never throw — webhook failure must not break app
      await logWebhookDelivery(webhook.id, response.status, response.ok)
    } catch (err) {
      await logWebhookDelivery(webhook.id, 0, false)
    }
  }
}
```

Receiving systems should verify the signature:

```ts
// Example verification (for documentation / Gold Care HQ integration guide)
const signature = req.headers['x-carerota-signature']
const expected = `sha256=${createHmac('sha256', webhookSecret).update(rawBody).digest('hex')}`
const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
```

---

## 7. UK-GDPR Compliance

### 7.1 Legal Basis

| Data Type | Legal Basis | Applies To |
|---|---|---|
| Staff identity (name, email) | Legitimate interest (employment management) | All staff |
| Pay rates | Contract performance | All staff |
| Shift assignments | Legitimate interest (safe staffing) | All staff |
| Audit logs | Legal obligation (CQC evidence) | All actions |
| IP addresses in audit log | Legitimate interest (security) | All actions |

### 7.2 Data Retention Schedule

| Table | Retention Period | Deletion Method | Who Triggers |
|---|---|---|---|
| `staff` | 12 months post-departure | Soft delete → scheduled hard delete | Vercel cron job (1st of month) |
| `rota_entries` | 12 months | Hard delete after retention window | Vercel cron job |
| `leave_requests` | 12 months | Hard delete after retention window | Vercel cron job |
| `audit_log` | 3 years | Never deleted | N/A |
| `additional_costs` | 12 months | Hard delete | Vercel cron job |
| `webhooks` | Until deleted by manager | Hard delete on request | Manager via Settings |

### 7.3 Data Subject Rights Implementation

| Right | Endpoint | Implementation Status |
|---|---|---|
| Right of Access (Art. 15) | `GET /api/staff/me/export` | Planned |
| Right to Erasure (Art. 17) | `DELETE /api/staff/[id]/deactivate` | Partial (soft delete only) |
| Right to Portability (Art. 20) | Same as access export | Planned |
| Right to Rectification (Art. 16) | `PATCH /api/staff/[id]` | Built |
| Right to Object | Manual process via support email | Not automated |

### 7.4 Data Processing Agreement

A DPA must be signed with each care home before onboarding. This is a UK-GDPR Article 28 legal requirement.

- The care home is the **Data Controller**
- Alchemetryx (CareRota) is the **Data Processor**
- Status: **Not yet drafted** — instruct a UK solicitor before adding any care home beyond Marlborough Court. Budget £300–£600.

### 7.5 Breach Response Plan

If a data breach is suspected:

1. **Within 1 hour:** Revoke compromised credentials (rotate `AUTH_SECRET`, `DATABASE_URL` connection password if DB is exposed)
2. **Within 24 hours:** Assess scope — which homes affected, what data categories, how many data subjects
3. **Within 72 hours:** If breach likely affects individual rights, notify ICO at `ico.org.uk/report-a-breach`
4. **Within 72 hours:** Notify affected care homes (as Data Controllers, they may need to notify their own staff)
5. **Document everything:** Time of discovery, scope assessment, actions taken, notifications sent

ICO notification threshold: Any breach that is likely to result in a risk to individuals' rights and freedoms. For CareRota, any exposure of staff PII outside the platform crosses this threshold.

---

## 8. Infrastructure Security

### 8.1 Vercel

| Setting | Current Status | Required Action |
|---|---|---|
| Environment variables | Set in Vercel dashboard | Never commit to git — confirmed |
| Preview deployments | Enabled | Ensure preview env vars use non-production DB |
| `AUTH_SECRET` rotation | Set 3 days ago | Rotate every 90 days |
| Domain SSL | Auto-managed by Vercel | No action needed |
| Deployment region | lhr1 (London) | Correct for UK data residency |

**Action required:** Set up a separate Neon database branch or separate DB for Preview deployments. Currently Preview may be pointing to the same production Neon database — this means PR previews can read and write production data.

### 8.2 Neon PostgreSQL

| Setting | Status | Notes |
|---|---|---|
| Region | eu-west-2 (Ireland) | UK-GDPR compliant |
| TLS | Enforced by Neon | All connections encrypted |
| Connection pooling | DATABASE_URL_UNPOOLED available | Use pooled for most queries, unpooled for migrations |
| Backup | Neon managed (point-in-time recovery) | Verify retention period in Neon dashboard |
| IP allowlist | Not configured | Consider restricting to Vercel IP ranges |

### 8.3 Secret Rotation Schedule

| Secret | Current Age | Rotate Every | Next Rotation Due |
|---|---|---|---|
| `AUTH_SECRET` | 3 days | 90 days | August 2026 |
| `DATABASE_URL` password | Unknown | 180 days | Check Neon dashboard |
| `RESEND_API_KEY` | 3+ days | 180 days | November 2026 |
| `ADMIN_PASSWORD` | 5 hours | 90 days | August 2026 |
| Webhook secrets | Per webhook | On suspicion of compromise | Manual |

---

## 9. Audit Logging

### 9.1 What Must Be Logged

Every action that touches data must write to `audit_log`. No exceptions.

| Action | Log Entry Action Value | Required Fields |
|---|---|---|
| Rota published | `ROTA_PUBLISHED` | homeId, userId, payPeriodStart, entryCount |
| Rota cell changed | `ROTA_CELL_UPDATED` | homeId, userId, entryId, oldCode, newCode |
| Bulk rota update | `ROTA_BULK_UPDATED` | homeId, userId, cellCount, shiftCode |
| Leave approved | `LEAVE_APPROVED` | homeId, managerId, staffId, dateRange |
| Leave declined | `LEAVE_DECLINED` | homeId, managerId, staffId, reason |
| Staff created | `STAFF_CREATED` | homeId, managerId, newStaffId |
| Staff edited | `STAFF_EDITED` | homeId, managerId, staffId, changedFields |
| Staff deactivated | `STAFF_DEACTIVATED` | homeId, managerId, staffId |
| Budget cap changed | `BUDGET_CAP_UPDATED` | homeId, managerId, oldCap, newCap |
| CSV export | `CSV_EXPORTED` | homeId, userId, payPeriodStart, floorIds |
| PDF export | `PDF_EXPORTED` | homeId, userId, payPeriodStart |
| Audit log exported | `AUDIT_LOG_EXPORTED` | homeId, userId |
| Login | `USER_LOGIN` | userId, ipAddress, userAgent |
| Login failed | `LOGIN_FAILED` | email, ipAddress, userAgent |
| Webhook fired | `WEBHOOK_FIRED` | homeId, webhookId, event, statusCode |
| Settings changed | `SETTINGS_UPDATED` | homeId, userId, changedFields |

### 9.2 Audit Log Schema

```ts
// src/db/schema/audit-log.ts
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  homeId: uuid('home_id').references(() => homes.id),
  userId: uuid('user_id'),           // null for system actions
  action: text('action').notNull(),  // e.g. 'ROTA_PUBLISHED'
  entityType: text('entity_type'),   // e.g. 'rota_entries'
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),       // before/after state, counts, etc.
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
// No update or delete permissions on this table. Append only.
```

### 9.3 logAction Utility

```ts
// src/lib/audit.ts
export async function logAction({
  homeId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  req,
}: LogActionParams) {
  const ipAddress = req?.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const userAgent = req?.headers.get('user-agent') ?? 'unknown'

  await db.insert(auditLog).values({
    homeId,
    userId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
    userAgent,
  })
  // Never throw — audit failure must not break the main operation
  // But do log to console.error so Vercel logs capture it
}
```

---

## 10. Dependency Security

### 10.1 Key Dependencies and Risk Profile

| Package | Version | Risk Notes |
|---|---|---|
| `next` | 16.2.6 | Keep updated — Next.js has had auth-bypass CVEs in the past |
| `next-auth` | v5 beta | Beta software — check for stable release before multi-home rollout |
| `drizzle-orm` | 0.45.2 | Low risk — thin query builder |
| `@neondatabase/serverless` | Latest | Low risk |
| `resend` | Latest | Low risk — outbound only |
| `zod` | Latest | Low risk — validation only |
| `framer-motion` | Latest | Low risk — client-side only |

### 10.2 Dependency Audit

Run monthly:

```bash
npm audit
npm audit --audit-level=high  # fail on high+ severity only
```

Add to GitHub Actions CI:

```yaml
- name: Security audit
  run: npm audit --audit-level=high
```

### 10.3 Automated Vulnerability Scanning

Enable GitHub Dependabot on the repo:

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    ignore:
      - dependency-name: next-auth
        update-types: [version-update:semver-major]  # Don't auto-update major Auth.js versions
```

---

## 11. Security Testing Checklist

### 11.1 Pre-Release Checklist (run before every production deployment)

**Authentication**
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password fails with generic error (not "wrong password" — say "invalid credentials")
- [ ] Magic link from email creates valid session
- [ ] Expired session redirects to login
- [ ] Session cookie has `HttpOnly`, `Secure`, `SameSite=Lax` flags

**Authorisation**
- [ ] Care staff cannot access `/rota` page (redirect to `/my-shifts`)
- [ ] Care staff `GET /api/rota` returns only their own entries
- [ ] `POST /api/rota/publish` returns 403 for non-manager
- [ ] `PATCH /api/settings/budget` returns 403 for non-manager
- [ ] API calls with no session return 401

**Cross-tenant isolation**
- [ ] Manager of Home A cannot read Home B staff via API
- [ ] Rota entries for Home A are invisible to Home B session
- [ ] Audit logs for Home A are invisible to Home B session

**Input validation**
- [ ] `budgetCapMonthly` field rejects negative numbers and strings
- [ ] Webhook URL rejects `http://` — only `https://` allowed
- [ ] Staff name field rejects SQL injection attempt (`'; DROP TABLE staff; --`)
- [ ] Shift code in rota cell rejects unknown codes

**Data exposure**
- [ ] `GET /api/staff` does not include `pay_rate_hourly` for non-manager sessions
- [ ] No stack traces in API error responses (only generic messages)
- [ ] No env var values in any API response
- [ ] Webhook `secret` not returned in `GET /api/settings/webhooks`

### 11.2 Penetration Testing Scope

Before Gold Care HQ rollout to all 49 homes, commission a basic web application penetration test covering:

- Authentication bypass attempts
- IDOR (Insecure Direct Object Reference) — accessing other tenants' data by changing IDs
- XSS via staff name fields, rota notes
- CSRF on state-changing endpoints
- JWT manipulation (changing role claim without valid signature)

Estimated cost: £1,500–£3,000 from a UK-based security firm. This should be a line item in the 49-home commercial contract negotiation with Gold Care HQ.

---

## 12. Incident Response

### 12.1 Severity Definitions

| Severity | Definition | Example | Response Time |
|---|---|---|---|
| P1 — Critical | Production down or data breach confirmed | DB credentials exposed publicly | Immediate |
| P2 — High | Auth bypass or cross-tenant leak discovered | Manager can read another home's data | Within 2 hours |
| P3 — Medium | Feature broken, no data exposure | Rota export fails | Within 24 hours |
| P4 — Low | Minor UI bug | Cost bar colour wrong | Next sprint |

### 12.2 P1/P2 Response Steps

1. **Contain:** Rotate compromised credentials immediately. If DB is exposed, change the Neon database password first.
2. **Assess:** Query `audit_log` to understand what data was accessed and by whom.
3. **Notify:** Contact Gold Care HQ operations director within 4 hours if their data is involved.
4. **Report:** If personal data of care staff was exposed, notify ICO within 72 hours.
5. **Fix:** Deploy patch. Verify fix. Document root cause.
6. **Review:** Update this SECURITY.md with new control to prevent recurrence.

### 12.3 Useful Queries for Incident Investigation

```sql
-- All actions by a specific user in the last 24 hours
SELECT action, entity_type, metadata, ip_address, created_at
FROM audit_log
WHERE user_id = '[user-id]'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- All exports from a specific home
SELECT action, metadata, ip_address, created_at
FROM audit_log
WHERE home_id = '[home-id]'
  AND action IN ('CSV_EXPORTED', 'PDF_EXPORTED', 'AUDIT_LOG_EXPORTED')
ORDER BY created_at DESC;

-- Failed login attempts
SELECT metadata->>'email' as email, ip_address, COUNT(*) as attempts, MAX(created_at) as last_attempt
FROM audit_log
WHERE action = 'LOGIN_FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'email', ip_address
ORDER BY attempts DESC;

-- All budget cap changes
SELECT metadata, user_id, created_at
FROM audit_log
WHERE action = 'BUDGET_CAP_UPDATED'
ORDER BY created_at DESC;
```

---

## 13. Outstanding Security Items (Prioritised)

| # | Item | Priority | Owner | Target |
|---|---|---|---|---|
| 1 | Add MFA to admin/manager accounts | High | Ashok | Before 49-home rollout |
| 2 | Separate Preview deployment DB from Production | High | Ashok | This week |
| 3 | Set `session.maxAge` to 8 hours in auth.ts | High | Antigravity | Next sprint |
| 4 | Add rate limiting to login endpoint | High | Antigravity | Next sprint |
| 5 | Implement HSTS and security headers in vercel.json | High | Antigravity | Next sprint |
| 6 | Set up Dependabot on GitHub repo | Medium | Ashok | This week |
| 7 | Draft Data Processing Agreement with solicitor | High | Ashok | Before any paid customer |
| 8 | Implement `GET /api/staff/me/export` (GDPR Art. 20) | Medium | Antigravity | Before staff onboarding |
| 9 | Add `npm audit` to GitHub Actions CI | Medium | Antigravity | Next sprint |
| 10 | Commission penetration test | Medium | Ashok | Before 49-home rollout |
| 11 | Create separate Neon branch for Preview environment | Medium | Ashok | This week |
| 12 | Add webhook delivery logging to audit_log | Low | Antigravity | After webhooks are built |
| 13 | Restrict Neon IP allowlist to Vercel IP ranges | Low | Ashok | Before 49-home rollout |

---

## 14. Security Contacts

| Role | Contact | For |
|---|---|---|
| Product / Engineering | Ashok (Alchemetryx) | All security issues |
| UK GDPR breach reporting | ICO — ico.org.uk/report-a-breach | Notifiable breaches within 72 hours |
| Gold Care HQ data contact | TBD — confirm with Nimish | Notify if their home's data is involved |
| Neon support | support@neon.tech | DB-level incidents |
| Vercel support | vercel.com/support | Infrastructure incidents |
| Resend support | resend.com/support | Email delivery incidents |

---

*CareRota SECURITY.md · Version 1.0 · May 2026 · Alchemetryx*  
*Review this document quarterly and after every significant architecture change.*  
*Next review: August 2026*

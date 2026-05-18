# CareRota — Claude Code Context

## What we are building
CareRota is a care home operations platform for UK residential care groups.
Pilot client: Gold Care Homes. Pilot site: Marlborough Court Care Home.
Primary user: Maribel Pascual (Home Manager, 2-3 decades tenure).
Production URL: panel.alchemetryx.com

## The problem we are solving
Maribel builds a 125-person monthly rota in Excel (3-4 hrs/month).
Vrushali re-enters it manually into Softworks for payroll (2-3 hrs/month).
Leave is tracked in a personal paper diary.
CareRota eliminates all three pain points.

## Stack (non-negotiable)
- Next.js 15 App Router + TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui + Radix UI primitives
- Auth.js v5 (NextAuth) — credentials + magic link. NO Kinde. NO Clerk.
- Drizzle ORM + Neon PostgreSQL (eu-west-2 region)
- TanStack Query v5 — all server state, optimistic updates
- Framer Motion v11 — animations only from src/lib/animations.ts
- @hello-pangea/dnd — drag and drop on rota grid
- react-hook-form + Zod — all forms
- Resend — email (magic links, leave notifications, rota publish alerts)
- Lucide React — ONLY icon library. No emoji as icons. Ever.
- Recharts — cost dashboard charts only
- date-fns — date utilities

## File structure rules
- Components: src/components/[domain]/ComponentName.tsx
- Hooks: src/hooks/use[Name].ts
- Business logic: src/lib/[name].ts
- DB schemas: src/db/schema/[name].ts
- DB queries: src/db/queries/[name].ts
- Types: src/types/[name].ts
- API routes: src/app/api/[resource]/route.ts
- Never create files outside this structure without updating Architecture PRD.

## Coding rules
- No `any` types. Ever. Use `unknown` and narrow.
- No raw hex values in components. Tailwind brand tokens only.
- No business logic in components. Data via props or hooks only.
- All mutations use TanStack Query useMutation() with optimistic updates.
- All forms use react-hook-form + Zod resolver.
- All modals use shadcn Dialog or Sheet.
- Every API route: verify session, verify home_id matches resource, 
  validate body against Zod schema, call logAction() on mutations.
- Every DB mutation: use transactions when touching multiple tables.
- audit_log table: APPEND ONLY. No UPDATE or DELETE. Ever.
- Row-level security: every query filters by home_id.

## Component sources (priority order)
1. shadcn/ui — check first for any standard component
2. 21st.dev — for complex patterns (data grids, calendar grids)
3. Build custom — only when neither covers the pattern

## What NOT to build
- Weekly rota view (Marlborough Court uses MONTHLY)
- Kinde or Clerk auth (Auth.js v5 only)
- Kitchen, Maintenance, Training, Audits modules (Phase 2+)
- Payroll engine (we feed Softworks via CSV, we don't replace it)
- Native mobile web app (mobile-optimised web only)
- AI rota generation (needs 3+ months data first)
- Any module beyond Rota + Leave in MVP

## Key domain facts
- Pay period: 19th of month to 18th of next month (configurable)
- Three care floors: King George, Union Jack, Thames (user-configurable names)
- Plus: Office tab, Ancillary tab
- Staff sections per floor: RNs/Senior Carers Day, Carer Day, 
  RNs/Senior Carers Night, Carer Night
- Shift codes: LD(12h), N(10h), E(7.5h), L(8h), Su(12h), 1-1(12h),
  RO(0h), AL(0h), ML(0h), Kg(float), Uj(float), Th(float)
- Bank staff float across all floors. Permanent staff locked to one floor.
- Approved leave auto-blocks rota cell as AL. AL cells are non-editable.
- Budget cap per home per month. Cost dashboard updates live as rota is built.
- Softworks integration: CSV export only (no API access available).

## Git workflow
Branch: main (production) → dev (staging) → feature/* (development)
Never commit to main directly.
Commit format: type(scope): description
Types: feat, fix, chore, refactor, test, docs
Run npm run type-check before every commit.

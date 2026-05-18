
CAREROTA · TECHNICAL ARCHITECTURE
Folder & File Architecture
Complete project structure for rota.alchemetryx.com
v1.0 · Alchemetryx · May 2026 · Next.js 15 App Router · TypeScript · Tailwind CSS v4

How to use this document
This document defines the exact folder and file structure for the CareRota codebase.
Every file listed here has a defined purpose. Do not create files outside this structure without updating this document.
Read this before opening Claude Code. Reference CLAUDE.md in the repo root for AI coding context.
Sections are ordered: repo root → config files → source structure → database → tests → deployment.

 
1. Repository Root
Fresh Next.js 15 repo initialised at rota.alchemetryx.com. All files below live at the root unless indicated.

1.1 Root-level files
File	Purpose	Notes
.env.local	Local environment variables. Never committed.	See Section 1.2 for all required keys.
.env.example	Template for environment variables. Committed.	All keys listed with placeholder values.
.gitignore	Standard Next.js gitignore + extras.	Add: .env.local, /coverage, *.tsbuildinfo
next.config.ts	Next.js configuration.	Image domains, experimental features, redirects.
tailwind.config.ts	Tailwind + brand tokens.	All brand colors as custom tokens. See Section 2.2.
tsconfig.json	TypeScript configuration.	Strict mode on. Path aliases: @/* → ./src/*
components.json	shadcn/ui configuration.	Style: default. Base color: neutral. CSS variables: true.
package.json	Dependencies and scripts.	See Section 1.3 for full dependency list.
CLAUDE.md	AI coding context file.	Read by Claude Code at session start. Full project context, rules, what not to build.
BRAND.md	Design system reference.	All brand tokens, typography, color rules, anti-patterns. Read before any UI work.
SKILLS.md	AI skill references.	Links to ui-ux-pro-max, animation patterns, component sources priority.
README.md	Project documentation.	Setup instructions, environment variables, deployment steps.
middleware.ts	Auth middleware.	Route protection. Redirects unauthenticated users to /login.
drizzle.config.ts	Database ORM configuration.	Points to Neon PostgreSQL. eu-west-2 region.

1.2 Environment variables
.env.local — all required keys
# Auth.js v5
AUTH_SECRET=                          # 32-char random string. npx auth secret
AUTH_URL=https://rota.alchemetryx.com

# Database — Neon PostgreSQL (eu-west-2)
DATABASE_URL=                         # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=                # Neon connection string (direct — for migrations)

# Email — Resend
RESEND_API_KEY=                       # For magic links and leave notifications
RESEND_FROM_EMAIL=noreply@alchemetryx.com

# App
NEXT_PUBLIC_APP_URL=https://rota.alchemetryx.com
NEXT_PUBLIC_APP_NAME=CareRota

# Optional — Analytics (Vercel Analytics, no third-party)
NEXT_PUBLIC_VERCEL_ANALYTICS=true

1.3 Core dependencies
Package	Version	Purpose
next	15.x	Framework. App Router. Server components.
react / react-dom	19.x	UI library.
typescript	5.x	Type safety. Strict mode.
tailwindcss	4.x	Styling. Brand tokens.
next-auth	5.x (Auth.js)	Authentication. Credentials + magic link.
drizzle-orm	latest	Type-safe ORM for Neon PostgreSQL.
drizzle-kit	latest	Schema migrations.
@neondatabase/serverless	latest	Neon PostgreSQL serverless driver.
@tanstack/react-query	5.x	Server state management. Optimistic updates.
framer-motion	11.x	Animations. Cell hover, modals, list stagger.
@hello-pangea/dnd	latest	Drag and drop for rota cell painting.
react-hook-form	7.x	Form management.
zod	3.x	Schema validation. Shared client + server.
@hookform/resolvers	latest	Zod resolver for react-hook-form.
date-fns	3.x	Date utilities. Pay period calculation.
recharts	2.x	Cost dashboard charts.
resend	latest	Email SDK. Magic links, notifications.
lucide-react	latest	Icons. Only icon library used.
clsx	latest	Conditional classNames.
tailwind-merge	latest	Merge Tailwind classes safely.
@radix-ui/*	via shadcn	Accessible primitives. Installed via shadcn CLI.
class-variance-authority	latest	Component variants for shadcn.

 
2. Configuration Files
2.1 next.config.ts
next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [{ hostname: '*.neon.tech' }],
  },
  experimental: {
    typedRoutes: true,      // Type-safe Link href
    serverActions: { allowedOrigins: ['rota.alchemetryx.com'] },
  },
}

export default config

2.2 tailwind.config.ts — brand tokens
tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight:  '#1A2642',   // Primary — navs, headers, body text
        pearl:     '#F8F6F0',   // Backgrounds, breathing room
        gold:      '#D4AF37',   // CTAs only — use sparingly
        amethyst:  '#6B4C9A',   // Absence shift codes, secondary
        teal:      '#008B8B',   // Float codes, success, innovation
        slate:     '#6B7280',   // Borders, secondary text
      },
      fontFamily: {
        sans:    ['Urbanist', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      fontSize: {
        'cell': ['13px', { lineHeight: '1.2', fontWeight: '700' }],
      },
    },
  },
}
export default config

 
3. Source Directory Structure — /src
Every file in /src has a single, defined responsibility. Nothing lives outside this structure.

Top-level /src structure
src/
├── app/                          # Next.js App Router — pages and API routes
├── components/                   # React components — UI only, no business logic
├── lib/                          # Business logic, utilities, constants
├── db/                           # Database schema, queries, migrations
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Global CSS
└── middleware.ts                 # Auth route protection (at root, not in src/)

3.1 /src/app — App Router pages and API
src/app/ — complete route map
src/app/
├── layout.tsx                    # Root layout. Fonts, providers, metadata.
├── page.tsx                      # Marketing/landing page (pre-auth)
├── globals.css                   # Tailwind imports, CSS variables
├── favicon.ico

├── (auth)/                       # Auth route group — no sidebar layout
│   ├── login/
│   │   └── page.tsx              # Email/password login form
│   ├── register/
│   │   └── page.tsx              # Home manager registration
│   └── verify-email/
│       └── page.tsx              # Magic link landing page for staff

├── (app)/                        # Authenticated route group — with sidebar
│   ├── layout.tsx                # App shell: sidebar + top bar + providers
│   ├── dashboard/
│   │   └── page.tsx              # Home dashboard — KPIs, cost snapshot, alerts
│   ├── rota/
│   │   ├── page.tsx              # Rota builder — current pay period
│   │   └── [month]/
│   │       └── page.tsx          # Historical rota view (read-only)
│   ├── leave/
│   │   ├── page.tsx              # Leave management — pending, approved, declined
│   │   └── [staffId]/
│   │       └── page.tsx          # Leave history for one staff member
│   ├── staff/
│   │   ├── page.tsx              # Staff directory
│   │   ├── new/
│   │   │   └── page.tsx          # Add new staff member
│   │   └── [staffId]/
│   │       └── page.tsx          # Staff profile — shifts, leave, pattern
│   ├── settings/
│   │   ├── page.tsx              # Home settings — name, floors, pay period
│   │   └── floors/
│   │       └── page.tsx          # Floor configuration — names, codes
│   └── export/
│       └── page.tsx              # Export centre — CSV and PDF generation

├── (staff)/                      # Staff-facing route group — mobile optimised
│   ├── layout.tsx                # Minimal layout. No sidebar.
│   └── my-shifts/
│       └── page.tsx              # Staff shift view — own shifts, leave request

└── api/
    ├── auth/[...nextauth]/
    │   └── route.ts              # Auth.js route handler
    ├── rota/
    │   ├── route.ts              # GET /api/rota — fetch entries for pay period
    │   └── [entryId]/
    │       └── route.ts          # PATCH/DELETE /api/rota/[id] — update cell
    ├── rota/bulk/
    │   └── route.ts              # POST /api/rota/bulk — batch cell updates
    ├── rota/publish/
    │   └── route.ts              # POST /api/rota/publish — publish draft
    ├── leave/
    │   ├── route.ts              # GET/POST /api/leave — fetch/create requests
    │   └── [requestId]/
    │       └── route.ts          # PATCH /api/leave/[id] — approve/decline
    ├── staff/
    │   ├── route.ts              # GET/POST /api/staff — directory and add
    │   └── [staffId]/
    │       └── route.ts          # GET/PATCH /api/staff/[id]
    ├── staff/invite/
    │   └── route.ts              # POST /api/staff/invite — send magic link
    ├── floors/
    │   └── route.ts              # GET/PATCH /api/floors — floor config
    ├── export/csv/
    │   └── route.ts              # POST /api/export/csv — generate CSV
    └── export/pdf/
        └── route.ts              # POST /api/export/pdf — generate PDF

3.2 /src/components — UI components
Components are organised by domain. No business logic here — only UI. Data comes via props or TanStack Query hooks.

src/components/ — complete component map
src/components/

├── ui/                           # shadcn/ui generated components (do not hand-edit)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── command.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── dropdown-menu.tsx
│   ├── avatar.tsx
│   ├── skeleton.tsx
│   ├── tabs.tsx
│   └── tooltip.tsx

├── layout/                       # App shell components
│   ├── Sidebar.tsx               # Left navigation — Dashboard, Rota, Leave, Staff, Settings
│   ├── TopBar.tsx                # Home name, user menu, notifications bell
│   ├── AppShell.tsx              # Sidebar + TopBar composition
│   ├── MobileNav.tsx             # Bottom nav for staff mobile view
│   └── PageHeader.tsx            # Reusable page heading with breadcrumb

├── rota/                         # Rota builder components
│   ├── MonthlyRotaGrid.tsx       # Main grid: rows=staff, cols=days, cells=shift codes
│   ├── RotaCell.tsx              # Individual cell — displays code, handles click/drag
│   ├── ShiftCodePicker.tsx       # Popover grid of shift code buttons (opens on cell click)
│   ├── SectionHeader.tsx         # Non-editable section label rows (RNs Day, Carer Night...)
│   ├── FloorTabs.tsx             # Tab bar — King George | Union Jack | Thames | Office | Ancillary
│   ├── PayPeriodNav.tsx          # Previous / current / next pay period navigation
│   ├── RotaToolbar.tsx           # Publish button, export button, draft status badge
│   ├── CostDashboard.tsx         # Sidebar panel — budget, projected cost, variance, by-role
│   ├── CostBar.tsx               # Animated utilisation progress bar (Recharts + Framer)
│   ├── PublishReview.tsx         # Pre-publish review modal — gaps, alerts, cost summary
│   ├── PatternSetup.tsx          # Weekly pattern editor per staff member
│   └── RotaLegend.tsx            # Shift code legend — colour + label + hours

├── leave/                        # Leave management components
│   ├── LeaveRequestList.tsx      # Tabbed list — Pending | Approved | Declined
│   ├── LeaveRequestCard.tsx      # Single request card with approve/decline actions
│   ├── LeaveRequestForm.tsx      # Staff-facing leave request form
│   ├── LeaveCalendar.tsx         # Calendar overlay showing approved leave
│   └── LeaveBalance.tsx          # Contracted entitlement vs used days per staff

├── staff/                        # Staff directory components
│   ├── StaffDirectory.tsx        # Grid/list of staff cards with filters
│   ├── StaffCard.tsx             # Individual staff card — role, type, DBS, floor
│   ├── StaffForm.tsx             # Add/edit staff — react-hook-form + zod
│   ├── StaffFilters.tsx          # Filter bar — role, floor, employment type, DBS
│   └── InviteStaffDialog.tsx     # Send magic link invite dialog

├── dashboard/                    # Home dashboard components
│   ├── KpiCards.tsx              # Active staff, shifts today, pending leave, alerts
│   ├── CostSnapshot.tsx          # Current month cost vs budget — mini dashboard widget
│   ├── AlertsFeed.tsx            # Compliance and coverage alerts feed
│   └── QuickActions.tsx          # Quick action buttons — build rota, approve leave

├── export/                       # Export components
│   ├── ExportCsvDialog.tsx       # Configure and trigger CSV export
│   └── ExportPdfDialog.tsx       # Configure and trigger PDF export

├── auth/                         # Auth-specific components
│   ├── LoginForm.tsx             # Email/password login
│   ├── RegisterForm.tsx          # Home manager registration
│   └── MagicLinkSent.tsx         # Confirmation screen after magic link email sent

└── shared/                       # Truly reusable across all domains
    ├── StatusBadge.tsx           # Reusable status badge — pending, approved, published...
    ├── EmptyState.tsx            # Empty state with icon, message, CTA
    ├── ErrorBoundary.tsx         # React error boundary wrapper
    ├── LoadingSpinner.tsx        # Branded loading spinner (Alchemical Gold)
    ├── ConfirmDialog.tsx         # Reusable confirm/cancel dialog
    └── DataTable.tsx             # Generic sortable/filterable table wrapper

3.3 /src/lib — business logic and utilities
src/lib/ — complete library map
src/lib/

├── auth.ts                       # Auth.js v5 config — providers, callbacks, session
├── db.ts                         # Neon database client — neon() tagged template
├── email.ts                      # Resend email client — send magic links, notifications

├── animations.ts                 # ALL Framer Motion variants (single source of truth)
│                                 # pageVariants, modalVariants, slideInRight,
│                                 # staggerContainer, itemVariants, numberSpring

├── constants.ts                  # Application constants — NEVER hardcode elsewhere
│                                 # SHIFT_CODES, DEFAULT_FLOOR_NAMES, FLOOR_TYPES,
│                                 # LEAVE_TYPES, EMPLOYMENT_TYPES, ROLES,
│                                 # PAY_PERIOD_DEFAULT_START_DAY (19),
│                                 # BUDGET_WARNING_THRESHOLD (0.85),
│                                 # DBS_EXPIRY_WARNING_DAYS (30)

├── utils.ts                      # Pure utility functions
│                                 # cn() — clsx + tailwind-merge
│                                 # formatCurrency(), formatHours()
│                                 # getPayPeriod() — returns start/end dates
│                                 # getDaysInPayPeriod() — array of Date objects
│                                 # calcShiftHours() — code → hours number
│                                 # isAbsenceCode(), isFloatCode(), isWorkCode()

├── validations.ts                # Zod schemas — shared client + server
│                                 # rotaEntrySchema, leaveRequestSchema,
│                                 # staffSchema, homeSettingsSchema,
│                                 # publishRotaSchema, exportCsvSchema

├── cost.ts                       # Cost dashboard calculation logic
│                                 # calcProjectedCost() — entries + pay rates → £
│                                 # calcBudgetedHours() — staff + pay period → hours
│                                 # calcScheduledHours() — entries → hours
│                                 # calcCostByRole() — breakdown by role type
│                                 # calcCapUtilisation() — projected / cap → %

├── rota.ts                       # Rota business logic
│                                 # applyPattern() — weekly pattern → monthly entries
│                                 # detectGaps() — find uncovered days per section
│                                 # detectComplianceIssues() — consecutive days, hours
│                                 # groupBySection() — sort staff into section groups

├── csv.ts                        # CSV generation for Softworks export
│                                 # generateSoftworksCSV() — entries → CSV string
│                                 # formatPayPeriodHeader() — 19th-18th format

└── audit.ts                      # Audit log helpers
    │                             # logAction() — write to audit_log table
    └──                           # Used in all API route handlers on mutations

3.4 /src/db — database layer
src/db/ — complete database layer
src/db/

├── schema/                       # Drizzle ORM table definitions
│   ├── index.ts                  # Re-exports all schemas
│   ├── homes.ts                  # homes table
│   ├── floors.ts                 # home_floors table
│   ├── users.ts                  # users table (auth)
│   ├── staff.ts                  # staff table
│   ├── shift-codes.ts            # shift_codes table + defaults
│   ├── rota-entries.ts           # rota_entries table
│   ├── leave-requests.ts         # leave_requests table
│   └── audit-log.ts              # audit_log table (append-only)

├── queries/                      # Drizzle query functions — NO raw SQL elsewhere
│   ├── rota.ts                   # getRotaForPeriod(), upsertRotaEntry(),
│   │                             # bulkUpsertEntries(), publishRota()
│   ├── leave.ts                  # getLeaveRequests(), createLeaveRequest(),
│   │                             # updateLeaveStatus(), getLeaveBalance()
│   ├── staff.ts                  # getStaffByHome(), createStaff(),
│   │                             # updateStaff(), getStaffWithPattern()
│   ├── cost.ts                   # getPayRates(), getContractedHours()
│   ├── floors.ts                 # getFloorsByHome(), updateFloor()
│   └── audit.ts                  # insertAuditLog() — called from lib/audit.ts

└── migrations/                   # Drizzle-kit generated migrations
    ├── 0000_initial_schema.sql
    └── meta/                     # Migration metadata (do not hand-edit)

3.5 /src/hooks — custom React hooks
src/hooks/ — complete hooks map
src/hooks/

├── useRota.ts                    # TanStack Query — fetch and mutate rota entries
│                                 # useRotaEntries(), useUpdateRotaCell(),
│                                 # useBulkUpdateCells(), usePublishRota()

├── useLeave.ts                   # TanStack Query — leave requests
│                                 # useLeaveRequests(), useCreateLeaveRequest(),
│                                 # useUpdateLeaveStatus()

├── useStaff.ts                   # TanStack Query — staff directory
│                                 # useStaff(), useCreateStaff(), useInviteStaff()

├── useCost.ts                    # Derived cost state from rota entries
│                                 # useProjectedCost() — live calculation
│                                 # useCapUtilisation() — % of budget used

├── usePayPeriod.ts               # Current pay period dates
│                                 # usePayPeriod() — { start, end, days[] }

├── useRotaDrag.ts                # Drag-paint logic for @hello-pangea/dnd
│                                 # Handles multi-cell shift code painting

├── useExport.ts                  # CSV and PDF export triggers

└── useAuditLog.ts                # Fetch audit log entries for a record

3.6 /src/types — TypeScript definitions
src/types/ — complete type map
src/types/

├── index.ts                      # Re-exports all types
├── db.ts                         # Types inferred from Drizzle schema
│                                 # Home, Floor, Staff, ShiftCode,
│                                 # RotaEntry, LeaveRequest, AuditLog
├── rota.ts                       # Rota-specific computed types
│                                 # RotaGridRow, SectionGroup, PayPeriod,
│                                 # CellState, DragState
├── cost.ts                       # Cost dashboard types
│                                 # CostSnapshot, CostByRole, BudgetStatus
├── api.ts                        # API request/response types
│                                 # All API route input/output shapes
└── auth.ts                       # Session and user types
                                  # SessionUser, UserRole

4. Database Schema
Drizzle ORM. All tables use UUID primary keys. All mutations go through /src/db/queries/ — never raw SQL in components or API routes.

4.1 Complete schema — all tables
homes
// src/db/schema/homes.ts
export const homes = pgTable('homes', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  name:                varchar('name', { length: 255 }).notNull(),
  groupId:             uuid('group_id'),           // Future: care_groups FK
  payrollStartDay:     smallint('payroll_start_day').default(19).notNull(),
  budgetCapMonthly:    decimal('budget_cap_monthly', { precision: 10, scale: 2 }),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
})

home_floors
// src/db/schema/floors.ts
export const homeFloors = pgTable('home_floors', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull().references(() => homes.id),
  name:        varchar('name', { length: 100 }).notNull(),
  code:        varchar('code', { length: 10 }).notNull(),   // Kg, Uj, Th
  floorType:   varchar('floor_type').notNull(),             // care_floor|office|ancillary
  sortOrder:   smallint('sort_order').default(0).notNull(),
})

staff
// src/db/schema/staff.ts
export const staff = pgTable('staff', {
  id:               uuid('id').primaryKey().defaultRandom(),
  homeId:           uuid('home_id').notNull().references(() => homes.id),
  homeFloorId:      uuid('home_floor_id').references(() => homeFloors.id),
  name:             varchar('name', { length: 255 }).notNull(),
  role:             varchar('role', { length: 50 }).notNull(),
  employmentType:   varchar('employment_type').notNull(), // full_time|part_time|bank
  contractedHours:  decimal('contracted_hours', { precision: 5, scale: 2 }),
  payRateHourly:    decimal('pay_rate_hourly', { precision: 8, scale: 2 }),
  authUserId:       uuid('auth_user_id'),
  isActive:         boolean('is_active').default(true).notNull(),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
})

rota_entries
// src/db/schema/rota-entries.ts
export const rotaEntries = pgTable('rota_entries', {
  id:             uuid('id').primaryKey().defaultRandom(),
  homeId:         uuid('home_id').notNull().references(() => homes.id),
  staffId:        uuid('staff_id').notNull().references(() => staff.id),
  homeFloorId:    uuid('home_floor_id').notNull().references(() => homeFloors.id),
  shiftDate:      date('shift_date').notNull(),
  shiftCodeId:    uuid('shift_code_id').references(() => shiftCodes.id),
  actualFloorId:  uuid('actual_floor_id').references(() => homeFloors.id), // float
  rotaMonth:      date('rota_month').notNull(),   // pay period start date
  isPublished:    boolean('is_published').default(false).notNull(),
  createdBy:      uuid('created_by').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
})

leave_requests
// src/db/schema/leave-requests.ts
export const leaveRequests = pgTable('leave_requests', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull().references(() => homes.id),
  staffId:     uuid('staff_id').notNull().references(() => staff.id),
  leaveType:   varchar('leave_type').notNull(),
  startDate:   date('start_date').notNull(),
  endDate:     date('end_date').notNull(),
  status:      varchar('status').default('pending').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy:  uuid('reviewed_by'),
  reviewedAt:  timestamp('reviewed_at'),
  notes:       text('notes'),
})

audit_log
// src/db/schema/audit-log.ts  — APPEND ONLY. No UPDATE or DELETE ever.
export const auditLog = pgTable('audit_log', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull(),
  userId:      uuid('user_id').notNull(),
  action:      varchar('action', { length: 100 }).notNull(),
  entityType:  varchar('entity_type', { length: 50 }).notNull(),
  entityId:    uuid('entity_id').notNull(),
  beforeValue: jsonb('before_value'),
  afterValue:  jsonb('after_value'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  ipAddress:   varchar('ip_address', { length: 45 }),
})

 
5. Key File Contents
5.1 src/lib/constants.ts — full constants file
src/lib/constants.ts
export const SHIFT_CODES = [
  { code: 'LD', label: 'Long Day',         hours: 12,   category: 'work',    floors: ['care'] },
  { code: 'N',  label: 'Night',             hours: 10,   category: 'work',    floors: ['care'] },
  { code: 'E',  label: 'Early',             hours: 7.5,  category: 'work',    floors: ['ancillary', 'office'] },
  { code: 'L',  label: 'Late',              hours: 8,    category: 'work',    floors: ['ancillary'] },
  { code: 'Su', label: 'Supernumerary',     hours: 12,   category: 'work',    floors: ['care'] },
  { code: '1-1',label: 'One-to-One',        hours: 12,   category: 'work',    floors: ['care'] },
  { code: '9-5',label: 'Office Hours',      hours: 7.5,  category: 'work',    floors: ['office'] },
  { code: 'RO', label: 'Rest Off',          hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'AL', label: 'Annual Leave',      hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'ML', label: 'Maternity Leave',   hours: 0,    category: 'absence', floors: ['all'] },
  { code: 'Kg', label: 'Float — King George', hours: 0,  category: 'float',   floors: ['care'] },
  { code: 'Uj', label: 'Float — Union Jack',  hours: 0,  category: 'float',   floors: ['care'] },
  { code: 'Th', label: 'Float — Thames',      hours: 0,  category: 'float',   floors: ['care'] },
] as const

export const DEFAULT_FLOOR_NAMES = ['Unit 1', 'Unit 2', 'Unit 3', 'Office', 'Ancillary']
export const PAY_PERIOD_START_DAY = 19
export const BUDGET_WARNING_THRESHOLD = 0.85   // 85% — show amber warning
export const DBS_WARNING_DAYS = 30              // flag DBS expiring within 30 days

export const SHIFT_CELL_COLORS: Record<string, string> = {
  work:    'bg-blue-50 border-blue-200 text-midnight',
  absence: 'bg-amethyst/10 border-amethyst/30 text-amethyst',
  float:   'bg-teal/10 border-teal/30 text-teal',
  empty:   'bg-pearl border-slate/20 text-slate',
}

5.2 src/middleware.ts — route protection
src/middleware.ts
export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/(app)/:path*',     // All authenticated app routes
    '/(staff)/:path*',   // Staff shift view
    '/api/((?!auth).*)', // All API routes except /api/auth/*
  ],
}

// Auth.js handles redirect to /login automatically for unauthenticated requests.
// Role-based access is enforced in each API route handler, not in middleware.

5.3 src/lib/animations.ts — all Framer Motion variants
src/lib/animations.ts
import { Variants } from 'framer-motion'

// Use useReducedMotion() in components and set duration: 0 when true

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16,1,0.3,1] } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
}

export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const listItem: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

export const cellHover = {
  whileHover: { scale: 1.04 },
  transition: { duration: 0.12 },
}

export const budgetBarVariants = {
  initial:  { scaleX: 0, originX: 0 },
  animate:  { scaleX: 1, transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 } },
}

6. Testing Structure
Test structure
__tests__/
├── unit/
│   ├── lib/
│   │   ├── cost.test.ts          # calcProjectedCost, calcCapUtilisation
│   │   ├── rota.test.ts          # applyPattern, detectGaps
│   │   ├── csv.test.ts           # generateSoftworksCSV format validation
│   │   └── utils.test.ts         # getPayPeriod, getDaysInPayPeriod
│   └── validations/
│       └── schemas.test.ts       # Zod schema edge cases
├── integration/
│   ├── api/
│   │   ├── rota.test.ts          # API route handlers with test DB
│   │   ├── leave.test.ts
│   │   └── staff.test.ts
│   └── db/
│       └── queries.test.ts       # Drizzle query functions
└── e2e/                          # Playwright (future — not MVP)
    └── rota-builder.spec.ts

7. Deployment
Config	Value	Notes
Domain	rota.alchemetryx.com	Vercel custom domain. SSL auto-configured.
Vercel region	lhr1 (London)	UK data residency requirement. Set in vercel.json.
Database region	eu-west-2 (Ireland)	Neon PostgreSQL. Closest to lhr1.
Branch → environment	main → production, dev → preview	Vercel auto-deploys on push.
Build command	next build	
Output	.next	
Node version	20.x	Set in .nvmrc and package.json engines field.
Environment variables	Set in Vercel dashboard	Never in vercel.json. Never committed.

vercel.json
// vercel.json
{
  "regions": ["lhr1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}


CareRota · Folder & File Architecture · v1.0 · Alchemetryx · May 2026
Internal document. Do not distribute outside the build team.

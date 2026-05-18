
CAREROTA · BUILD SPECIFICATION
Sprint-by-Sprint Build PRD
Exact implementation guide for each phase — what to build, how to build it, and in what order
v1.0 · Alchemetryx · May 2026 · For Claude Code and developer use

How to use this document
This document is the implementation companion to the MVP PRD and Architecture PRD.
It is written for Claude Code and the developer. Each section defines one sprint or phase.
Before starting any sprint: read CLAUDE.md, BRAND.md, and SKILLS.md in the repo root.
Before building any UI component: read the Architecture PRD for the correct file location.
Never build outside the defined file structure. Never skip the Claude.md context step.

 
Phase 0 — Foundation (Week 1-2)
Goal
Fresh repo. Auth working. Database connected. Brand applied. Maribel can log in.
Do NOT build any rota features in Phase 0. Foundation only.
Gate: manager can log in, reach the dashboard page (empty), and log out.

Sprint 0.1 — Repo setup (Day 1)
Task	Command / action	Done when
Initialise Next.js 15	npx create-next-app@latest carerota --typescript --tailwind --app --src-dir --import-alias "@/*"	Project runs locally
Install shadcn/ui	npx shadcn@latest init — select: style=default, base=neutral, CSS vars=yes	components.json created
Install core dependencies	npm i next-auth@beta drizzle-orm @neondatabase/serverless drizzle-kit @tanstack/react-query framer-motion @hello-pangea/dnd react-hook-form zod @hookform/resolvers date-fns recharts resend lucide-react clsx tailwind-merge class-variance-authority	package.json updated
Add shadcn components	npx shadcn@latest add button dialog popover select command badge card table input label textarea toast separator sheet dropdown-menu avatar skeleton tabs tooltip	src/components/ui/ populated
Create .env.local	Copy from .env.example. Fill all values.	App starts without env errors
Create CLAUDE.md	Paste master prompt from UX/UI prompt document	File exists at root
Create BRAND.md	Paste brand section from MVP PRD (Section 7.2 and 7.3)	File exists at root
Create SKILLS.md	Paste skills reference from UX/UI prompt document	File exists at root
Configure tailwind.config.ts	Add all brand tokens (midnight, pearl, gold, amethyst, teal, slate + fonts)	Tailwind classes work in browser
Create vercel.json	Set region: lhr1. Add security headers.	File exists at root
Deploy to Vercel	Connect GitHub repo. Set env vars. Deploy.	panel.alchemetryx.com loads

Sprint 0.2 — Database (Day 2)
Task	File	Done when
Configure Neon database	drizzle.config.ts	Connection string works
Create db client	src/lib/db.ts	neon() tagged template exported
Write all schemas	src/db/schema/*.ts	All 7 tables defined in Drizzle
Run first migration	npx drizzle-kit push	Tables exist in Neon dashboard
Seed shift codes	src/db/schema/shift-codes.ts + seed script	16 default shift codes in DB
Seed test home	Manual or seed script	One home row exists for development
Seed test floors	Manual or seed script	5 floors: King George, Union Jack, Thames, Office, Ancillary

Sprint 0.3 — Auth (Day 3-4)
Task	File	Done when
Configure Auth.js v5	src/lib/auth.ts	Credentials provider + Resend magic link provider configured
Create auth route handler	src/app/api/auth/[...nextauth]/route.ts	Route exists
Create login page	src/app/(auth)/login/page.tsx + src/components/auth/LoginForm.tsx	Manager can log in with email/password
Create magic link verify page	src/app/(auth)/verify-email/page.tsx	Magic link from email lands here and creates session
Create register page	src/app/(auth)/register/page.tsx + RegisterForm.tsx	New home manager can create account
Add middleware	middleware.ts at root	Unauthenticated requests to /app/* redirect to /login
Create app layout	src/app/(app)/layout.tsx	Authenticated layout shell exists (empty sidebar ok)
Create empty dashboard	src/app/(app)/dashboard/page.tsx	Logged-in user sees /dashboard (even if empty)
Test auth flow end to end	Manual test	Login → /dashboard → logout → redirected to /login

Sprint 0.4 — App shell (Day 5)
Task	File	Done when
Build Sidebar	src/components/layout/Sidebar.tsx	Nav links: Dashboard, Rota, Leave, Staff, Settings. Active state. Brand colors.
Build TopBar	src/components/layout/TopBar.tsx	Home name, user avatar dropdown, notifications bell (empty for now).
Build AppShell	src/components/layout/AppShell.tsx	Sidebar + TopBar + main content area. Responsive: sidebar collapses on mobile.
Wire layout	src/app/(app)/layout.tsx	Uses AppShell. All (app) routes get sidebar automatically.
Create constants	src/lib/constants.ts	All shift codes, floor names, pay period config, colours. Full file from Architecture PRD.
Create utils	src/lib/utils.ts	cn(), getPayPeriod(), getDaysInPayPeriod(), calcShiftHours(), isAbsenceCode().
Create animations	src/lib/animations.ts	All Framer Motion variants from Architecture PRD Section 5.3.
Create validations	src/lib/validations.ts	All Zod schemas — rota entry, leave request, staff, home settings.
Create all type files	src/types/*.ts	All TypeScript interfaces defined. No any types anywhere.

 
Phase 1 — Rota Builder (Week 3-8)
Goal
Maribel builds the June 2026 rota entirely in CareRota without touching Excel.
All five floor tabs work. Shift codes are correct. Cost dashboard shows live numbers.
Gate: Maribel publishes the rota. Staff can see their shifts. CSV export works.

Sprint 1.1 — Staff directory (Week 3)
Build the staff data foundation before the rota grid. The grid cannot render without staff records.

Task	Files	Acceptance criteria
Staff DB queries	src/db/queries/staff.ts	getStaffByHome(), createStaff(), updateStaff() all work
Staff API routes	src/app/api/staff/route.ts + [staffId]/route.ts	GET /api/staff returns staff grouped by floor. POST creates staff.
Staff hook	src/hooks/useStaff.ts	useStaff() returns staff list with TanStack Query caching.
StaffCard component	src/components/staff/StaffCard.tsx	Shows: name, role badge, FT/PT/Bank, contracted hours, floor, DBS expiry with warning flag if <30 days.
StaffDirectory component	src/components/staff/StaffDirectory.tsx	Grid of StaffCards. Filter by role, floor, type. Search by name.
StaffForm component	src/components/staff/StaffForm.tsx	react-hook-form + Zod. All staff fields. Validates on submit.
Staff pages	src/app/(app)/staff/page.tsx + new/page.tsx + [staffId]/page.tsx	Directory loads. Add staff form works. Staff profile shows.
Seed Marlborough Court staff	Seed script or manual	20+ realistic staff records across 5 floors. Real roles and hours from June 2026 Excel.

Sprint 1.2 — Rota grid core (Week 4-5)
This is the hardest sprint. The monthly rota grid with 125+ cells is the core product. Build it carefully.

Task	Files	Acceptance criteria
Rota DB queries	src/db/queries/rota.ts	getRotaForPeriod() returns all entries for a floor + pay period. upsertRotaEntry() creates or updates one cell.
Rota API — fetch	src/app/api/rota/route.ts	GET /api/rota?floorId=&month= returns entries. Auth required. home_id filter enforced.
Rota API — update cell	src/app/api/rota/[entryId]/route.ts	PATCH updates one cell. Logs to audit_log. Returns updated entry.
Rota API — bulk update	src/app/api/rota/bulk/route.ts	POST accepts array of cell updates. Used for drag-paint. Atomic transaction.
Rota hooks	src/hooks/useRota.ts	useRotaEntries() with optimistic updates. useUpdateRotaCell() mutates and optimistically updates cache.
PayPeriodNav	src/components/rota/PayPeriodNav.tsx	Shows current pay period dates (19th-18th). Prev/next navigation.
FloorTabs	src/components/rota/FloorTabs.tsx	5 tabs. Active floor highlighted with gold underline. Switching tabs loads that floor's data.
SectionHeader	src/components/rota/SectionHeader.tsx	Non-editable label rows. Dark midnight background. Uppercase. Between staff groups.
RotaCell	src/components/rota/RotaCell.tsx	Displays shift code with correct colour. Click opens ShiftCodePicker. Hover: gold focus ring. Optimistic update on select.
ShiftCodePicker	src/components/rota/ShiftCodePicker.tsx	shadcn Popover. Grid of shift code buttons. Colour-coded by category. Clear button. Keyboard navigable.
MonthlyRotaGrid	src/components/rota/MonthlyRotaGrid.tsx	125+ rows × 30 cols. Section headers between groups. Footer row with daily count. React.memo on cells. Renders in <2s.
RotaLegend	src/components/rota/RotaLegend.tsx	Colour-coded shift code legend at bottom of grid.
Rota page	src/app/(app)/rota/page.tsx	FloorTabs + PayPeriodNav + MonthlyRotaGrid renders. Data loads from API. Cell edits persist.

Sprint 1.3 — Cost dashboard (Week 6)
Task	Files	Acceptance criteria
Cost calculation logic	src/lib/cost.ts	calcProjectedCost(), calcBudgetedHours(), calcScheduledHours(), calcCostByRole(), calcCapUtilisation() — all pure functions, fully unit-tested.
Cost hook	src/hooks/useCost.ts	useProjectedCost() derives cost from rota entries in TanStack Query cache. Updates instantly when any cell changes.
CostBar component	src/components/rota/CostBar.tsx	Recharts progress bar. Green <85%, amber 85-99%, red ≥100%. Framer Motion fill animation on mount.
CostDashboard component	src/components/rota/CostDashboard.tsx	Right sidebar. Budgeted hours, scheduled hours, projected cost (£), cap, variance, utilisation bar, cost by role breakdown. Updates live as cells change. Framer Motion number spring animation.
Wire dashboard to rota page	src/app/(app)/rota/page.tsx	CostDashboard sidebar visible alongside MonthlyRotaGrid. Layout: grid takes ~75% width, sidebar takes ~25%.
Set budget cap for test home	DB seed / settings page stub	budgetCapMonthly is set. Cost dashboard shows a realistic cap figure.
Agency cost field	CostDashboard.tsx	Manual entry field for agency invoice total. Adds to projected cost in real time.

Sprint 1.4 — Pattern template (Week 6-7)
Task	Files	Acceptance criteria
Weekly pattern schema	src/db/schema/staff-patterns.ts	staff_patterns table: staffId, dayOfWeek (0-6), shiftCodeId. One row per staff per day.
PatternSetup component	src/components/rota/PatternSetup.tsx	Modal or sheet. 7-day week grid per staff member. Select shift code for each day. Save pattern.
applyPattern() function	src/lib/rota.ts	Takes staff[], patterns[], payPeriodDays[] → returns RotaEntry[]. Respects existing approved leave (does not overwrite AL cells).
Fill from pattern button	src/components/rota/RotaToolbar.tsx	"Fill from pattern" button. Opens confirmation dialog. Applies pattern to all cells not already set.
Clear and re-apply	Toolbar action	Manager can clear current month and re-apply patterns. Audit logged.

Sprint 1.5 — Drag-paint and publish (Week 7-8)
Task	Files	Acceptance criteria
Drag-paint across row	src/hooks/useRotaDrag.ts + RotaCell.tsx	Pointer-down on a cell, drag across row, pointer-up applies same code to all cells in range. Cells highlight amber during drag. Bulk API call on pointer-up.
Right-click context menu	RotaCell.tsx + shadcn DropdownMenu	Right-click: Copy cell code, Paste to selection, Clear cell. Standard browser context menu blocked.
detectGaps() and detectComplianceIssues()	src/lib/rota.ts	Returns: days with zero staff assigned per section, staff working >5 consecutive days, staff below contracted hours.
PublishReview component	src/components/rota/PublishReview.tsx	Modal before publish. Shows: coverage gaps by day, compliance flags, cost dashboard final state, confirm/cancel.
Rota publish API	src/app/api/rota/publish/route.ts	POST sets isPublished=true on all entries for the pay period. Creates audit log entry. Returns published rota summary.
RotaToolbar publish button	src/components/rota/RotaToolbar.tsx	Gold "Publish" button. Opens PublishReview modal. Disabled if no entries exist.
Draft/published status badge	RotaToolbar.tsx	Shows "Draft" or "Published" badge. Date/time of last publish.
Keyboard navigation on grid	MonthlyRotaGrid.tsx + RotaCell.tsx	Arrow keys navigate cells. Enter opens code picker. Escape closes picker. Focus ring visible.

 
Phase 2 — Leave Management (Week 9-12)
Goal
Zero paper leave forms. All requests submitted and approved digitally.
Approved leave auto-blocks the rota. Staff receive email confirmation.
Gate: Maribel processes one full month of leave requests without any paper.

Sprint 2.1 — Leave request flow (Week 9-10)
Task	Files	Acceptance criteria
Leave DB queries	src/db/queries/leave.ts	getLeaveRequests(), createLeaveRequest(), updateLeaveStatus(), getLeaveBalance() all work.
Leave API routes	src/app/api/leave/route.ts + [requestId]/route.ts	GET returns requests filtered by status. POST creates request. PATCH approves/declines.
Leave hooks	src/hooks/useLeave.ts	useLeaveRequests() with status filter. useCreateLeaveRequest(). useUpdateLeaveStatus().
LeaveRequestForm	src/components/leave/LeaveRequestForm.tsx	Staff-facing. Leave type select, date range picker, optional note. Zod validation. Submits to /api/leave.
LeaveRequestCard	src/components/leave/LeaveRequestCard.tsx	Single request. Staff name, type, dates, status badge. Approve/Decline buttons for managers. Framer Motion stagger on list.
LeaveRequestList	src/components/leave/LeaveRequestList.tsx	Tabbed: Pending | Approved | Declined | All. Count badges on tabs. Empty state with icon.
Leave management page	src/app/(app)/leave/page.tsx	LeaveRequestList renders. Manager can approve/decline from this page.
Leave notification email	src/lib/email.ts	On approval: Resend email to staff. On decline: email with manager's note. Template uses brand colors.

Sprint 2.2 — Leave-rota integration (Week 10-11)
Task	Files	Acceptance criteria
Auto-block rota on approval	src/app/api/leave/[requestId]/route.ts	When status changes to approved: for each day in date range, upsert rota_entry with shiftCode=AL for that staff member. Audit logged.
AL cell locking	src/components/rota/RotaCell.tsx	AL cells show lock icon on hover. Click opens tooltip: "Linked to approved leave — manage via Leave tab." Not editable directly.
LeaveCalendar	src/components/leave/LeaveCalendar.tsx	Calendar grid showing approved leave for all staff. Toggle overlay on rota grid.
LeaveBalance	src/components/leave/LeaveBalance.tsx	Per staff: contracted annual entitlement, days approved, days remaining. Shows in staff profile.
Leave history page	src/app/(app)/leave/[staffId]/page.tsx	All leave requests for one staff member. Timeline view.

Sprint 2.3 — Staff shift view (Week 11-12)
Task	Files	Acceptance criteria
Staff-facing layout	src/app/(staff)/layout.tsx	Minimal. No sidebar. Logo + sign out only. Mobile-first.
My shifts page	src/app/(staff)/my-shifts/page.tsx	Shows current and next month's shifts for the logged-in staff member. Large day tiles. Touch-friendly.
Leave request from staff view	LeaveRequestForm.tsx embedded in my-shifts	Staff can submit leave request directly from shift view. Confirmation screen after submit.
Magic link invite flow	src/app/api/staff/invite/route.ts + InviteStaffDialog.tsx	Manager sends invite. Staff receives email with magic link. Clicks link → session created → my-shifts page.
Mobile optimisation	src/app/(staff)/my-shifts/page.tsx	Large touch targets (min 44px). No horizontal scroll. Works on iPhone SE (375px width).
Notification — rota published	src/lib/email.ts	When rota published: email to all staff with shifts in that period. Lists their shifts for the month.
Notification — rota changed	src/lib/email.ts	When individual shift changes post-publish: email to affected staff member only.

 
Phase 3 — Export and Integration (Week 13-14)
Goal
Vrushali downloads one CSV and uses it for Softworks entry. Time <30 minutes.
Maribel can print a PDF rota for the noticeboard.
Gate: CSV passes Softworks import validation without errors.

Sprint 3.1 — CSV export (Week 13)
Task	Files	Acceptance criteria
generateSoftworksCSV() function	src/lib/csv.ts	Takes rota entries + staff data → CSV string. One row per staff per day. Columns: Staff Name, Date, Shift Code, Start Time, End Time, Hours, Floor. Pay period header row.
CSV export API route	src/app/api/export/csv/route.ts	POST with payPeriodStart + floorIds. Returns CSV file as download. Content-Disposition: attachment.
ExportCsvDialog	src/components/export/ExportCsvDialog.tsx	Select floors to include. Select pay period. Preview row count. Download button. Audit log on download.
Export centre page	src/app/(app)/export/page.tsx	ExportCsvDialog + ExportPdfDialog side by side.
Validate CSV format	Manual test with Vrushali	Vrushali imports CSV into Softworks. Zero import errors. Hours match rota grid.

Sprint 3.2 — PDF export (Week 13-14)
Task	Files	Acceptance criteria
PDF generation library	package: @react-pdf/renderer or puppeteer	Choose based on complexity. @react-pdf/renderer preferred for server-side React-based PDF.
Rota PDF template	src/lib/pdf.ts or src/components/export/RotaPdfTemplate.tsx	Monthly grid layout. One page per floor. Staff names on rows, dates on columns. Shift codes in cells with colour coding. Home name and pay period in header.
PDF export API route	src/app/api/export/pdf/route.ts	POST → returns PDF file as download.
ExportPdfDialog	src/components/export/ExportPdfDialog.tsx	Select floors. Preview. Download.

Sprint 3.3 — Reporting screen (Week 14)
Task	Files	Acceptance criteria
Staff hours report	src/app/(app)/export/page.tsx (new section)	Table: staff name, role, type, shifts count, total hours, contracted hours, variance. Export CSV button.
Cost summary report	Export page	Month-end cost: projected vs actual (if payroll data available), budget cap, variance, cost by role. Screenshot-ready for HQ presentation.
Budget adherence history	Export page	Simple table: last 3 months, projected cost, cap, under/over. This is the core HQ evidence artefact.

 
Phase 4 — Pilot Evidence and HQ Pitch (Week 15-16)
Goal
Maribel has a 3-month dataset in CareRota. She can walk the CEO through it.
The cost dashboard screenshot + time-saving numbers close the rollout conversation.
Gate: Maribel presents CareRota to Gold Care HQ. Commercial rollout terms entered.

Sprint 4.1 — HQ-ready dashboard (Week 15)
Task	Files	Acceptance criteria
Enhanced home dashboard	src/app/(app)/dashboard/page.tsx	KPI cards: active staff count, rota status (published/draft), pending leave requests, compliance alerts. Cost snapshot widget (current month vs cap). Budget adherence 3-month chart (Recharts). Quick actions.
3-month budget chart	src/components/dashboard/CostSnapshot.tsx	Bar chart: 3 months of projected cost vs cap. Recharts. Gold bars. Teal reference line at cap. Tooltip on hover.
Alerts feed	src/components/dashboard/AlertsFeed.tsx	DBS expiring <30 days, staffing gaps, compliance issues. Sorted by severity. Link to relevant page.
Settings page — home config	src/app/(app)/settings/page.tsx	Edit home name. Set budget cap. Set payroll start day. Configure floor names and codes.

Sprint 4.2 — Quality and polish (Week 16)
Task	Action	Done when
Accessibility audit	Run axe DevTools on all pages. Fix all critical and serious issues.	Zero critical/serious axe violations
Performance audit	Lighthouse on rota grid page. Target >85 performance score.	Rota grid renders in <2s on throttled connection
Mobile audit	Test staff shift view on iPhone SE (375px). Fix all layout issues.	No horizontal scroll. All touch targets ≥44px.
Error states	Add error boundaries. Add empty states to all list components.	No blank screens on API errors
Loading states	Add skeleton loaders to rota grid, staff directory, leave list.	No layout shift on data load (CLS <0.1)
Reduced motion	Add useReducedMotion() check to all Framer Motion components.	All animations disabled when prefers-reduced-motion is set
Audit log review	Verify every mutation is logged. Check log entries in DB.	Every cell change, approval, and publish has an audit record
GDPR retention check	Verify retention policy is documented. Add data deletion endpoint.	GDPR compliance documented in README
Security headers	Verify vercel.json headers are deployed.	Security headers present on all responses
End-to-end test with Maribel	Nimish facilitates live session. Maribel builds a real rota.	Maribel completes rota build without asking for help

 
Appendix A — Complete API Reference
All API routes. Auth required on all unless marked public. home_id enforced server-side on all queries.

Method	Route	Auth role	Description
GET	/api/rota	manager/admin	Fetch rota entries for floor + pay period
PATCH	/api/rota/[entryId]	manager	Update single rota cell. Audit logged.
POST	/api/rota/bulk	manager	Batch update multiple cells. Atomic.
POST	/api/rota/publish	manager	Publish draft rota. Notifies staff.
GET	/api/leave	manager/admin	Fetch leave requests. Filter by status.
POST	/api/leave	staff	Create leave request.
PATCH	/api/leave/[requestId]	manager	Approve or decline. Auto-blocks rota.
GET	/api/staff	manager/admin	Fetch staff list for home.
POST	/api/staff	manager	Create staff member.
GET	/api/staff/[staffId]	manager/admin	Fetch single staff member.
PATCH	/api/staff/[staffId]	manager	Update staff member.
POST	/api/staff/invite	manager	Send magic link invite email.
GET	/api/floors	manager/admin	Fetch floor config for home.
PATCH	/api/floors	manager	Update floor names/codes.
POST	/api/export/csv	manager/admin	Generate Softworks CSV. Returns file.
POST	/api/export/pdf	manager/admin	Generate rota PDF. Returns file.
GET	/api/auth/[...nextauth]	public	Auth.js route handler.

Appendix B — Coding Standards for Claude Code
Read this before every Claude Code session
These rules are non-negotiable. If Claude Code violates any of them, correct it before continuing.

B.1 TypeScript rules
•	No any types. Ever. Use unknown and narrow, or define the correct type.
•	No type assertions (as Type) unless absolutely unavoidable. Add a comment explaining why.
•	All API route handlers: explicitly type the Request parameter and return Response.
•	All Drizzle query functions: return type must be explicitly declared.
•	All React components: define Props interface above the component. Never inline in function signature.

B.2 Component rules
•	No business logic in components. Components receive data via props or hooks. They do not call DB.
•	All data fetching in hooks (src/hooks/). Never fetch directly in a component.
•	All mutations use TanStack Query useMutation() with optimistic updates on the rota grid.
•	All forms use react-hook-form with Zod resolver. No uncontrolled inputs.
•	All modals use shadcn Dialog or Sheet. No custom modal implementations.
•	No inline styles. Tailwind classes only. No raw hex values. Brand tokens only.
•	No emoji as icons. Lucide React only. Import individual icons, not the full library.

B.3 API route rules
•	Every route handler: verify session exists. Verify user's home_id matches the requested resource.
•	Every mutation route: call logAction() from src/lib/audit.ts before returning response.
•	Every route: validate request body against Zod schema from src/lib/validations.ts.
•	Never expose internal error messages to the client. Log server-side, return generic message.
•	All routes return consistent shape: { data: T } on success, { error: string } on failure.

B.4 Database rules
•	Never write raw SQL. All queries go through Drizzle query functions in src/db/queries/.
•	Never UPDATE or DELETE from audit_log. Append only. Enforced in the query function.
•	All queries filter by homeId. No query should ever return data from another home.
•	All migrations via drizzle-kit. Never alter tables manually in the Neon console.
•	Use transactions for operations that touch multiple tables (e.g. approve leave + block rota).

B.5 File naming
Type	Convention	Example
React components	PascalCase.tsx	MonthlyRotaGrid.tsx, StaffCard.tsx
Hooks	camelCase.ts starting with use	useRota.ts, useCost.ts
Lib / utils	camelCase.ts	cost.ts, rota.ts, animations.ts
DB schemas	kebab-case.ts	rota-entries.ts, leave-requests.ts
DB queries	kebab-case.ts matching schema	rota.ts, leave.ts, staff.ts
API route files	Always route.ts	src/app/api/rota/route.ts
Page files	Always page.tsx	src/app/(app)/rota/page.tsx
Type files	kebab-case.ts	src/types/rota.ts, src/types/cost.ts


CareRota · Sprint-by-Sprint Build PRD · v1.0 · Alchemetryx · May 2026
Internal build document. Read CLAUDE.md, BRAND.md, and SKILLS.md before every coding session.

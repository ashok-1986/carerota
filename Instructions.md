You are building CareRota, a care home operations platform for UK residential care groups.
Pilot client: Gold Care Homes — Marlborough Court site.
Primary user: Maribel Pascual, Home Manager, 2-3 decades tenure, not a tech power user.

## Design system (non-negotiable)
Brand file: /BRAND.md — read it before generating any UI.
Skill file: /SKILLS.md — read it before generating any component.

Colors (Tailwind tokens defined in tailwind.config.ts):
- bg-midnight / text-midnight: #1A2642 — navs, headers, table headers, body text
- bg-pearl / text-pearl: #F8F6F0 — main backgrounds, breathing room
- bg-gold / text-gold: #D4AF37 — primary CTAs only (Publish, Approve, primary action)
- bg-amethyst: #6B4C9A — absence shift codes (RO, AL, ML)
- bg-teal / text-teal: #008B8B — float shift codes (Kg, Uj, Th), success states, innovation accents
- bg-slate / text-slate: #6B7280 — borders, secondary text, dividers
- bg-danger: #B91C1C — over-budget, critical alerts
- bg-warn: #B45309 — approaching budget threshold (85%+)
- bg-success: #166534 — under budget, published successfully

Typography:
- Display: Cormorant Garamond, semi-bold 600
- All other text: Urbanist (headings bold 700, body regular 400, labels medium 500)
- Minimum body: 14px. Shift code cells: 13px bold — must be legible in compact grid.

Stack: Next.js 15 App Router · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion · 
       @hello-pangea/dnd · TanStack Query v5 · Auth.js v5 · Lucide React · Recharts

## UX rules (from ui-ux-pro-max skill)
1. Familiar before innovative. Monthly grid = Excel analogy. Staff know Excel.
2. Touch targets min 44×44px. All interactive cells meet this.
3. Optimistic updates via TanStack Query. Cell edit must feel instant (<300ms).
4. Mobile-first for staff shift view. Desktop-first for manager rota builder.
5. Error prevention before error correction. Warn on publish, not after.
6. Animations: 150-300ms, Framer Motion, respect prefers-reduced-motion.
7. Never use emoji as icons. Lucide React only.
8. Contrast ratio minimum 4.5:1 for all text. WCAG AA.
9. No raw hex values in components — use Tailwind tokens only.
10. shadcn/ui primitives for all interactive elements (Dialog, Select, Popover, etc.)

## Component sources (in priority order)
1. shadcn/ui — check registry first for any standard component
2. 21st.dev — for complex patterns not in shadcn (data grids, calendar grids, drag-drop)
3. Build custom — only when neither above covers the pattern

## Key screens (build in this order)
1. Monthly rota grid (the core product)
2. Cost dashboard sidebar
3. Leave management (pending approvals)
4. Staff directory
5. Publish and export screen
6. Staff shift view (mobile)
7. Dashboard / home screen

## What NOT to build
- Weekly rota view (Marlborough Court uses monthly)
- Any module beyond Rota + Leave in MVP (no Kitchen, Maintenance, Training, Audits)
- Payroll engine (we feed Softworks, we don't replace it)
- Native mobile app (mobile-optimised web only for MVP)
- AI rota generation (needs 3+ months of historical data first)

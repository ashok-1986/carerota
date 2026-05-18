# CareRota Brand System

Single source of truth for all visual decisions.
Read this before generating any UI component.

## Colors — Tailwind tokens (defined in tailwind.config.ts)

Primary (70% of design):
- midnight (#1A2642) — navs, headers, table headers, body text, primary backgrounds
- pearl (#F8F6F0) — main app background, card backgrounds, breathing room

Accent (20% of design):
- gold (#D4AF37) — PRIMARY CTAs ONLY (Publish, Approve, Submit)
  Rule: Use sparingly. One gold element per screen maximum.
  Never use for secondary buttons, borders, or decorative elements.

Secondary (10% of design):
- amethyst (#6B4C9A) — absence shift codes (RO, AL, ML), secondary accents
- teal (#008B8B) — float codes (Kg, Uj, Th), success states, under-budget
- slate (#6B7280) — borders, dividers, secondary text, captions

Semantic:
- danger (#B91C1C) — over budget, errors, critical alerts
- warn (#B45309) — approaching threshold (85%+), warnings
- success (#166534) — published successfully, confirmed states

## Shift code cell colors (Tailwind classes)
- Work shifts (LD, N, E, L, Su, 1-1): bg-blue-50 border-blue-200 text-midnight
- Absence (RO, AL, ML): bg-amethyst/10 border-amethyst/30 text-amethyst
- Float (Kg, Uj, Th): bg-teal/10 border-teal/30 text-teal
- Empty cell: bg-pearl border-slate/20 text-slate/40

## Typography
Display only: Cormorant Garamond, Semi-bold 600
  Used for: hero text, marketing, large feature callouts only

All UI text: Urbanist
  - Bold 700: headings H1-H3
  - Semi-bold 600: H4, nav items, button labels
  - Medium 500: labels, badges, metadata
  - Regular 400: body text, descriptions

Minimum sizes:
  - Body text: 14px minimum
  - Labels/badges: 12px minimum
  - Shift code cells: 13px bold (must be legible in compact grid)

Never: Mix Cormorant Garamond into UI components.
       Use any other font family.

## Component rules
- All interactive elements: shadcn/ui primitives
- Focus rings: 2px gold (#D4AF37) offset
- Border radius: follow shadcn defaults (rounded-md for most)
- Shadows: subtle only — shadow-sm for cards, shadow-md for modals
- Never: more than 3 colors on one screen
- Never: emoji as icons — Lucide React only
- Never: hardcoded hex values in components — Tailwind tokens only

## Layout
- Sidebar: bg-midnight, text white, gold active indicator
- Top bar: bg-white, border-b border-slate/20
- Main content: bg-pearl
- Cards: bg-white, border border-slate/20, shadow-sm
- Table headers: bg-midnight text-white
- Table rows: alternating bg-white / bg-slate/5

## Animation rules (see src/lib/animations.ts for variants)
- Duration: 150-300ms for UI feedback
- Duration: 400ms max for page transitions
- Never animate width/height (use scaleX/scaleY)
- Always: check useReducedMotion() and set duration 0 if true
- Gold utilisation bar: animate scaleX from 0 on mount, 800ms ease-out

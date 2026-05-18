This is the single source of truth for all visual decisions in CareRota. Read this before generating any UI component.

## Colors (Tailwind tokens defined in tailwind.config.ts):
- bg-midnight / text-midnight: #1A2642 — navs, headers, table headers, body text
- bg-pearl / text-pearl: #F8F6F0 — main backgrounds, breathing room
- bg-gold / text-gold: #D4AF37 — primary CTAs only (Publish, Approve, primary action)
- bg-amethyst: #6B4C9A — absence shift codes (RO, AL, ML)
- bg-teal / text-teal: #008B8B — float shift codes (Kg, Uj, Th), success states, innovation accents
- bg-slate / text-slate: #6B7280 — borders, secondary text, dividers
- bg-danger: #B91C1C — over-budget, critical alerts
- bg-warn: #B45309 — approaching budget threshold (85%+)
- bg-success: #166534 — under budget, published successfully

## Typography:
- Display: Cormorant Garamond, semi-bold 600
- All other text: Urbanist (headings bold 700, body regular 400, labels medium 500)
- Minimum body: 14px. Shift code cells: 13px bold — must be legible in compact grid.

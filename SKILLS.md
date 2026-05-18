# CareRota — AI Skills and Component Sources

## UI/UX
Skill: ui-ux-pro-max
Apply for: all design decisions, component creation, layout, animations,
           accessibility review, colour decisions, typography choices.

Priority rules from skill:
1. Accessibility CRITICAL — contrast 4.5:1, keyboard nav, aria-labels
2. Touch targets CRITICAL — min 44×44px, 8px+ spacing
3. Performance HIGH — optimistic updates, lazy loading, CLS <0.1
4. Animation MEDIUM — 150-300ms, respect prefers-reduced-motion
5. Forms MEDIUM — visible labels, error near field, progressive disclosure

## Component sources (use in this order)
1. shadcn/ui — standard components (Button, Dialog, Popover, Select, 
               Command, Badge, Card, Table, Input, Label, Textarea,
               Toast, Sheet, DropdownMenu, Avatar, Skeleton, Tabs, Tooltip)
2. 21st.dev — complex patterns not in shadcn:
              - Data grids with sticky headers
              - Calendar/grid layouts
              - Approval workflow lists
              - Drag-and-drop interfaces
3. Build custom — only when neither above covers the pattern

## Animation library
File: src/lib/animations.ts — ALL Framer Motion variants live here.
Import from this file. Never define inline animation variants in components.
Available: pageVariants, modalVariants, slideInRight, staggerContainer,
           listItem, cellHover, budgetBarVariants

## Key complex components and their patterns
MonthlyRotaGrid:
  - React.memo on RotaCell for performance (125+ instances)
  - TanStack Query optimistic updates on cell mutations
  - @hello-pangea/dnd for drag-paint across rows
  - shadcn Popover for shift code picker
  - Keyboard nav: arrow keys + Enter + Escape

CostDashboard:
  - Recharts for utilisation bar and cost breakdown
  - Framer Motion useSpring for number animations
  - Updates derived from TanStack Query cache (no separate fetch)

LeaveRequestList:
  - shadcn Tabs for Pending/Approved/Declined
  - Framer Motion staggerContainer + listItem for card entrance
  - shadcn Dialog for approve/decline confirmation

## MCP servers available
- Vercel: deployment status, logs, environment variables
- GitHub: code review, PR management
- Neon/Supabase: database queries during development

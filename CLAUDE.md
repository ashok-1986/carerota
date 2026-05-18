@AGENTS.md

## Git workflow
Branch strategy: main (production) → dev (staging) → feature/* (development)
Never commit directly to main.
Every feature branch gets a Vercel preview URL automatically on push.
Commit message format: type(scope): description
Types: feat, fix, chore, refactor, test, docs
Examples:
  feat(rota): add monthly grid with shift code picker
  fix(leave): approve button not blocking rota cells
  chore(deps): update next to 15.2.1
  refactor(cost): extract calcProjectedCost into lib/cost.ts

Before committing: run npm run build locally to catch TypeScript errors.
Never commit: .env.local, node_modules, .next, coverage

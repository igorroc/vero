# Vero Architecture

## Overview

Vero uses Next.js App Router with domain-oriented Server Actions. Financial calculations are isolated in deterministic engines so they can be tested without database or interface dependencies.

## Layers

```text
src/
  app/                 Routes, layouts, and thin server pages
    (app)/             Authenticated product routes
    api/               Route handlers, including Stripe webhook
    auth/              Authentication routes
  components/          Reusable interface components
  features/            Server Actions and domain orchestration
    accounts/          Account balances and statements
    billing/           Billing, subscriptions, and access resolution
    budgets/           Budgets and budget reports
    cashflow/          Cash-flow data assembly
    categories/        Category management
    debts/             Debt plans and payments
    events/            Financial events and transfers
    investments/       Investment plans and net-worth goals
    notifications/     In-app notifications
  lib/
    engines/           Pure financial calculation engines
    auth.ts            Session and authentication helpers
    db.ts              Prisma client
  stores/              Client state for forms and filters
  types/               Shared types and finance/date utilities
prisma/
  schema/              Prisma schema modules composed by schema.prisma
  migrations/          Existing database migrations
```

## Boundaries

- `app/` defines routes and should keep data orchestration minimal.
- `components/` handles rendering and browser interaction. It does not access Prisma directly.
- `features/` owns authenticated reads, mutations, and domain validation.
- `lib/engines/` contains pure calculations with no UI, session, or database access.
- `prisma/schema/` is the only source for schema changes.

## Financial invariants

- Persisted monetary amounts are integer cents.
- Confirmed events affect account balances; planned events affect projections only; skipped events affect neither.
- Income is positive; expenses and investments are negative.
- An account balance is its initial balance plus confirmed events for that account.
- All data reads and mutations are scoped to the authenticated user.

## Validation

Run the following after code changes:

```bash
bun run ts-check
bun test
bun run build
```

For Prisma schema changes, also run `bun run generate`. Database migration creation and application follow the repository guidance in `AGENTS.md`.

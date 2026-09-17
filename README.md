# Vero

Vero is a future-oriented personal financial planning platform. It organizes accounts and transactions, projects cash flow, and helps users determine how much they can safely spend.

## Current capabilities

- Dashboard with consolidated balance, projections, alerts, and spending limit.
- Bank, cash, and investment accounts, plus transfers between accounts.
- Planned, confirmed, and skipped transactions with categories and editing.
- Cash-flow timelines for 30, 60, or 90 days.
- Category budgets and budget/spending reports.
- Debts, installments, and payments.
- Net-worth goals and investment plans.
- Session-based authentication, safety-buffer, and planning-horizon settings.
- Stripe subscription foundation, commercial catalog, and an initial Super Admin panel.

See [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md) for business rules and known limitations. Monetization specification and delivery status are in [docs/monetizacao](docs/monetizacao).

## Stack

- Next.js 16, React 18, and TypeScript.
- PostgreSQL and Prisma.
- NextUI, Tailwind CSS, Lucide, and Recharts.
- Domain-based Server Actions and pure financial engines tested with Vitest.

## Prerequisites

- Bun.
- Docker and Docker Compose for local PostgreSQL.

## Quick start

1. Install dependencies:

```bash
bun install
```

2. Create `.env` from `.env.example` and provide local credentials. Stripe variables are only needed for billing.

3. Start the database:

```bash
bun run compose:up
```

4. Apply existing migrations and generate Prisma Client:

```bash
bun run migrate
```

5. Start the application:

```bash
bun run dev
```

Open `http://localhost:3000`.

## Validation

```bash
bun run ts-check
bun test
bun run build
```

## Structure

```text
src/
  app/          App Router routes and pages
  components/   UI components
  features/     Server Actions and domain rules
  lib/engines/  Pure financial engines
  lib/          Shared infrastructure
  types/        Financial types and utilities
prisma/schema/  Prisma schema split by domain
docs/           Product, feature, and monetization docs
```

Contribution and architecture guidance is available in `AGENTS.md` and [ARCHITECTURE.md](ARCHITECTURE.md).

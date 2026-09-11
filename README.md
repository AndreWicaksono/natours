<div align="center">
<img src="./public/logo_green_with_text_2x.svg" alt="Natours Logo" width="300" height="60" />
<p><strong>Modern Tour Booking Platform · Monorepo · Marketplace Architecture</strong></p>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe%20Connect-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/connect)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.10.3-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)

[![Node.js](https://img.shields.io/badge/Node.js-24.18.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-11.16.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10.12.2-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![corepack](https://img.shields.io/badge/corepack-0.35.0-00B4D8?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/api/corepack.html)
[![Stripe CLI](https://img.shields.io/badge/Stripe%20CLI-1.43.6-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

---

## 📖 Overview

**Natours** is a modern tour booking marketplace that connects **tour operators (Partners)** with **travellers (Customers)**. The platform enables partners to list their tours, manage availability, and receive payouts seamlessly — while customers can discover, book, and pay for unforgettable experiences.

This repository is a **monorepo** built with **Turborepo** and **pnpm workspaces**, containing the full-stack application:

- **Customer Experience (CX) Web** – built with Next.js
- **Internal Dashboard** – React Admin dashboard for partners and admins
- **Backend API** – NestJS with Prisma ORM
- **Database** – Supabase PostgreSQL
- **Payments** – Stripe Connect marketplace integration

---

## 🧭 Core Business Model

### The Marketplace

Natours operates as a **two-sided marketplace**:

| Role          | Who They Are                                      | What They Do                                                     |
| ------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| **Partners**  | Tour operators, local guides, adventure companies | Create tours, set availability, manage bookings, receive payouts |
| **Customers** | Travellers looking for unique experiences         | Browse tours, book experiences, pay securely                     |

### How the Platform Makes Money

The platform charges a **configurable commission (default: 10%)** on every booking. When a customer pays for a tour:

1. The **full payment** is collected by the platform.
2. **Platform commission** is deducted automatically.
3. The **remaining amount** is transferred to the partner's Stripe Connect account.
4. Partners receive payouts directly to their bank account.

This model keeps the platform aligned with partner success — when partners earn more, the platform earns more.

---

## 🔄 Core User Flow

```mermaid
graph TD
A[Customer browses tours] --> B[Customer selects a tour & date]
B --> C[Customer books & pays via Stripe]
C --> D[Platform confirms booking]
D --> E[Seats are reserved]
E --> F[Stripe splits payment]
F --> G[Partner receives net amount]
G --> H[Partner's dashboard updates]
H --> I[Customer receives confirmation]
I --> J[Customer checks in on tour start date]
J --> K[Tour status becomes ONGOING]
K --> L[Tour ends → status becomes COMPLETED]
L --> M[Customer can leave a review]
D --> N[No check-in after start date]
N --> O[Status becomes NO_SHOW]
```

### Detailed Flow

| Step | Actor    | Action                                                                | System Response                                                  |
| :--- | :------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| 1    | Partner  | Creates a tour with availability rules                                | Tour is published and visible to customers                       |
| 2    | Partner  | Completes Stripe Connect onboarding                                   | Partner can now receive payouts                                  |
| 3    | Customer | Browses tours and selects a date/time                                 | Availability endpoint validates rules & exceptions               |
| 4    | Customer | Books the tour and pays                                               | Booking is created (status: `PENDING`), Stripe session generated |
| 5    | Customer | Completes payment on Stripe                                           | Webhook confirms payment, booking becomes `CONFIRMED`            |
| 6    | Platform | Calculates commission and splits payment                              | `PlatformTransfer` record created                                |
| 7    | Customer | Checks in on the tour start date (via `PATCH /bookings/:id/check-in`) | Booking becomes `ONGOING`                                        |
| 8    | System   | Auto-transition via cron job after tour ends                          | `ONGOING` → `COMPLETED`                                          |
| 9    | System   | Auto-transition via cron job if no check-in after start date          | `CONFIRMED` → `NO_SHOW`                                          |
| 10   | Customer | Leaves a review for the completed tour                                | Review is stored and average rating updated                      |
| 11   | Partner  | Views earnings and transfers in dashboard                             | Partner can see all transactions and feedback                    |

---

### Booking Status Lifecycle

```text
PENDING
   │ (payment confirmed)
   ▼
CONFIRMED
   │ (tour start date/time arrives)
   ├──────────────────────────────────────┐
   │ (customer checks in manually)        │ (no check-in, cron job runs)
   ▼                                      ▼
ONGOING                                 NO_SHOW
   │ (tour end date/time passes)
   ▼
COMPLETED
```

## 🏗️ Architecture

### Monorepo Structure

```text
natours/
├── apps/
│   ├── api/                    # NestJS backend (REST API)
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── filters/        # Exception filters
│   │   │   └── pipes/          # Validation pipes
│   │   └── package.json
│   └── internal-dashboard/     # React admin dashboard
│       ├── src/
│       ├── public/
│       └── package.json
├── packages/                   # Shared packages (types, utilities)
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
├── supabase/                   # Supabase migrations & Edge Functions
│   ├── migrations/             # SQL migrations
│   └── functions/              # Edge Functions
├── package.json                # Root package.json (pnpm workspaces)
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turborepo pipeline
└── logo.svg                    # Natours logo
```

### Technology Stack

| Layer             | Technology          | Purpose                                                      |
| ----------------- | ------------------- | ------------------------------------------------------------ |
| **API Framework** | NestJS 11           | Backend REST API with dependency injection                   |
| **ORM**           | Prisma 7            | Type-safe database access with native PostgreSQL connections |
| **Database**      | Supabase PostgreSQL | Cloud-hosted PostgreSQL with Auth & Storage                  |
| **Payments**      | Stripe Connect      | Marketplace payment splitting & payouts                      |
| **Auth**          | Supabase Auth (JWT) | User authentication with JWKS (ES256)                        |
| **Frontend**      | Next.js / React     | Customer-facing web experience                               |
| **Admin UI**      | React Admin         | Dashboard for partners & admins                              |
| **Monorepo**      | Turborepo + pnpm    | Fast builds, shared dependencies                             |

### Key Design Decisions

| Decision                                     | Why                                                                                                                                                                                     |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Separate API from Frontend**               | Allows independent scaling, mobile app support, and third-party API access.                                                                                                             |
| **Supabase Auth + NestJS JWT**               | Supabase handles user management; NestJS validates tokens locally (no network call).                                                                                                    |
| **Native PostgreSQL (Prisma) over HTTP API** | Lower latency (~55ms vs ~120ms) for database operations.                                                                                                                                |
| **Stripe Connect**                           | Industry-standard for marketplace payments; handles KYC, onboarding, and payouts.                                                                                                       |
| **RLS Bypass**                               | NestJS uses `service_role` key, bypassing RLS — all authorization logic is in the application layer.                                                                                    |
| **On-demand Tour Schedules**                 | `tour_schedules` are created only when the first booking is made, avoiding database bloat.                                                                                              |
| **Check-in for attendance tracking**         | `CONFIRMED` → `ONGOING` requires manual check-in; auto `NO_SHOW` if no check-in after start date. Provides accurate attendance data and enables post-tour actions (reviews, analytics). |

---

## 🔐 Stripe Connect Marketplace Integration

Natours uses **Stripe Connect Express accounts** to enable seamless payments between customers, partners, and the platform.

### Onboarding Flow

1. **Partner requests onboarding** → `POST /partners/:id/onboarding`
2. **Platform creates Express account** → Stripe Account API
3. **Partner receives onboarding link** → Account Link API
4. **Partner completes onboarding** → Stripe handles KYC + bank account collection
5. **Webhook updates status** → `account.updated` event sets `stripe_onboarding_status = 'active'`

### Payment Splitting Flow

1. **Customer books a tour** → Booking is created (`PENDING`)
2. **Stripe Checkout session created** with:
   - `application_fee_amount` → platform commission (e.g., 10%)
   - `transfer_data.destination` → partner's Stripe Connect account
   - `transfer_group: booking_${id}` → links transfer to booking
3. **Customer pays** → Stripe processes payment
4. **Webhook `checkout.session.completed`**:
   - Confirms booking (`status = CONFIRMED`)
   - Updates payment (`status = SUCCEEDED`)
   - Creates `PlatformTransfer` record (gross, fee, net)
5. **Webhook `transfer.created`**:
   - Updates `stripe_transfer_id` from `'pending'` to the actual transfer ID

### Database Tracking

The `billing.platform_transfers` table tracks every financial transaction:

| Column               | Description                             |
| -------------------- | --------------------------------------- |
| `gross_amount`       | Total amount paid by customer           |
| `platform_fee`       | Commission earned by the platform       |
| `net_amount`         | Amount transferred to the partner       |
| `stripe_transfer_id` | Stripe transfer ID (for reconciliation) |
| `status`             | `PENDING` / `SUCCEEDED` / `FAILED`      |

---

## 🗄️ Database Schema

### Core Tables

| Schema    | Table                     | Purpose                                                                                                               |
| --------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `tour`    | `partners`                | Tour operators / companies                                                                                            |
| `tour`    | `tours`                   | Tour listings (name, price, difficulty, description)                                                                  |
| `tour`    | `availability_rules`      | Recurring availability (days of week, date range, start time)                                                         |
| `tour`    | `availability_exceptions` | Blackout dates (overrides rules)                                                                                      |
| `tour`    | `tour_schedules`          | Created on-demand (seats available per departure)                                                                     |
| `tour`    | `bookings`                | Customer reservations with status (`PENDING`, `CONFIRMED`, `ONGOING`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW`) |
| `tour`    | `reviews`                 | Customer reviews and ratings                                                                                          |
| `account` | `profiles`                | User profiles with roles (`CUSTOMER`, `GUIDE`, `PARTNER_ADMIN`, `ADMIN`)                                              |
| `billing` | `payments`                | Payment records (Stripe session ID, status)                                                                           |
| `billing` | `platform_transfers`      | Financial tracking for Stripe Connect splits                                                                          |
| `billing` | `stripe_webhook_events`   | Idempotency tracking for webhooks                                                                                     |

### Enums

| Enum              | Values                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| `app_role`        | `CUSTOMER`, `GUIDE`, `LEAD_GUIDE`, `ADMIN`, `PARTNER_ADMIN`                       |
| `booking_status`  | `PENDING`, `CONFIRMED`, `ONGOING`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW` |
| `tour_difficulty` | `EASY`, `MEDIUM`, `DIFFICULT`                                                     |
| `tour_status`     | `COMING_SOON`, `DRAFT`, `LIVE`                                                    |
| `TransferStatus`  | `PENDING`, `SUCCEEDED`, `FAILED`                                                  |

---

## 🚀 Getting Started (Development)

### Prerequisites

- **NixOS** (recommended) – the project uses a Nix shell for reproducible tooling
- Or any Linux/macOS with `pnpm`, `Node.js 24+`, `Docker` (for Supabase local)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/AndreWicaksono/natours.git
cd natours

# Enter the Nix development shell (if using NixOS)
nix develop ~/nix-config#natours

# Install dependencies
pnpm install

# Start the development server
pnpm turbo dev
```

### Environment Variables

Create `apps/api/.env` with:

```bash
# Database — points at LOCAL Supabase for day-to-day development.
# This is what `pnpm turbo dev` and `prisma migrate dev` use. Get the
# exact value from `supabase status` after `supabase start` (see
# "Local Development Environment" below) — don't hardcode the default
# shown here without checking, it can vary by config.
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Shadow database — used by `prisma migrate dev`/`migrate diff --from-migrations`
# to compute schema diffs. Also points at local Supabase — see "Local
# Development Environment" below for what this is and why it's separate
# from DATABASE_URL even though both point at the same local instance.
DATABASE_SHADOW_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SIGNING_SECRET="whsec_..."
STRIPE_RESTRICTED_API_KEY="rk_test_..."

# Application
PLATFORM_FEE_PERCENTAGE=10
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

> **The live Supabase project's connection string never lives in `.env`.** It's only ever supplied transiently, inline, for the one command that's supposed to touch it — `DATABASE_URL="<live pooler URL>" npx prisma migrate deploy` — or as a platform-injected secret (Render/Railway env var) when the deployed API itself runs in production. Keeping it out of `.env` entirely makes "accidentally ran a dev command against production" structurally harder to do by mistake.

> **Note on Prisma 7 + `.env`**: Prisma 7's CLI no longer auto-loads `.env` files (this changed from Prisma 6). `apps/api/prisma.config.ts` loads it explicitly via `dotenv`, anchored to its own directory with `path.resolve(__dirname, '.env')` — this matters in a monorepo, since a bare `import 'dotenv/config'` resolves relative to whatever directory a command happens to be invoked from, not to `apps/api/`. Make sure `dotenv` is listed in `apps/api/package.json`'s `devDependencies`.

### Setting Up the Database

All schema development happens against **local Supabase**, never the hosted project directly (see "Database Migration" below for why).

```bash
# Start the local Supabase stack (Postgres + Auth + Storage, via Docker)
pnpm --filter natours-backend start   # runs `supabase start`

# Note the local DB URL it prints and put it in apps/api/.env as
# DATABASE_SHADOW_URL (see "Environment Variables" above)

cd apps/api

# Apply the full tracked migration history to the fresh local database
npx prisma migrate deploy

# Generate the Prisma Client
npx prisma generate
```

`prisma db push` still has a place for quick throwaway prototyping (see the Troubleshooting section below), but the default path for anything you intend to keep is `migrate dev`/`migrate deploy` against local Supabase.

---

## 🧩 Local Development Environment

If you're newer to backend work: this section explains two ideas that don't really have an equivalent in frontend development — "local Supabase" and the "shadow database" — because there's no direct frontend parallel to "a whole database server running on your own machine." Both exist purely to let you break things safely, over and over, without any risk to real data.

### What "local Supabase" actually is

`supabase start` runs Supabase's own Docker images on your machine: Postgres, plus the same Auth (`GoTrue`) and Storage services the hosted project runs, pre-loaded with Supabase's own system schemas (`auth`, `storage`, `realtime`) exactly as a fresh hosted project would have them. It is **not** a copy or sync of the live project — it's always a clean baseline, rebuilt from scratch by `supabase db reset`. Your own tables only exist in it once Prisma's migrations have been replayed into it.

**One precision worth being exact about**: this is _your own developer's world_, isolated from teammates and from production — but by default it's **one instance you reuse across every feature you work on, sequentially**, not a fresh, automatically-isolated copy spun up per feature branch. If you switch from Feature A to Feature B and they have different pending migration files, your one local instance needs to be reset/rebuilt to match whichever branch you currently have checked out — you can't have both branches' local database states available side-by-side for free. (If you ever need that — genuinely working two features in parallel — the pattern is running a separate local database per branch, e.g. distinguished by database name or port, with `DATABASE_URL` swapped per branch; not something this project needs yet, but worth knowing it exists.)

|                                    | Local Supabase                        | Live/hosted Supabase project                                                           |
| :--------------------------------- | :------------------------------------ | :------------------------------------------------------------------------------------- |
| **Purpose**                        | Day-to-day development and testing    | Deploy target only                                                                     |
| **Data**                           | Disposable — wiped and rebuilt freely | Real, persistent project state                                                         |
| **Who can `CREATE`/`DROP` freely** | `postgres` role, full control         | Restricted — `postgres` isn't the true superuser (`supabase_auth_admin` owns `auth.*`) |
| **Schema changes made how**        | `prisma migrate dev` while iterating  | `prisma migrate deploy` only, applying already-tested migrations                       |
| **Safe to reset/break**            | Yes, constantly                       | Never                                                                                  |

### What a shadow database is, and why Prisma needs one

**What**: a second, temporary Postgres database that Prisma Migrate creates behind the scenes purely to _compute_ a migration diff — it's never used to store real application data, and your NestJS app never connects to it. Think of it like a scratchpad or a draft: when Prisma wants to answer "if I apply these SQL files in order, what will the database end up looking like?", it doesn't guess — it actually builds a real, disposable copy, applies the SQL for real, looks at the result, then throws the copy away. The shadow database is that disposable copy.

**Why it's needed**: to know what your schema will look like _after_ applying a set of migrations, Prisma can't just read the SQL files and reason about them abstractly — SQL's actual effects (a column type change, an enum value addition, a constraint) depend on Postgres actually executing it. So `prisma migrate dev` and `prisma migrate diff --from-migrations` replay your entire migration history against a real, throwaway Postgres database, inspect the resulting structure, and diff _that_ against `schema.prisma` — that replayed copy is the shadow database. Without one, most of Migrate's commands can't run at all (this is exactly the class of `P3018`/`P1000` errors in the table below).

**Why it has to be local, not a second hosted Supabase project**: creating/dropping a database is exactly the kind of privileged operation Supabase's pooler intentionally restricts on hosted projects (see the table above) — and even where it's technically possible, using a second billable cloud project as scratch space that gets wiped on every migration is wasteful and slow. A local Postgres instance you fully control is disposable by design, which is the actual property you want from something that exists purely to be repeatedly blown away and rebuilt.

**How does this apply to this project?**: everything above is the general concept — here's exactly what it looks like in Natours specifically. There's no separate, special piece of shadow-database infrastructure here at all. It's the _same_ local Postgres that `supabase start` already gives you, running in Docker on your machine at `127.0.0.1:54322` — the exact instance you also use for regular development. Concretely:

- `apps/api/.env` points **both** `DATABASE_URL` and `DATABASE_SHADOW_URL` at that same address: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
- `apps/api/prisma.config.ts` reads `DATABASE_SHADOW_URL` into its `shadowDatabaseUrl` field — that's the setting Prisma actually consults whenever a command needs a shadow database.
- When you run `npx prisma migrate dev` (or `migrate diff --from-migrations`), here's the literal sequence that happens on your machine: Prisma connects to that local Postgres server, creates a **brand-new, separate, temporary database** on it (something like `prisma_migrate_shadow_db_<random>` — not your real `postgres` database), replays every file in `prisma/migrations/` into that temporary database, compares the result against `schema.prisma`, and then deletes the temporary database entirely. Your actual `reviews`, `bookings`, etc. tables — the ones living in the real `postgres` database that `DATABASE_URL` points to — are never touched during this comparison step, only afterward, once the real migration is actually applied for real.
- This is also the concrete, literal reason `--from-migrations` commands kept failing with `P3016` ownership errors earlier in this project's history when pointed at the _live_ Supabase project (see "Incident History" below): doing this same "create a temporary database, use it, delete it" dance against a hosted Supabase project is exactly the privileged operation their pooler blocks. Switching the shadow database to local Supabase wasn't a workaround — it's what made this operation possible to run at all.

In this project, `DATABASE_SHADOW_URL` and `DATABASE_URL` happen to point at the _same_ local instance day-to-day — that's fine; the distinction that matters is conceptual (one is "where my app's data lives," the other is "Migrate's scratch space for computing diffs"), not that they need separate servers locally. What must never happen is either of them pointing at the live project during routine development.

---

## 🗄️ Database Migration

A "migration" is just a saved, ordered SQL file describing one change to the database — like "create this table," or "add this column." Instead of changing the database by hand and hoping everyone remembers what changed, every change gets written down as a migration file, committed to git, and applied the same way everywhere (your machine, a teammate's machine, the live project). This section covers the commands for that — the mental model behind _why_ it's structured this way is in "Local Development Environment" above and "Incident History" below, both worth reading first if anything here feels like an arbitrary rule rather than a reason.

> **🚨 All schema changes go through this workflow, with no exceptions — including "quick" fixes.** Every incident in this project's history so far (see "Incident History" at the end of this section) traces back to a schema change made directly against the live/hosted Supabase project — via the SQL Editor, Table Editor, or a misdirected CLI command — instead of through a tracked Prisma migration applied first to local Supabase. The live project is a **deploy target only**. Never open its SQL Editor or Table Editor to change schema, and never run `supabase db reset --linked` or `supabase db push` against it from a routine dev workflow.

### Standard Workflow (Recommended)

For all schema changes, work against **local Supabase** first:

```bash
# 0. Make sure local Supabase is running
pnpm --filter natours-backend start   # `supabase start`

# 1. Update schema.prisma with your changes
# 2. Generate and apply the migration locally (uses DATABASE_SHADOW_URL
#    for the shadow database — see Environment Variables above)
cd apps/api
npx prisma migrate dev --name describe_your_change

# 3. Verify the migration applied cleanly and test your feature locally
npx prisma migrate status

# 4. Commit the migration file
git add prisma/migrations/
git commit -m "feat(db): add describe_your_change migration"

# 5. Only once you're confident locally: apply the same migration to the
#    live project. This only APPLIES pending migrations — it never
#    resets, drops, or touches anything already there. Use the Session
#    Pooler URL (port 5432, sslmode=require), not the Transaction Pooler
#    (6543) — Migrate needs a persistent-connection-style pooler, and the
#    Direct Connection alternative requires a paid Supabase add-on.
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:5432/postgres?sslmode=require" \
  npx prisma migrate deploy
```

### Troubleshooting: When a Migration Doesn't Update the Table

Sometimes, `prisma migrate dev` fails due to schema drift or mismatched migration history. This is common when:

- You used `prisma db pull` to introspect an existing database.
- The baseline migration (`0_baseline`) contains unsupported SQL (e.g., column references in `DEFAULT` expressions).
- Prisma's shadow database fails to apply the baseline migration.

**Solution 1: Use `prisma db push` (for prototyping)**

```bash
# This applies schema changes directly without creating migration files.
# LOCAL SUPABASE ONLY. Never point DATABASE_URL at the live/hosted
# project when running this — db push has no migration history to
# reconcile against and can diverge silently from what's tracked.
npx prisma db push
```

**Solution 2: Manually create a migration using `migrate diff`**

```bash
# 1. Create a migration directory
mkdir -p prisma/migrations/1_add_your_change

# 2. Generate SQL for the changes (compares live DB structure against
#    schema.prisma — see prisma.config.ts's externalTables config below
#    for why this no longer needs manual auth-schema line removal)
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/1_add_your_change/migration.sql

# 3. Review the SQL file. Confirm it contains no unexpected DROP
#    statements against your own domain (a stray DROP TABLE/DROP TYPE
#    is a signal something's wrong — investigate before proceeding,
#    don't just delete the line and move on):
grep -c "^DROP" prisma/migrations/1_add_your_change/migration.sql

# 4. Apply it against LOCAL Supabase first and confirm it works:
psql "$DATABASE_SHADOW_URL" -f prisma/migrations/1_add_your_change/migration.sql

# 5. Only after step 4 has actually succeeded, mark it applied so
#    Prisma's bookkeeping matches reality:
npx prisma migrate resolve --applied 1_add_your_change

# 6. Verify
npx prisma migrate status
```

**⚠️ Never run `migrate resolve --applied` for a migration that hasn't actually been applied and verified.** `resolve --applied` only edits Prisma's own bookkeeping table (`_prisma_migrations`) — it does not run any SQL. Marking something "applied" that was never actually executed (or was applied somewhere other than where you think) creates a silent lie in the migration history: `migrate deploy` will skip it forever afterward, even if the real objects don't exist. This exact mistake is what caused the [Sep 2026 incident](#-incident-history) — treat step 5 above as strictly sequential, never done ahead of or instead of step 4.

**Solution 3: Raw SQL (last resort, same rule applies)**

When Prisma migrations are genuinely blocked and a critical change must go in some other way:

```sql
-- Example: Add an enum and update a column (our TransferStatus case)
CREATE TYPE billing."TransferStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

ALTER TABLE billing.platform_transfers
ALTER COLUMN status SET DATA TYPE billing."TransferStatus"
USING status::billing."TransferStatus";
```

Run this via `psql` against **local Supabase first**, confirm it, capture the exact SQL as a proper migration file in `prisma/migrations/`, apply that file to the live project, and only then:

```bash
npx prisma migrate resolve --applied 1_add_transfer_status
```

Never write directly into the live/hosted database's SQL Editor as a shortcut, even for something that feels trivial — every step above exists specifically to keep the live project, local Supabase, and the migration history files all telling the same story.

### ⚠️ Important: Excluding Supabase's `auth` Objects from Migrations

Because `bookings`, `profiles`, etc. have foreign keys into `auth.users`, `schema.prisma`'s `datasource` block declares `auth` as one of the managed schemas (`schemas = ["account", "auth", "billing", "geography", "public", "tour"]`). That's necessary for the FK types to resolve — but it also means Prisma Migrate would otherwise try to manage (and, worse, reset/drop) tables and enum types that Supabase itself owns: `auth.users`, `auth.identities`, `auth.sessions`, the various OAuth-client and WebAuthn tables Supabase Auth has added over time, and their backing enum types (`aal_level`, `factor_type`, `oauth_client_type`, etc.). Those objects are owned by the `supabase_auth_admin` role, not `postgres` — Migrate attempting to reset/alter them fails with a "must be owner of ..." Postgres error (`P3016`), and worse, if a diff is generated and applied blind, it can genuinely drop and recreate them under the wrong name.

**The fix is `apps/api/prisma.config.ts`'s `externalTables` feature** — it tells Migrate "these objects exist, you can reference them, but never manage, reset, or diff them":

```ts
export default defineConfig({
  // ...
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "auth.users",
      "auth.identities",
      "auth.sessions",
      "auth.refresh_tokens",
      "auth.mfa_factors",
      "auth.mfa_challenges",
      "auth.mfa_amr_claims",
      "auth.sso_providers",
      "auth.sso_domains",
      "auth.saml_providers",
      "auth.saml_relay_states",
      "auth.flow_state",
      "auth.one_time_tokens",
      "auth.audit_log_entries",
      "auth.instances",
      "auth.schema_migrations",
      "auth.oauth_clients",
      "auth.custom_oauth_providers",
      "auth.oauth_authorizations",
      "auth.oauth_client_states",
      "auth.oauth_consents",
      "auth.webauthn_challenges",
      "auth.webauthn_credentials",
    ],
  },
  enums: {
    external: [
      "auth.factor_type",
      "auth.factor_status",
      "auth.aal_level",
      "auth.code_challenge_method",
      "auth.one_time_token_type",
      "auth.oauth_authorization_status",
      "auth.oauth_client_type",
      "auth.oauth_registration_type",
      "auth.oauth_response_type",
    ],
  },
});
```

**If Supabase adds a new Auth feature later** (as happened with custom OAuth providers/WebAuthn mid-project) and a `migrate diff` or `db pull` surfaces new `auth.*` tables/enums you don't recognize as your own, add them here rather than letting them get diffed or, worse, dropped. A quick way to get the authoritative current list directly from a running instance:

```bash
psql "$DATABASE_SHADOW_URL" -c "
SELECT n.nspname, t.typname FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'auth' AND t.typtype = 'e';
"
```

**Note**: Foreign keys _referencing_ `auth.users` (e.g., `profiles_id_fkey`, `bookings_customer_id_fkey`) are fine to keep in your own migrations — they don't create or alter anything in `auth`, they only point at it.

### Migration Best Practices

| Scenario                            | Command                                          | When to Use                                                                  |
| ----------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| **New schema change**               | `prisma migrate dev --name change`               | Every time you modify `schema.prisma`, against local Supabase                |
| **Baseline from existing database** | `prisma db pull` → `prisma migrate diff`         | Initial setup only                                                           |
| **Quick development sync**          | `prisma db push`                                 | Against **local Supabase only** — never the live project                     |
| **Manual fix**                      | Raw SQL (local first) + `prisma migrate resolve` | When migrations are blocked — see the sequencing warning above               |
| **Production/live deployment**      | `prisma migrate deploy`                          | Applies already-tested, already-committed migrations. Never resets or drops. |

### Common Migration Errors & Fixes

| Error                                                                          | Cause                                                                                                              | Fix                                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `P1000: Authentication failed`                                                 | Wrong username format for Session Pooler (must be `postgres.[project-ref]`, not `postgres`), or `.env` not loading | Check `DATABASE_URL`'s username segment; confirm `prisma.config.ts` loads `.env` via `dotenv` with an explicit `path.resolve(__dirname, ...)` |
| `P3006: Migration failed to apply`                                             | Baseline migration has unsupported SQL, or references objects the shadow DB doesn't have                           | Use `prisma migrate diff` + `resolve --applied`, or check for stale statements left over from a re-baselined `0_baseline`                     |
| `P3016: must be owner of table/type "..."`                                     | Migrate's shadow-DB reset tried to touch a Supabase-owned `auth.*` object                                          | Add the object to `tables.external`/`enums.external` in `prisma.config.ts` — see the section above                                            |
| `P3017: Migration could not be found`                                          | Migration directory missing                                                                                        | Ensure the migration folder exists in `prisma/migrations/`                                                                                    |
| `P3018: Failed to apply migration to shadow database`                          | Shadow database issue                                                                                              | Try `supabase db reset` (local only) to get a clean shadow DB, then retry                                                                     |
| `Drift detected` / tables missing despite `migrate status` saying "up to date" | Schema was changed outside Prisma (manual SQL Editor edit, misdirected `--linked` command)                         | See "Incident History" below for the recovery procedure using `migrate diff --from-config-datasource --to-schema`                             |

---

## 🛠️ Building a Feature: End-to-End Workflow

This ties together NestJS's module/controller/service structure with the migration workflow above into the actual sequence you follow for a real feature — using the **Reviews module** (this project's next planned feature per `STATUS.md`) as a concrete running example: adding a moderation flag so admins can hide inappropriate reviews.

```
0. Sync local with git + check for drift
        │
1. Start local Supabase
        │
2. Scaffold module/controller/service (Nest CLI)
        │
3. Need a schema change? ──No──> skip to step 5
        │ Yes
4. Edit schema.prisma → `prisma migrate dev` (local)
        │
5. Implement DTO + service logic + controller endpoint
        │
6. Test locally (curl / Studio at :54323)
        │
7. Commit code + migration file together
        │
8. Confident? ──No──> back to step 5/6
        │ Yes
9. `prisma migrate deploy` against the LIVE project
        │
10. Deploy the application code itself
```

### 0. Sync your local environment before you start

If you're coming from frontend or general software engineering, you already know this pattern well: before starting new work, you do `git checkout main`, `git pull`, and _then_ branch off — you never want to build a feature on top of a stale copy of the codebase. The same instinct applies here, **but there's one important twist that's specific to databases, and it's worth slowing down to actually understand rather than just memorizing the commands.**

**The twist: you don't "pull" the database's current shape. You pull the _instructions_ for building it, and then run those instructions yourself, locally.**

Here's an analogy that makes this click: think of `prisma/migrations/` as a **recipe**, and the actual live database as a **finished dish** that was cooked using that recipe. If you want to cook the same dish at home, the right move is to follow the written recipe yourself, in your own kitchen. The _wrong_ move is to go taste someone else's finished plate and try to reverse-engineer what's in it — because what if, at some point, someone changed something on that plate (added a pinch of salt, swapped an ingredient) without ever writing it down in the recipe? You'd copy a dish that doesn't actually match what the recipe says, and the recipe — the thing everyone else relies on, the thing your own future dishes will be based on — would quietly become wrong.

That's not a hypothetical here — it's _exactly_ what happened earlier in this project (see "Incident History" below): at some point, someone changed the live database directly, without writing a migration file for it. The "recipe" (migration history) and the "finished dish" (the live database) fell out of sync, and nobody noticed until a routine command tried to follow the recipe and discovered it no longer matched reality.

**So, concretely, what "syncing before you start" means here is two separate checks, answering two different questions:**

**Question 1: "Did a teammate (or CI, or past-you) add new migration files I don't have yet?"** This is the direct equivalent of `git pull` — you're just making sure you have the latest recipe.

```bash
# Get any new migration files that were added to the repo since you last checked
git pull origin main

# Dependencies might have changed too (a new Prisma version, a new package) —
# reinstall to be safe
pnpm install

# Now ask Prisma directly: "given the migration files I have locally, is my
# LOCAL database up to date, or is something pending?"
cd apps/api
npx prisma migrate status
```

If `migrate status` reports pending migrations (ones that exist as files but haven't been run against your local database yet), apply them — this is "cooking the recipe yourself":

```bash
# Applies any pending migrations to local Supabase, in order
npx prisma migrate deploy

# Or, if you'd rather start from a completely clean slate (wipes local
# data, replays every migration from scratch — totally safe, since local
# data is always disposable):
pnpm --filter natours-backend db:reset
```

**Question 2: "Has the LIVE database quietly drifted from what the recipe says it should be?"** This is a different question from Question 1, and it's the one that would have caught the original incident early. It's not about getting new instructions — it's about double-checking that nobody went and changed the finished dish directly, off-recipe. You don't need to run this before every single feature, but it's a good habit before starting significant work, and it's essential right before you deploy anything to production (step 9 below already includes this check for that reason):

```bash
# Point Prisma at the LIVE database and ask the same "are we up to date?"
# question — if the answer isn't a clean "yes," something changed outside
# the tracked migration history, and it's worth investigating before
# building anything else on top of it.
DATABASE_URL="<live pooler URL>" npx prisma migrate status
```

**Why this matters enough to be step 0, not an afterthought**: every problem this project's `README.md` documents fixing so far — the dropped tables, the enums created twice, the migration history that no longer matched reality — traces back to skipping exactly this kind of check, or to treating the live database's current state as more trustworthy than the written migration history. Getting into the habit of running these two commands before you start, the same automatic way you'd run `git pull`, is the single cheapest thing you can do to avoid repeating that.

### 1–2. Start local Supabase, scaffold the module

**What/why**: every feature starts as a NestJS module — Nest's unit of dependency-injection scoping and feature grouping. The controller is the HTTP boundary only (routes, request/response shape); the service holds the actual business logic. Keeping that split matches this project's existing `src/modules/` convention (see "Monorepo Structure" above) and every other module already built (Tours, Bookings, Payments).

```bash
pnpm --filter natours-backend start   # ensure local Supabase is running

cd apps/api
nest g module modules/reviews
nest g controller modules/reviews
nest g service modules/reviews
```

This creates `src/modules/reviews/{reviews.module.ts, reviews.controller.ts, reviews.service.ts}` and wires `ReviewsModule` into `AppModule` automatically.

### 3–4. Decide if a migration is needed, then generate it locally

**When**: only if the feature needs a new/changed table, column, enum value, index, or relation. A feature that's pure business logic over existing columns (e.g., computing an average rating from existing `rating` values) skips straight to step 5 — no migration needed.

For the moderation-flag example, `tour.reviews` needs a new column, so update `schema.prisma`:

```prisma
model Review {
  id         BigInt    @id @default(autoincrement())
  reviewText String?   @map("review_text")
  rating     Int?
  tourId     BigInt?   @map("tour_id")
  customerId String?   @map("customer_id") @db.Uuid
  isFlagged  Boolean   @default(false) @map("is_flagged")   // new
  createdAt  DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)

  @@schema("tour")
  @@map("reviews")
}
```

Then generate and apply the migration — against **local Supabase**, using `DATABASE_URL`/`DATABASE_SHADOW_URL` from `.env` as-is (see "Local Development Environment" above for why this is safe to do freely here):

```bash
npx prisma migrate dev --name add_review_moderation_flag
```

This diffs your change against the shadow database, writes `prisma/migrations/<timestamp>_add_review_moderation_flag/migration.sql`, applies it to local Supabase, and regenerates the Prisma Client — all in one command.

### 5. Implement the feature

```ts
// src/modules/reviews/dto/create-review.dto.ts
import { IsInt, IsString, Max, Min, MaxLength } from "class-validator";

export class CreateReviewDto {
  @IsString()
  @MaxLength(1000)
  reviewText: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
```

```ts
// src/modules/reviews/reviews.service.ts
import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(tourId: bigint, customerId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { tourId_customerId: { tourId, customerId } },
    });
    if (existing) {
      throw new ConflictException("You already reviewed this tour");
    }

    return this.prisma.review.create({ data: { tourId, customerId, ...dto } });
  }
}
```

```ts
// src/modules/reviews/reviews.controller.ts
import { Body, Controller, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsService } from "./reviews.service";

@Controller("tours/:tourId/reviews")
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  create(
    @Param("tourId") tourId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(BigInt(tourId), user.id, dto);
  }
}
```

### 6. Test locally

```bash
curl -X POST http://localhost:3000/tours/1/reviews \
  -H "Authorization: Bearer <local-test-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"reviewText": "Amazing experience!", "rating": 5}'
```

Inspect the result directly in local Supabase Studio (`http://127.0.0.1:54323`) — this is disposable data, so poke at it freely, and `supabase db reset` whenever you want a clean slate.

### 7. Commit code and migration together

```bash
git add apps/api/src/modules/reviews apps/api/prisma
git commit -m "feat(api): add review moderation flag and creation endpoint"
```

Committing the migration file in the same commit as the code that depends on it keeps the two from drifting apart in history — a later `git log` or an AI agent reading this repo should never have to guess which migration a given feature commit depends on.

### 8–10. Once tested: promote to the live project — yes, this step is required

**This is the step that answers "does what's on local Supabase need to reach the live project?" — yes, always, once you're confident.** A feature isn't done when it works locally; it's done when the same tested migration has been applied to the live database and the application code that depends on it is deployed. Skipping this leaves the live project permanently behind local, which is a milder version of exactly the drift that caused the incident documented below.

```bash
# Deploy the already-tested migration to the live database.
# Additive-only — never resets or drops anything already there.
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:5432/postgres?sslmode=require" \
  npx prisma migrate deploy

# Confirm it applied
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:5432/postgres?sslmode=require" \
  npx prisma migrate status
```

Then deploy the application code itself — see "Deployment" below. The deployed API's runtime `DATABASE_URL` is supplied by the hosting platform (a Render/Railway environment variable), never read from this repo's `.env`, for the same reason the live URL never lives in `.env` locally.

**If working with collaborators later**: each person develops against their own local Supabase instance independently — nothing about steps 1–7 involves the shared live project at all, so there's no coordination needed until step 9. Migration file conflicts in a PR are resolved the same way as any other code conflict; keeping individual migrations small (one logical change each) makes that rare in practice.

---

## 🚨 Incident History

Documented here per this project's own convention of keeping `STATUS.md`/`README.md` as a source of truth for both humans and AI agents picking up context later.

### Sep 2026 — 12 business-domain tables dropped from the live database

**What happened**: `account.profiles`, `tour.bookings`, `tour.partners`, `tour.tours`, and 8 other tables (plus the `tour.media_type` enum) were physically dropped from the live Supabase project, entirely outside of Prisma's migration history. `_prisma_migrations` on the live database still showed every migration as "applied," so nothing about the tracked history flagged a problem on its own — the drift was only discovered when a `prisma migrate diff --from-migrations` run produced a script that tried to drop the _same_ tables again, because the `schema.prisma` being diffed against had itself already been silently re-introspected from the already-drifted live database.

**Root cause**: schema changes made directly against the live project outside Prisma's tracked workflow — most likely a manual edit via the Supabase Table/SQL Editor, or a `supabase db reset --linked`/`supabase db push` run while linked to the live project instead of local. Earlier migrations (`2_add_booking_statuses`, `3_sync_payment_schema`) had already been reconciled _after the fact_ with `migrate resolve --applied`, rather than generated and applied before the underlying change — see the sequencing warning under "Manual fix" above, which exists specifically because of this history.

**Recovery** (no Supabase backup was needed — the project's own committed `schema.prisma` and migration history were sufficient):

```bash
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script > recover_missing_domain.sql

grep -c "^DROP" recover_missing_domain.sql   # confirm no unexpected drops before applying

psql "<live connection string>" -f recover_missing_domain.sql
npx prisma db pull      # confirm all models return
npx prisma generate
```

Also required: clearing a handful of orphaned rows in `billing.payments`/`billing.platform_transfers` that referenced the now-recreated (empty) `bookings`/`partners` tables, before their foreign keys could be re-added.

**What changed as a result**: local development moved to the Supabase CLI's local stack (`supabase start`) as the mandatory default for all schema work (see the warning banner at the top of this section); `prisma.config.ts`'s `externalTables` config was adopted to properly exclude Supabase-owned `auth.*` objects instead of manually trimming them out of generated SQL by hand.

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: _Not available yet_

### Key Endpoints

#### Tours

- `GET /tours` – List all tours
- `POST /tours` – Create a new tour (partner only)
- `GET /tours/:id` – Get tour details
- `PUT /tours/:id` – Update tour (partner only)

#### Bookings

- `GET /bookings` – List user's bookings
- `POST /bookings` – Create a new booking
- `GET /bookings/:id` – Get booking details
- `PATCH /bookings/:id/cancel` – Cancel a booking
- `PATCH /bookings/:id/check-in` – Check in for a tour (customer only, requires `CONFIRMED` status)

#### Payments

- `POST /payments/checkout` – Initiate payment
- `GET /payments/:id` – Get payment status

#### Partners

- `POST /partners/:id/onboarding` – Start Stripe onboarding
- `GET /partners/:id/earnings` – View earnings summary

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run end-to-end tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

---

## 🔐 Security Considerations

### Authentication & Authorization

- **JWT Tokens**: Issued by Supabase, validated by NestJS
- **Role-Based Access Control (RBAC)**: Enforced at the endpoint level
- **Webhook Verification**: All Stripe webhooks are cryptographically signed

### Data Protection

- **HTTPS Only**: All API calls use TLS 1.3
- **Rate Limiting**: 100 requests per minute per IP
- **SQL Injection Protection**: Prisma parameterized queries
- **CORS**: Restricted to trusted domains

---

## 📊 Partner Dashboard

The partner dashboard (available in the Internal Dashboard app) provides:

- **Tour Management** – Create, edit, publish, and archive tours
- **Booking Overview** – Real-time booking status and customer details (including `ONGOING`, `COMPLETED`, and `NO_SHOW` statuses)
- **Availability Management** – Set recurring rules and blackout dates
- **Financial Insights** – Earnings, pending payouts, and transaction history
- **Reviews & Ratings** – Customer feedback and average ratings

---

## 🤝 Contributing

This project is managed as a monorepo. Please follow the existing code style and ensure all tests pass before submitting a pull request.

### Development Workflow

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make your changes and commit: `git commit -m "feat: add feature"`
3. Push to GitHub: `git push origin feat/feature-name`
4. Open a pull request

### Code Style

- **Linting**: `pnpm turbo run lint`
- **Formatting**: `pnpm turbo run format`

---

## 🚢 Deployment

### Production Deployment

1. Push to `main` branch
2. GitHub Actions CI/CD pipeline runs tests
3. Deploy to Vercel (frontend) and Railway/Render (API)

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Prisma client not generated

```bash
pnpm turbo run prisma:generate
```

**Issue**: Stripe webhooks not received

```bash
# Check webhook signing secret in .env
stripe listen --forward-to http://localhost:3000/webhooks/stripe
```

**Issue**: Supabase connection timeout

```bash
# Restart Supabase
supabase stop && supabase start
```

---

## 📄 License

MIT © Andre Wicaksono

---

## 👨‍💻 Author

**Andre Wicaksono**

_Software Engineer · Nix Enthusiast_

- **GitHub**: [@AndreWicaksono](https://github.com/AndreWicaksono)
- **LinkedIn**: [linkedin.com/in/andrewicaksono](https://linkedin.com/in/andrewicaksono)
- **Email**: [andrewicaksana@gmail.com](mailto:andrewicaksana@gmail.com)

---

**Last Updated**: September 11, 2026

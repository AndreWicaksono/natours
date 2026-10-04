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
| **Auth**          | Supabase Auth (JWT) | User authentication — ES256 via JWKS (live) or HS256 (local); see "Authentication & Authorization" below |
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

## 🔑 Authentication & Authorization

### What this system does, in one sentence

This API never handles passwords or issues its own tokens. **Supabase Auth (GoTrue) is the identity provider** — it owns signup, login, and token issuance. **This NestJS API is purely a resource server** — its only job is to verify a JWT Supabase already issued, then enrich it with this project's own role/profile data before any business logic runs.

### Who owns what

|                                          | Owns                                                              |
| :--------------------------------------- | :----------------------------------------------------------------- |
| **Supabase Auth (GoTrue)**              | Passwords, sessions, token issuance/signing, `auth.users`          |
| **This NestJS API**                     | Verifying tokens, enforcing which role may call which endpoint     |
| **`account.profiles`** (this project's own table, FK'd to `auth.users`) | The bridge between "which Supabase Auth user is this" and "what does *our app* let them do" — `role`, `partnerId`, name, avatar |

A token proves *who you are* (Supabase's job). It says nothing on its own about *what you're allowed to do here* — that's `account.profiles.role`, looked up fresh on every request.

### Where each piece lives, and what it's responsible for

All ten files live in `apps/api/src/auth/`:

| File | Responsibility |
| :--- | :--- |
| `jwt.strategy.ts` | The actual verification engine. Extracts the bearer token, picks the right signing method (see below), verifies the signature, then runs `validate()` — which looks up `account.profiles` by the token's `sub` claim and returns the enriched user object |
| `jwt-payload.interface.ts` | Shape of the **raw** decoded JWT — Supabase's own claims (`sub`, `email`, `aud`, `role`, etc.), before any enrichment |
| `user-payload.interface.ts` | Shape of the **enriched** object `validate()` produces — what every controller actually receives via `@CurrentUser()`. Notice this has an app-level `role: AppRole` field that the raw JWT never has — that's this project's data, not Supabase's |
| `jwt-auth.guard.ts` | Wraps the strategy as a NestJS Guard — this is what actually runs Passport's verification on each request, and checks for the `@Public()` escape hatch first |
| `public.decorator.ts` | Marks a route as skipping authentication entirely |
| `roles.decorator.ts` + `roles.guard.ts` | **Authorization**, not authentication — runs *after* `JwtAuthGuard` has already confirmed who the caller is; checks that role against an allow-list |
| `current-user.decorator.ts` | Convenience — pulls the already-validated user object (`request.user`) into a controller method as a typed parameter |
| `auth.module.ts` | Wires the strategy, guards, and `PrismaService` dependency together as a NestJS module |
| `auth.service.ts` | Currently an empty placeholder — no business logic lives here yet; reserved for future auth-related operations beyond what Guards/Strategy handle |

**How these 10 files relate to each other and to the app's bootstrap/root files:**

```mermaid
graph TD
    subgraph Bootstrap["apps/api/src/main.ts"]
        MAIN["main.ts<br/>registers JwtAuthGuard globally<br/>registers ValidationPipe globally"]
    end

    subgraph AppRoot["App root"]
        APPMODULE["app.module.ts<br/>imports AuthModule"]
        APPCTRL["app.controller.ts<br/>uses the decorators below"]
    end

    subgraph AuthFolder["apps/api/src/auth/"]
        AUTHMODULE["auth.module.ts"]
        AUTHSERVICE["auth.service.ts<br/>(empty placeholder)"]
        STRATEGY["jwt.strategy.ts<br/>verifies the token"]
        GUARD["jwt-auth.guard.ts<br/>wraps the strategy"]
        ROLESGUARD["roles.guard.ts"]
        PUBLICDEC["public.decorator.ts"]
        ROLESDEC["roles.decorator.ts"]
        CURRENTUSERDEC["current-user.decorator.ts"]
        JWTPAYLOAD["jwt-payload.interface.ts<br/>raw token shape"]
        USERPAYLOAD["user-payload.interface.ts<br/>enriched user shape"]
    end

    PRISMA["PrismaService<br/>(account.profiles lookup)"]

    MAIN -->|instantiates & registers globally| GUARD
    APPMODULE -->|imports| AUTHMODULE
    AUTHMODULE -->|registers as provider| STRATEGY
    AUTHMODULE -->|registers as provider| AUTHSERVICE
    AUTHMODULE -->|depends on| PRISMA

    GUARD -->|"extends AuthGuard('jwt'), delegates to"| STRATEGY
    GUARD -->|reads metadata written by| PUBLICDEC

    STRATEGY -->|receives raw claims shaped as| JWTPAYLOAD
    STRATEGY -->|queries| PRISMA
    STRATEGY -->|"validate() returns"| USERPAYLOAD

    ROLESGUARD -->|reads metadata written by| ROLESDEC
    ROLESGUARD -->|reads request.user shaped as| USERPAYLOAD

    CURRENTUSERDEC -->|pulls request.user shaped as| USERPAYLOAD

    APPCTRL -->|"@Public()"| PUBLICDEC
    APPCTRL -->|"@Roles(...)"| ROLESDEC
    APPCTRL -->|"@UseGuards(RolesGuard)"| ROLESGUARD
    APPCTRL -->|"@CurrentUser()"| CURRENTUSERDEC
```

**How to read this**: `main.ts` only ever touches `JwtAuthGuard` directly — everything else (`RolesGuard`, the decorators) is applied per-controller, which is exactly why `AppController` needed its own explicit `@UseGuards(RolesGuard)` to make its `@Roles(AppRole.ADMIN)` actually take effect (see the correction above). The two interface files (`jwt-payload.interface.ts`, `user-payload.interface.ts`) aren't wired in via imports the way the guards/decorators are — they're pure types, flowing through `jwt.strategy.ts` as its input and output shapes respectively. Every controller across the app (`AppController`, `ToursController`, `ReviewsController`, etc.) connects into this same shared set of 10 files — `auth/` is written once and reused everywhere, never duplicated per feature module.

### When: the request lifecycle, step by step

```
Request arrives
      │
      ▼
JwtAuthGuard.canActivate()
      │  Is the route marked @Public()?
      ├─ Yes ──────────────────────────────► skip straight to controller
      │  No
      ▼
Passport runs JWTStrategy:
  extract bearer token → pick HS256 or ES256 → verify signature
  → validate() looks up account.profiles → attaches enriched user to request
      │
      │  Token invalid/expired/missing? ──► 401 Unauthorized, stops here
      ▼
RolesGuard.canActivate()
  reads @Roles(...) metadata → compares against request.user.role
      │
      │  Role not in the allow-list? ──► 403 Forbidden, stops here
      ▼
Controller method runs
  @CurrentUser() pulls request.user as a typed parameter
```

**The same flow, with every participant named explicitly** — useful when you need to know exactly which file is responsible at each step, not just the general shape:

```mermaid
sequenceDiagram
    participant Client
    participant JAG as JwtAuthGuard<br/>(global, main.ts)
    participant Strat as JWTStrategy
    participant Prisma as PrismaService
    participant RG as RolesGuard<br/>(per-controller)
    participant Ctrl as Controller

    Client->>JAG: HTTP request
    JAG->>JAG: reflector checks @Public() metadata

    alt Route is @Public()
        JAG-->>Ctrl: skip authentication entirely
    else Route requires authentication
        JAG->>Strat: delegate to Passport 'jwt' strategy
        Strat->>Strat: decode header (unverified) to read "alg"
        Strat->>Strat: HS256 → SUPABASE_JWT_SECRET<br/>ES256/RS256 → JWKS public key
        Strat->>Strat: verify signature with the matched key

        alt Signature invalid, expired, or missing
            Strat-->>Client: 401 Unauthorized
        else Signature valid
            Strat->>Prisma: findUnique(account.profiles, where id = sub)
            Prisma-->>Strat: profile row (role, partnerId, name, avatar)
            Strat-->>JAG: enriched UserPayload attached as request.user
            JAG-->>RG: proceed
            RG->>RG: reflector checks @Roles(...) metadata

            alt No @Roles() on this route
                RG-->>Ctrl: allow — any authenticated user
            else @Roles(...) present
                RG->>RG: compare request.user.role against the list
                alt Role not in the list
                    RG-->>Client: 403 Forbidden
                else Role allowed
                    RG-->>Ctrl: allow
                end
            end
        end
    end

    Ctrl->>Ctrl: @CurrentUser() extracts request.user
    Ctrl-->>Client: handler runs, response returned
```

**One thing this sequence diagram makes visually obvious that's easy to miss in prose**: `RolesGuard` only ever runs at all for routes where a controller has explicitly added `@UseGuards(RolesGuard)` — it isn't global like `JwtAuthGuard`. A controller that forgets this (as `AppController` did for `/profile` before the fix above) never reaches the `RolesGuard` lane of this diagram at all; execution goes straight from the strategy's success to the controller, and any `@Roles(...)` metadata sitting on that route is simply never read by anything.

**Worth knowing for debugging**: a `401` means `JwtAuthGuard` rejected the request — the token itself is missing, malformed, expired, or fails signature verification. A `403` means the token was perfectly valid, but `RolesGuard` rejected the *role*. These are genuinely different failures with different fixes — confusing them wastes debugging time (this is exactly what happened in the incident that prompted this section: a `401` with zero controller-side output meant the problem was in token *verification*, not in which role was logged in, and the role never got a chance to matter).

### Why authentication code only ever appears at the controller level — your observation is correct, and here's the mechanism

This isn't a project convention someone chose — it's how NestJS's Guards feature actually works. Guards (`@UseGuards(...)`) and the metadata they read (`@Roles(...)`, `@Public()`) can only be attached at the controller or method level (or globally, for the whole app) — there's no equivalent concept inside a service class. By the time a service method runs, authentication and authorization have *already happened*; the service receives a plain, already-validated `UserPayload` object as an ordinary parameter, with zero awareness of JWTs, Supabase, or how that user got there at all.

This is the same Single Responsibility split documented in `nestjs-js-ts-foundations.md` (Part 3.3) — controllers own "is this request allowed," services own "what does this request actually do" — applied specifically to auth. One concrete benefit worth naming: it makes services trivially testable without any auth machinery at all. Testing `ReviewsService.create()` never requires mocking a JWT or a Guard — just construct a plain `UserPayload` object directly and pass it in (see `nestjs-js-ts-foundations.md` Part 3.8 for the general pattern).

### How: the two signing algorithms, and why the strategy supports both

Local Supabase (CLI v2.33.5, this project's pinned version) issues **HS256**-signed tokens — a legacy symmetric algorithm, verified with a single shared secret. The live project issues **ES256** — asymmetric, verified against a public key fetched from Supabase's JWKS endpoint. These aren't interchangeable, and a strategy hardcoded to one will flatly reject tokens from an environment using the other.

`JWTStrategy`'s `secretOrKeyProvider` decodes each token's own header first (without trusting it yet) and routes to the matching key source — `HS256` → `SUPABASE_JWT_SECRET` (a plain shared secret), `ES256`/`RS256` → the JWKS public key. Each algorithm only ever matches its own key material, so this isn't the classic "algorithm confusion" vulnerability (where a server mistakenly accepts either algorithm against the *same* key) — it's two fully separate verification paths that happen to live in one strategy class.

**For local development**, make sure `SUPABASE_JWT_SECRET` in `apps/api/.env` matches what local Supabase actually uses:
```bash
supabase status -o env | grep JWT
```

### How: testing an authenticated endpoint locally

```bash
# 1. Sign in as a test user against LOCAL Supabase's Auth endpoint directly
#    (anon key, not service_role — see "Who owns what" above)
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: <local anon key, from `supabase status`>" \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@natours.com", "password": "..."}'

# 2. Export the access_token from that response
export TOKEN="<access_token from the response above>"

# 3. Call your API with it
curl -X POST http://localhost:3000/tours \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**To inspect a token directly when something's not working** — this decodes the header and payload without verifying the signature, which is exactly what you want for debugging (not for trusting the contents):
```bash
echo "$TOKEN" | cut -d. -f1 | tr '_-' '/+' | base64 -d 2>/dev/null; echo   # header: check "alg"
echo "$TOKEN" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null; echo   # payload: check "iss"
```
`iss` tells you definitively which Supabase instance issued the token (`http://127.0.0.1:54321/...` = local, `https://[project-ref].supabase.co/...` = live) — useful any time a token behaves unexpectedly and you're not sure which environment it actually came from.

### How to protect a new controller or route: what, when, where, why, how

**The one thing that changes everything below, and is easy to miss**: `JwtAuthGuard` is registered **globally**, in `apps/api/src/main.ts`:
```ts
app.useGlobalGuards(new JwtAuthGuard(reflector));
```
This means **every route in the entire app already requires a valid JWT by default** — you do not need to add `JwtAuthGuard` again on a new controller. (`ToursController` and `ReviewsController` both currently do add it again via `@UseGuards(JwtAuthGuard, RolesGuard)` — harmless, since it just runs the same deterministic check twice, but redundant. Worth cleaning up to `@UseGuards(RolesGuard)` only, next time either file is touched, so new controllers copy the correct pattern rather than the redundant one.)

Given that, here's the actual decision tree for a new controller or route:

**1. Does this route need to be reachable *without* authentication at all** (health checks, a public tour listing, a webhook)? → Add `@Public()` on that specific route (or the whole controller). This is the *only* thing that opts a route out of the global guard.
```ts
import { Public } from 'src/auth/public.decorator';

@Public()
@Get('health')
check() { return { status: 'ok' }; }
```

**2. Does this route need to work for *any* authenticated user, regardless of role** (e.g., "get my own profile")? → Do nothing extra. The global guard already covers "must be logged in"; there's no role restriction to add.

**3. Does this route need to be restricted to *specific roles*** (what `ReviewsController`'s `create()` needed — customers only)? → Add `RolesGuard` **at the controller level** via `@UseGuards(RolesGuard)`, then `@Roles(...)` on each method that needs restricting:
```ts
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { AppRole } from 'src/generated/prisma/enums';

@Controller('bookings/:bookingId/reviews')
@UseGuards(RolesGuard)   // NOT JwtAuthGuard — that's already global
export class ReviewsController {
  @Post()
  @Roles(AppRole.CUSTOMER)
  create(...) { ... }
}
```
**Why `@UseGuards(RolesGuard)` goes on the controller, but `@Roles(...)` goes on the method**: `RolesGuard` needs to run on *every* route in the controller (it has to check even routes with no `@Roles()` at all — see its implementation, it returns `true` when no roles are required). `@Roles(...)` is metadata, not a guard — it only marks *which* roles a specific method allows; a method with no `@Roles()` at all is allowed for any authenticated user once `RolesGuard` lets it through unrestricted.

**4. Does this route need to know *who* the current user is, not just verify they're allowed in?** → Add `@CurrentUser()` as a parameter, typed as `UserPayload` from `src/auth/user-payload.interface.ts`:
```ts
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { UserPayload } from 'src/auth/user-payload.interface';

create(@CurrentUser() user: UserPayload, ...) { ... }
```
Import it as `import type { ... }` (a type-only import) rather than a regular import — `UserPayload` is purely a compile-time type with no runtime code behind it, and `import type` makes that explicit and lets TypeScript elide it entirely from the compiled output.

**Quick reference table:**

| You need... | Add |
| :--- | :--- |
| No auth at all | `@Public()` |
| Any logged-in user | Nothing — global guard already covers it |
| Specific role(s) only | `@UseGuards(RolesGuard)` on the controller + `@Roles(...)` on the method |
| The current user's data | `@CurrentUser() user: UserPayload` as a parameter |

### Common Auth Errors & Fixes

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| `401 Unauthorized`, no controller-side `console.log` output | `JwtAuthGuard` rejected before the request reached the controller — token missing, expired, or signature verification failed | Decode the token (above) and check `alg`/`iss`; confirm `SUPABASE_JWT_SECRET` (HS256) or `SUPABASE_URL`'s JWKS endpoint (ES256) matches the environment that issued it |
| `403 Forbidden` | Token is valid, but `request.user.role` isn't in the route's `@Roles(...)` list | Confirm which role the logged-in user actually has in `account.profiles`, and that it matches what the route expects |
| `401` only on locally-issued tokens, live tokens work fine | Local Supabase issuing HS256, strategy only configured for ES256 (or vice versa) | See "the two signing algorithms" above — confirm `JWTStrategy` branches on the token's own `alg` rather than assuming one |
| `UnauthorizedException('User profile not found')` | Token is valid and correctly verified, but no matching row in `account.profiles` for that user's `auth.users` id | Usually means a user was created directly in Supabase Auth without the corresponding profile row being created — check whatever signup flow is responsible for creating `account.profiles` rows |

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
- **`psql`** – the PostgreSQL command-line client. Nearly every command throughout "Database Migration" and "Local Development Environment" below assumes it's on your `PATH`. It's just the client binary, not a database server — local Postgres itself is provided entirely by `supabase start`/Docker, so installing `psql` doesn't mean running a second Postgres instance. Install it however fits your system: a package manager (`apt install postgresql-client`, `brew install libpq`, a Nix package, etc.), or a one-off Docker container if you'd rather not install anything locally.

  **Version matching isn't required, but staying reasonably current is worth it.** PostgreSQL maintains strong backward/forward compatibility in its client-server protocol — a `psql` client can connect to a server several major versions older or newer without issues for ordinary queries. Supabase currently runs Postgres 17, so there's no strict requirement to match that exactly; a noticeably older client (e.g., a `psql` from Postgres 12 or earlier) can occasionally lack newer meta-commands or display certain newer server-side features slightly differently, but basic connecting and querying will work regardless. If you have a choice, picking a `psql` version at or near 17.x avoids that class of minor friction entirely.

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

# No DATABASE_SHADOW_URL here on purpose. Local Supabase's `postgres`
# role has full privileges (unlike the hosted project's), so Prisma
# automatically creates and tears down its own temporary shadow
# database on this same connection whenever a command needs one — see
# "Local Development Environment" below. Only set this var explicitly
# in an environment where automatic creation genuinely isn't possible,
# and never set it to the same value as DATABASE_URL — Prisma refuses
# to proceed if the two are identical.

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
# DATABASE_URL (see "Environment Variables" above — no separate
# shadow database URL is needed for local development)

cd apps/api

# Required on a brand-new local database — see "The one required extra
# step on a brand-new or freshly reset local database" below for why:
npx prisma migrate resolve --applied 00_local_baseline

# Apply the full tracked migration history to the fresh local database
npx prisma migrate deploy

# Generate the Prisma Client
npx prisma generate
```

**Note**: the generated client (`apps/api/src/generated/prisma/`) is gitignored, not committed — it's fully reproducible from `schema.prisma` via the command above, and tracking it only produces noisy diffs on every `generate` run (including for Supabase's own `auth.*` models, which regenerate as part of the same bundled output even when untouched). A `postinstall: prisma generate` script in `apps/api/package.json` means a fresh `pnpm install` always produces a correct client automatically — you shouldn't normally need to run this command manually except right after pulling schema changes mid-session.

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

### Division of labor: Prisma vs. Supabase CLI

Both tools are used constantly in this project, but for genuinely different jobs — worth being explicit about the split, since Supabase CLI actually has *two* separate capabilities that are easy to conflate: managing your local environment's lifecycle, and its own independent schema-migration system.

|                                       | Command                                                          | Used in this project? |
| :------------------------------------ | :---------------------------------------------------------------- | :--------------------- |
| **Local environment lifecycle**       | `supabase start` / `stop` / `db reset` / `status`                | **Yes, constantly** — every day of development |
| **Supabase's own migration system**   | `supabase migration new`, `supabase db diff`, `supabase db push` | **No, deliberately not used** |
| **Schema definition & migrations**    | `prisma migrate dev` / `deploy` / `status` / `diff`               | **Yes — the only tool that ever touches schema** |

**Why `supabase migration new`/`db diff`/`db push` are deliberately avoided, not just unused by habit**: Supabase's CLI ships its own complete migration system, independent of Prisma — it can generate migration files, diff schema changes, and push them to a project entirely on its own, with no ORM involved at all. That's a legitimate way to run a Supabase project. But the moment you introduce Prisma as well, using *both* systems for the same job means the schema now has two separate, independently-updatable sources of truth describing it — Prisma's `prisma/migrations/`, and Supabase's own `supabase/migrations/`. Nothing keeps those two in sync automatically; each can drift from the actual database, and from each other, without either tool noticing. That's not a hypothetical risk — it's structurally the same category of problem documented in "Incident History" below, just via a different path (two tracking systems instead of one tracked history plus an untracked manual edit). Committing to exactly one tool as the sole owner of schema — Prisma, in this project — is what actually closes that gap, rather than just reducing how often it comes up.

**What `supabase/migrations/` is still for, then, in this repo**: only things Prisma has no concept of at all, and Supabase's own bootstrap needs to run before Prisma ever gets involved — currently just `00000000000000_extensions.sql` (enabling PostGIS). If this project ever needs Supabase-specific setup outside plain Postgres schema — Edge Functions, Storage bucket configuration, Auth provider settings — that continues to live in Supabase's own tooling/dashboard regardless, since it's genuinely outside anything Prisma manages. The line isn't "Prisma replaces Supabase CLI" — it's "Prisma owns the Postgres schema; Supabase CLI owns the local environment and anything Supabase-specific that isn't plain schema."

### The one required extra step on a brand-new or freshly reset local database

The very first time you point Prisma at a local Supabase instance — whether that's your first-ever `supabase start` on a new machine, or right after any `supabase db reset` — `prisma migrate deploy`/`migrate dev` will fail with:

```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

**Why this happens, and why it's not actually about your own migrations**: `supabase start`/`db reset` populates a fresh local Postgres with Supabase's *own* system schemas (`auth`, `storage`, `realtime`, extensions) immediately, before Prisma ever touches it. Since `auth` is one of the six schemas `schema.prisma` manages, Prisma sees real tables sitting there with zero recorded migration history, and refuses to guess whether it's safe to proceed — this is the same safety gate the error message's "baseline an existing production database" link describes, just triggered by Supabase's own scaffolding rather than by any of your own data.

**The fix — one empty, permanent placeholder migration**, already committed to this repo as `prisma/migrations/00_local_baseline/`:

```sql
-- Empty baseline. Acknowledges that Supabase's own system schemas
-- (auth, storage, realtime, extensions, etc.) already exist in a fresh
-- local instance via `supabase start`/`supabase db reset` — this isn't
-- Prisma-managed state, so there's nothing to actually apply here.
```

Every time you're starting from a genuinely fresh local database (first-time setup, or right after `supabase db reset`), run this exact two-command sequence before anything else:

```bash
npx prisma migrate resolve --applied 00_local_baseline
npx prisma migrate deploy
```

The first command gives Prisma a migration history to point to (satisfying the "not empty, but no history" check) without lying about anything — the migration itself is genuinely empty, so marking it "applied" and "having actually applied it" are the same statement. The second command then applies the rest of your tracked migration history for real, creating `account`/`billing`/`geography`/`tour`'s tables in local Postgres.

**This is a standing requirement of working with this project locally, not a one-off fix for a specific incident** — because `supabase db reset` wipes `_prisma_migrations` along with everything else every time, this exact P3005 will resurface after every future reset. The migration file itself only needs to exist once (it's already committed); the two-command sequence above is what you repeat each time you reset.

**One distinction worth being precise about, since the word "reset" refers to two different tools here**: `npx prisma migrate reset` (Prisma's own command, used when a migration file's checksum no longer matches what was recorded — see "Troubleshooting" below) does **not** require this two-command sequence afterward. It only touches Prisma-managed schema objects and replays your migration history through normal application, so `00_local_baseline` applies in sequence like any other migration — no separate `resolve --applied` needed. It's specifically `supabase db reset` (which tears down and rebuilds the entire local Postgres/Auth/Storage stack from scratch) that requires the extra step, because that's the one that wipes `_prisma_migrations` down to nothing.

### What a shadow database is, and why Prisma needs one

**What**: a second, temporary Postgres database that Prisma Migrate creates behind the scenes purely to _compute_ a migration diff — it's never used to store real application data, and your NestJS app never connects to it. Think of it like a scratchpad or a draft: when Prisma wants to answer "if I apply these SQL files in order, what will the database end up looking like?", it doesn't guess — it actually builds a real, disposable copy, applies the SQL for real, looks at the result, then throws the copy away. The shadow database is that disposable copy.

**Why it's needed**: to know what your schema will look like _after_ applying a set of migrations, Prisma can't just read the SQL files and reason about them abstractly — SQL's actual effects (a column type change, an enum value addition, a constraint) depend on Postgres actually executing it. So `prisma migrate dev` and `prisma migrate diff --from-migrations` replay your entire migration history against a real, throwaway Postgres database, inspect the resulting structure, and diff _that_ against `schema.prisma` — that replayed copy is the shadow database. Without one, most of Migrate's commands can't run at all (this is exactly the class of `P3018`/`P1000` errors in the table below).

**Why it has to be local, not a second hosted Supabase project**: creating/dropping a database is exactly the kind of privileged operation Supabase's pooler intentionally restricts on hosted projects (see the table above) — and even where it's technically possible, using a second billable cloud project as scratch space that gets wiped on every migration is wasteful and slow. A local Postgres instance you fully control is disposable by design, which is the actual property you want from something that exists purely to be repeatedly blown away and rebuilt.

**How does this apply to this project?**: everything above is the general concept — here's exactly what it looks like in Natours specifically. There's no separate, special piece of shadow-database infrastructure here at all. It's the same local Postgres that `supabase start` already gives you, running in Docker on your machine at `127.0.0.1:54322` — the exact instance you also use for regular development. Concretely:

- `apps/api/.env` sets `DATABASE_URL` to that local instance — and, deliberately, sets **nothing else** for the shadow database.
- `apps/api/prisma.config.ts` reads an optional `DATABASE_SHADOW_URL` and only includes `shadowDatabaseUrl` in its config when that variable is actually set. **This has to use Node's own `process.env`, not Prisma's `env()` helper** — `env()` (imported from `prisma/config`) is strict and throws immediately if the variable isn't set at all, which defeats the point of making it optional; `process.env.X` returns `undefined` for a missing key without complaint:

  ```ts
  const shadowDatabaseUrl = process.env.DATABASE_SHADOW_URL; // NOT env() — that throws when unset

  export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
      url: env('DATABASE_URL'), // required — fine to use the strict helper here
      ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
    },
    // ...
  });
  ```

  Since local Supabase's `postgres` role has full, unrestricted privileges (unlike the hosted project's — see the table above), leaving this unset lets Prisma manage the shadow database entirely on its own.

- When you run `npx prisma migrate dev` (or `migrate diff --from-migrations`), here's the literal sequence that happens on your machine: Prisma connects to `DATABASE_URL`'s server, **creates a brand-new, separate, temporary database on it** (something like `prisma_migrate_shadow_db_<random>` — never your real `postgres` database), replays every file in `prisma/migrations/` into that temporary database, compares the result against `schema.prisma`, and then deletes the temporary database entirely. Your actual `reviews`, `bookings`, etc. tables are never touched during this comparison step, only afterward, once the real migration is actually applied for real.
- This same "create a temporary database, use it, delete it" operation is exactly the privileged action that fails with `P3016` ownership errors when attempted against the live Supabase project (see "Incident History" below) — hosted Supabase's `postgres` role isn't allowed to create databases on that pooler. That's why the shadow database has to be local at all.

**A concrete mistake worth knowing about, because it's easy to make**: an earlier version of this project's setup explicitly set `DATABASE_SHADOW_URL` to the same value as `DATABASE_URL`, reasoning that "they're both local anyway, so it doesn't matter." It does matter — Prisma checks whether the two URLs are identical and refuses to proceed if they are, on several commands (including ones like `migrate status` that don't even need a shadow database), because the shadow-database mechanism involves creating and dropping databases in a way that would be genuinely dangerous if it ever accidentally targeted real data:

```
Error: The shadow database you configured appears to be the same as the main database.
Please specify another shadow database.
```

The fix isn't to point `DATABASE_SHADOW_URL` at a *different* local database name — it's simpler than that: don't set it at all for local development, and let Prisma's automatic creation handle it, exactly as described above.

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
# 2. Generate and apply the migration locally (Prisma auto-manages a
#    temporary shadow database on this same local connection — see
#    "Local Development Environment" above)
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
psql "$DATABASE_URL" -f prisma/migrations/1_add_your_change/migration.sql

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
psql "$DATABASE_URL" -c "
SELECT n.nspname, t.typname FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'auth' AND t.typtype = 'e';
"
```

**Note**: Foreign keys _referencing_ `auth.users` (e.g., `profiles_id_fkey`, `bookings_customer_id_fkey`) are fine to keep in your own migrations — they don't create or alter anything in `auth`, they only point at it.

### When a migration *directly uses* a Supabase-owned object, not just references it

`externalTables`/`enums.external` above solves one specific problem: keeping Migrate from trying to *manage* Supabase's own objects. It does **not** solve a different, related problem — a migration that *actively uses* a Supabase-owned function, extension, or table as part of creating your own schema. `0_baseline` does this in three places: `tours.created_by UUID DEFAULT auth.uid()` (a Supabase Auth function), `locations.geog geography` (a PostGIS type), and a foreign key into `auth.users(id)` (a Supabase Auth table).

**Why this only breaks in the shadow database, never on local or live directly**: Postgres schemas, extensions, and functions are scoped **per-database**, not per-server. Your real local `postgres` database and the live project both have `auth.uid()`, PostGIS, and `auth.users` — Supabase's own bootstrap process put them there. But `prisma migrate dev`/`migrate diff --from-migrations` compute their diff by replaying your full migration history into a **brand-new, separate database** on the same Postgres server (see "What a shadow database is" above) — and a fresh sibling database shares none of that with the database it was created next to. So `0_baseline` fails with errors like `schema "auth" does not exist`, `type "geography" does not exist`, or `relation "auth.users" does not exist` — not because anything is actually wrong with your real databases, but because the shadow database has never seen Supabase's bootstrap at all.

**The fix: a guarded stub, added directly at the top of the migration that needs it** — not a separate earlier-sorting migration file (Prisma's folder-name sorting is natural-sort for the hand-named migrations in this project's early history, timestamp-prefixed for everything `migrate dev` generates from here on — mixing the two makes "which one runs first" genuinely hard to predict without checking, so don't rely on file ordering to solve this). `0_baseline/migration.sql` now opens with:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
      AS $func$ SELECT NULL::uuid $func$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE EXTENSION postgis;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid PRIMARY KEY
    );
  END IF;
END $$;
```

**The one rule that makes this safe, and it's not optional**: every check happens in `pg_catalog` *inside the `IF` condition*, and the `CREATE` statement only runs when the object is genuinely absent. This matters for a reason that's easy to miss — Postgres checks whether you have `CREATE` privilege on a schema **before** it even evaluates whether the object already exists. A bare `CREATE TABLE IF NOT EXISTS auth.users (...)` still fails with `permission denied for schema auth` on your real databases, even though the table is already there — because `postgres` doesn't own `auth` there (same restriction as the `P3016` errors earlier), and Postgres checks the privilege first regardless of `IF NOT EXISTS`. Wrapping the check in PL/pgSQL means the `CREATE` statement is never even sent to Postgres's executor when the condition is false — no privilege check ever happens, because nothing was asked of Postgres at all. This is the actual mechanism that makes the stub a true no-op on local/live: not "it's harmless if it runs," but "it never runs there in the first place."

**If a future feature introduces a new dependency on a Supabase-owned object**, extend this same block rather than writing a new one from scratch — add another `IF NOT EXISTS (...) THEN CREATE ... END IF;` following the exact same shape. A quick way to spot whether a new migration needs this at all:

```bash
grep -E "auth\.[a-z_]+\(\)|geography|geometry|REFERENCES \"auth\"" prisma/migrations/<new_migration>/migration.sql
```

If nothing matches, no shim needed for that migration.

### A related lesson: dropping a column silently drops its indexes too

This is a standard, documented PostgreSQL behavior — not a Prisma quirk — but it's easy to miss when reviewing a migration for "does the end state look right," which is exactly what happened in `1_add_transfer_status`. It originally did:

```sql
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "billing"."TransferStatus" NOT NULL DEFAULT 'PENDING',
...
```

Checking only "does the `status` column end up with the right type and default" said yes — and it does. What that check misses: **Postgres automatically drops any index defined on a column the instant that column is dropped**, and nothing about `ADD COLUMN` afterward recreates it. `0_baseline` creates `platform_transfers_status_idx` on this exact column; this migration silently destroyed it as a side effect, invisible until a much later `migrate dev` run recreated the index automatically to reconcile the gap — genuinely correct behavior on Prisma's part, but confusing to encounter without knowing why.

**The fix, and the general pattern worth remembering**: prefer `ALTER COLUMN ... TYPE ... USING ...` over `DROP COLUMN` + `ADD COLUMN` whenever a column's type needs to change but the column itself should persist:

```sql
ALTER TABLE "billing"."platform_transfers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" TYPE "billing"."TransferStatus" USING "status"::text::"billing"."TransferStatus",
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "succeeded_at" SET DATA TYPE TIMESTAMP(3);
```

Same resulting column shape, but the column (and anything depending on it — indexes, but also views or foreign keys referencing it) is never actually destroyed in the process. Worth checking for this pattern any time you review a generated migration that drops and re-adds a column of the same name.

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
| `P3005: The database schema is not empty`                                       | Fresh local database — Supabase's own system schemas already exist but Prisma has no migration history yet                | Run `npx prisma migrate resolve --applied 00_local_baseline` first — see "Local Development Environment" above                                |
| `P3006: Migration failed to apply`                                             | Baseline migration has unsupported SQL, or references objects the shadow DB doesn't have                           | Use `prisma migrate diff` + `resolve --applied`, or check for stale statements left over from a re-baselined `0_baseline`                     |
| `P3016: must be owner of table/type "..."`                                     | Migrate's shadow-DB reset tried to touch a Supabase-owned `auth.*` object                                          | Add the object to `tables.external`/`enums.external` in `prisma.config.ts` — see the section above                                            |
| `schema "auth" does not exist` / `type "geography" does not exist` / `relation "auth.users" does not exist` (during shadow-DB replay) | A migration directly *uses* a Supabase-owned function/extension/table, which the fresh shadow database never has | Add a guarded stub to the top of the relevant migration — see "When a migration directly uses a Supabase-owned object" above |
| `permission denied for schema auth` (after adding a stub like the above) | Used a bare `CREATE ... IF NOT EXISTS` instead of a `pg_catalog` check inside `IF` — Postgres checks privilege before existence | Wrap the `CREATE` in `IF NOT EXISTS (SELECT ... FROM pg_catalog...) THEN ... END IF` so it's never sent to Postgres at all on databases where you lack privilege — see the same section above |
| `P3017: Migration could not be found`                                          | Migration directory missing                                                                                        | Ensure the migration folder exists in `prisma/migrations/`                                                                                    |
| `P3018: Failed to apply migration to shadow database`                          | Shadow database issue                                                                                              | Try `supabase db reset` (local only) to get a clean shadow DB, then retry — remember this also requires re-running `migrate resolve --applied 00_local_baseline` before your next `migrate deploy`/`migrate dev` |
| `The shadow database you configured appears to be the same as the main database` | `DATABASE_SHADOW_URL` is explicitly set to the same value as `DATABASE_URL`                                      | Don't set `DATABASE_SHADOW_URL` at all for local development — remove it from `.env` and let Prisma auto-create its own temporary shadow database (see "Local Development Environment" above) |
| `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_SHADOW_URL` | `prisma.config.ts` used Prisma's `env()` helper for an optional variable — `env()` throws when the variable is missing entirely | Use `process.env.DATABASE_SHADOW_URL` instead of `env('DATABASE_SHADOW_URL')` for this one variable — see the code snippet under "Local Development Environment" above |
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

Then generate and apply the migration — against **local Supabase**, using `DATABASE_URL` from `.env` as-is (Prisma auto-manages its own temporary shadow database on this same connection — see "Local Development Environment" above for why this is safe to do freely here):

```bash
npx prisma migrate dev --name add_review_moderation_flag
```

This diffs your change against the shadow database, writes `prisma/migrations/<timestamp>_add_review_moderation_flag/migration.sql`, applies it to local Supabase, and regenerates the Prisma Client — all in one command.

**If you realize mid-feature that you forgot a field** (this happened for real building the Reviews module — `bookingId` was missing from `schema.prisma` until after `isFlagged`'s migration had already been generated and applied): **create a second, separate migration — never edit the one you already generated**, even though it's for "the same feature." A migration tracks one schema change at a point in time, not a project-management unit; it's completely normal, and already precedented elsewhere in this project's own history, for one feature to span several small migrations as the design firms up.

```bash
# Add the missing field to schema.prisma, then:
npx prisma migrate dev --name add_review_booking_id
```

The only time editing an *existing* migration file is reasonable is when it has never been shared or deployed anywhere beyond your own local database (the same test git applies to amending a commit) — and even then, generating a new one is usually just as easy and avoids having to re-verify the whole shadow-database replay chain. When in doubt, generate a new migration.

**If your editor doesn't show a newly-added field's type right after this** (e.g., autocomplete doesn't offer `bookingId` yet) — this is almost always the TypeScript language server holding a stale cached snapshot of the generated client, not a real problem. Try "TypeScript: Restart TS Server" from your editor's command palette first. If the type is still genuinely missing after that, run generation manually:
```bash
npx prisma generate
```
`migrate dev` already runs this automatically as its last step — you should rarely need to run it by hand — but it's a safe, idempotent command to reach for any time you suspect the generated client is out of sync with `schema.prisma`.

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

Inspect the result directly in local Supabase Studio (`http://127.0.0.1:54323`) — this is disposable data, so poke at it freely, and `supabase db reset` whenever you want a clean slate (remember to run `npx prisma migrate resolve --applied 00_local_baseline` before your next `migrate deploy`/`migrate dev` afterward — see "Local Development Environment" above).

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

## 🧱 Service, Controller, and Module Design Lessons

General patterns worth following in every service/controller going forward, surfaced while building the Reviews module (`apps/api/src/reviews/`) — worth reading once, then treating as a checklist for the next feature.

### Order your validation checks deliberately, not just "does it work"

`ReviewsService.create()` went through several rounds of fixes because checks were ordered by what was easiest to write first, not by what's actually safe to evaluate first. The general rule: **check existence before touching any property on the thing that might not exist**, then ownership, then business-rule state, in that order:

```ts
if (!currentBooking) {
  throw new NotFoundException('Booking not found');        // 1. Does it exist at all?
}
if (currentBooking.customerId !== user.id) {
  throw new ForbiddenException('...');                       // 2. Do they own it?
}
if (currentBooking.status !== BookingStatus.COMPLETED) {
  throw new BadRequestException('...');                       // 3. Is it in the right state?
}
```
A real bug this project hit from getting this wrong: `currentBooking?.customerId !== user.id` (optional chaining) *looked* safe because it couldn't crash, but a nonexistent booking silently produced `undefined !== user.id` → `true` → a misleading `403 Forbidden` instead of the correct `404 Not Found`. Optional chaining prevents a crash; it doesn't make the *logic* correct. When you find yourself reaching for `?.` to avoid a crash, stop and ask whether that case deserves its own explicit, earlier check instead.

### Derive values from trusted relations — don't accept them twice

The Reviews feature briefly had both a `:tourId` URL param *and* a `bookingId` whose own record already knows its tour — two independent sources of truth that could disagree, with nothing stopping a client from sending mismatched values. The fix wasn't validating that they matched; it was removing the redundant input entirely and deriving `tourId` from the booking's own relation:
```ts
const currentBooking = await this.prisma.booking.findUnique({
  where: { id: bookingId },
  include: { tourSchedule: { select: { tourId: true } } },
});
// tourId comes from here — never from client-supplied input
```
If two pieces of data *can* disagree, prefer eliminating one of them over adding a check that they match.

### A `?.` that quietly produces `undefined` can hide a real data problem

`tourId: currentBooking.tourSchedule?.tourId` compiles fine and never crashes — but if `tourSchedule` is ever genuinely `null`, Prisma treats the resulting `undefined` as "omit this field," silently creating a row with `tour_id = NULL` instead of failing loudly. Any time `?.` sits directly inside data you're about to persist, ask whether a missing value there is actually an error condition that deserves its own explicit guard and exception, rather than being allowed to flow silently into the database.

### A database constraint prevents bad data; your code decides how that failure is presented

A `@unique` constraint (or a foreign key, a check constraint) is what actually makes a rule unbreakable — not an application-level "check, then write," which always has a race-condition window between the check and the write. But the constraint firing produces a generic, low-level database error, not a clean API response. Both pieces are needed, and they do different jobs: the constraint enforces correctness, your `try/catch` around the write translates its failure into the specific HTTP response your API should give.
```ts
try {
  return await this.prisma.review.create({ data: { ... } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException('...');
  }
  throw error;
}
```
Keep the fast application-level check too (it gives a quicker, friendlier rejection in the common, non-racy case) — just don't treat it as sufficient on its own for anything a unique constraint could also enforce.

### Accept the narrowest type a service actually needs — let structural typing do the work

`ReviewsService.create()` declares its user parameter as `{ id: string, role: AppRole }`, while the controller passes the full `UserPayload` object. This isn't a mismatch to fix — TypeScript's structural typing means any object *containing at least* those two fields satisfies the narrower type automatically, no casting or manual destructuring required. The payoff: the service's signature is an honest, minimal declaration of exactly what it depends on, independent of whatever other fields `UserPayload` happens to carry elsewhere in the app. When a service only needs a couple of fields off a larger object, declare the narrow inline shape you need rather than importing and requiring the full concrete type.

### Validate and whitelist DTOs globally — then trust that it's actually on

`class-validator` decorators (`@IsInt()`, `@Min()`, `@MaxLength()`, etc.) do nothing at runtime unless a global `ValidationPipe` is registered — they're inert metadata otherwise. This project's `main.ts` already has it configured correctly:
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
```
`whitelist: true` is what actually strips (and `forbidNonWhitelisted` rejects outright) any field a client sends that isn't declared on the DTO — this is what stops a client from sneaking `isFlagged: true` into a review-creation request even though the DTO class itself never mentions it. A DTO "looking" clean only matters because this global configuration is what enforces it; the two are a pair, not independent safeguards.

### A `BigInt(...)`/`parseInt(...)` on a URL param can throw before your service ever runs

`BigInt(bookingId)` in a controller throws a raw, uncaught `SyntaxError` for a non-numeric param — before any of your service's careful error handling gets a chance to run, producing a `500` for what should obviously be a `400`. Wrap any such parsing at the boundary where client input first gets coerced to a different type:
```ts
let parsedBookingId: bigint;
try {
  parsedBookingId = BigInt(bookingId);
} catch {
  throw new BadRequestException('Invalid booking ID');
}
```

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

This covers the git mechanics only — for the actual database-aware steps (syncing local first, deciding whether a migration is needed, testing locally before deploying), see "Building a Feature: End-to-End Workflow" above.

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

**Issue**: Database schema out of sync, migration won't apply, or a Prisma error code (`P1000`, `P3005`, `P3006`, `P3016`, `P3018`, etc.)

See "Database Migration" → "Common Migration Errors & Fixes" above — that table covers every migration-related error this project has actually hit, with the specific fix for each, rather than generic advice here.

**Issue**: Prisma client not generated

```bash
cd apps/api
npx prisma generate
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

**Last Updated**: October 4, 2026

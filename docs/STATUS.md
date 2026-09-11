<div align="center">
<img src="../public/logo_green_with_text_2x.svg" alt="Natours Logo" width="300" height="60" />
<p><strong>Modern Tour Booking Platform · Monorepo · Marketplace Architecture</strong></p>

</div>

# Project Status

> **Purpose**: This document serves as a single source of truth for the current state of the Natours project. It is updated with every meaningful commit to provide clear context for both human developers and AI agents. It answers: "What's done, what's broken, and what's next?"

---

## 📌 Now (Current Focus)

**Phase 1: Complete Core Business Modules (High Priority)**

| Module                         | Status               | Notes                                                                                     |
| :----------------------------- | :------------------- | :---------------------------------------------------------------------------------------- |
| **Authentication**             | ✅ Complete          | JWT with Supabase JWKS (ES256), `@Public()`, `@Roles()`, `@CurrentUser()`                 |
| **Tours Module**               | ✅ Complete          | CRUD, availability rules, exceptions, partner isolation, soft delete                      |
| **Bookings Module**            | ✅ Complete          | Create, confirm, cancel, expire, seat management, Stripe Checkout                         |
| **Booking Status Enhancement** | ✅ Complete          | Added `ONGOING`, `COMPLETED`, `NO_SHOW` statuses; check-in endpoint; auto-status cron job |
| **Payments Module**            | ✅ Complete          | Stripe Connect integration, webhooks, platform transfers                                  |
| **Partners Module**            | ✅ Complete          | Stripe Connect onboarding, account linking, status tracking                               |
| **Reviews Module**             | ⬜ **Next**          | Rating and review management for completed tours                                          |
| **Wishlists Module**           | ⬜ **After Reviews** | User wishlist management for favorite tours                                               |
| **Profiles Module**            | ⬜ **Optional**      | User profile management (already has `Profile` model, may be handled by frontend)         |

**Current Focus**: Building the **Reviews Module** to allow customers to leave feedback on completed tours.

---

## ✅ Last Done

### Commit History (Most Recent First)

| Date             | Commit                                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :--------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sep 11, 2026** | `docs(readme): add local-first development workflow with beginner-friendly explanations` | Added `README.md` → "Local Development Environment" (what local Supabase is vs. the live project, and a full what/why explanation of Prisma's shadow database, including a project-specific walkthrough of exactly how `DATABASE_URL`/`DATABASE_SHADOW_URL` and `prisma.config.ts` wire into it) and "Building a Feature: End-to-End Workflow" (the full NestJS module → schema change → local migration → implementation → testing → deploy sequence, using the planned Reviews module as a worked example). Added a "Step 0: Sync your local environment" step explaining the correct mental model for starting new work — syncing means re-running the migration _files_ locally (`git pull` + `prisma migrate status`/`deploy`), not introspecting the live database's current structure, with a periodic drift check (`migrate status` against the live URL) as a separate, defensive habit. Content written for a reader newer to backend engineering specifically, following up on the recovery work and incident writeup already documented.                                                                                                                                                                                                                                                                                                                                   |
| **Sep 11, 2026** | `chore: stop tracking generated Prisma Client output`                                    | Removed `apps/api/src/generated/prisma/` from git tracking and added it to `.gitignore`. Generated Prisma Client output was showing as modified on nearly every `prisma generate` run — including files for Supabase's own `auth.*` models (`User`, `Session`, `OauthClient`, etc.) despite those being marked external in `prisma.config.ts` — because Prisma's generator rewrites the entire bundled client as one interconnected unit rather than patching individual files. Since the output is fully and deterministically reproducible from `schema.prisma`, it doesn't need to be tracked. Added a `postinstall: prisma generate` script so a fresh `pnpm install` always produces a correct client automatically.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Sep 11, 2026** | `fix(prisma): recover dropped business-domain tables and reconcile migration history`    | Discovered 12 tables (`account.profiles`, `tour.bookings`, `tour.partners`, `tour.tours`, `tour.reviews`, `tour.tour_guides`, `tour.tour_locations`, `tour.tour_media`, `tour.tour_schedules`, `tour.wishlists`, `tour.availability_rules`, `tour.availability_exceptions`) and the `tour.media_type` enum had been dropped from the live Supabase database outside of Prisma's tracked migration history. Recovered by diffing the live database against the full `schema.prisma` (`migrate diff --from-config-datasource --to-schema`) and applying the resulting additive script directly via `psql`. Cleared orphaned rows in `billing.payments`/`billing.platform_transfers` left over from before the drop and re-added their foreign keys. Added `auth.custom_oauth_providers`, `auth.oauth_authorizations`, `auth.oauth_client_states`, `auth.oauth_consents`, `auth.webauthn_challenges`, `auth.webauthn_credentials` (tables) and 4 related enums to `prisma.config.ts`'s `externalTables`/`enums.external` config so Migrate stops trying to manage Supabase's own Auth objects. Verified via `prisma db pull` (45/45 models restored) and a clean `migrate diff` (empty output). Switched local development to the Supabase CLI's local stack (`supabase start`) going forward; see `README.md` → "Database Migration" for the full incident writeup and revised workflow. |
| **Sep 9, 2026**  | `fix(prisma): add missing payment schema migration to sync history`                      | Added `3_sync_payment_schema` migration to capture `billing` schema changes (`platform_transfers` ALTER TABLE, index renames, timestamp data type changes for `partners`) that were applied manually but never recorded in migration history. Marked as applied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Sep 9, 2026**  | `fix(prisma): add missing migration for booking statuses after manual addition`          | Added `2_add_booking_statuses` migration file to sync migration history with the database. The enum values (`ONGOING`, `COMPLETED`, `NO_SHOW`) were already added manually via Supabase SQL Editor. Marked migration as applied using `prisma migrate resolve --applied`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Sep 9, 2026**  | `fix(prisma): remove auth schema from baseline and transfer status migrations`           | Cleaned up migration history by removing all `auth` schema changes from `0_baseline` and `1_add_transfer_status`. This prevents future conflicts with Supabase's `auth` schema during database restoration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Sep 7, 2026**  | `feat(api): enhance booking status flow with check-in and auto-status transitions`       | Added `ONGOING`, `COMPLETED`, `NO_SHOW` booking statuses; implemented check-in endpoint; added daily cron job to auto-transition `CONFIRMED → NO_SHOW` and `ONGOING → COMPLETED`; updated Prisma schema and generated client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Aug 23, 2026** | `docs: add comprehensive README with project overview and branding`                      | Added detailed `README.md` with project overview, business model, architecture, Stripe Connect integration, database schema, migration guide, and Natours logo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Aug 22, 2026** | `feat(api): implement Stripe Connect marketplace payment flow`                           | Full Stripe Connect integration: partner onboarding, payment splitting, `PlatformTransfer` tracking, webhooks for `transfer.created`, `account.updated`, `charge.refunded`, and `payment_intent.payment_failed`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Aug 21, 2026** | `fix(api): complete payment status synchronization and webhook handling`                 | Fixed payment status updates across all scenarios: success, failure, refund, cancellation, expiration. Added `test-expire` endpoint for manual testing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Aug 21, 2026** | `feat(api): implement complete Bookings module with Stripe payment integration`          | Complete booking lifecycle: availability checking, on-demand schedule creation, Stripe Checkout, webhook handling, expiration cron job, and `PaymentsService`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Aug 19, 2026** | `fix(api): resolve enum mapping and BigInt serialization issues`                         | Fixed `TourDifficulty` enum mapping with `@@map`, added `BigIntInterceptor` to handle `BigInt` serialization, regenerated Prisma Client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Jul 8, 2026**  | `feat(api): implement authentication and core tours module`                              | JWT authentication with JWKS (ES256), `JwtAuthGuard`, `@Roles()`, `@Public()`, `@CurrentUser()`, `ToursModule` with CRUD operations, partner isolation, role-based access, and soft delete.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Jul 8, 2026**  | `feat(api): introspect full database schema for all schemas`                             | Complete Prisma schema with models from `account`, `auth`, `billing`, `geography`, `public`, `tour`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Jul 7, 2026**  | `feat(api): integrate Prisma ORM with Supabase database`                                 | Prisma setup: `db pull`, `moduleFormat: "cjs"`, Session Pooler connection, `schemas = ["public", "auth"]`, generated Prisma Client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Jul 6, 2026**  | `feat(api): scaffold NestJS backend app in monorepo`                                     | Generated NestJS app in `apps/api` using `@nestjs/cli` with `pnpm`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## ⚠️ Caveats & Known Issues

| Issue                         | Severity  | Description                                                                                                                                              | Workaround / Fix                                                       |
| :---------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Stripe transfer ID update** | 🟡 Medium | `stripe_transfer_id` is initially set to `'pending'` and updated via `transfer.created` webhook. Works correctly but depends on webhook reliability.     | ✅ Fixed – `transfer_group` is now used to link transfers to bookings. |
| **`test-expire` endpoint**    | 🟢 Low    | Manual expiration endpoint exists for testing but is marked `@Public()` – safe for development.                                                          | Keep for testing, remove in production.                                |
| **Migration history**         | 🟡 Medium | Baseline migration (`0_baseline`) contains unsupported SQL. Manual migrations (`1_add_transfer_status`) are used instead.                                | Documented in `README.md` → "Database Migration" → "Troubleshooting".  |
| **Webhook events**            | 🟢 Low    | Several Stripe events are unhandled (`charge.succeeded`, `payment_intent.succeeded`, etc.) – they are informational and don't require action.            | ✅ Safe to ignore – they don't affect core flow.                       |
| **`TransferStatus` enum**     | 🟢 Low    | Enum was created manually in the database via raw SQL. Prisma now recognizes it.                                                                         | ✅ Fixed – `prisma migrate resolve` marks it as applied.               |
| **`NO_SHOW` vs `COMPLETED`**  | 🟢 Low    | `NO_SHOW` is triggered automatically when check-in doesn't happen. `COMPLETED` is triggered after the tour ends. Both are handled by the daily cron job. | ✅ Implemented – both are automated.                                   |

---

## 🎯 Next Steps

### Priority 1: Reviews Module

**Goal**: Implement customer reviews for completed tours.

| Task                         | Description                                                                                  | Effort  |
| :--------------------------- | :------------------------------------------------------------------------------------------- | :------ |
| **1.1 Generate Module**      | `nest g module reviews`, `nest g controller reviews`, `nest g service reviews`               | 0.5 day |
| **1.2 Define DTOs**          | `CreateReviewDto`, `UpdateReviewDto` with validation                                         | 0.5 day |
| **1.3 Implement Service**    | Create, read, update, delete with business rules (one review per booking, must be completed) | 1 day   |
| **1.4 Implement Controller** | Endpoints with role-based access (customer writes, admin moderates)                          | 0.5 day |
| **1.5 Average Rating**       | Calculate and return average rating for a tour                                               | 0.5 day |
| **1.6 Testing**              | Unit tests and manual testing with `curl`                                                    | 1 day   |

**Estimated**: ~4 days

---

### Priority 2: Wishlists Module

**Goal**: Allow customers to save favorite tours.

| Task                         | Description                                                                          | Effort  |
| :--------------------------- | :----------------------------------------------------------------------------------- | :------ |
| **2.1 Generate Module**      | `nest g module wishlists`, `nest g controller wishlists`, `nest g service wishlists` | 0.5 day |
| **2.2 Define DTOs**          | `WishlistDto` with validation                                                        | 0.5 day |
| **2.3 Implement Service**    | Add, remove, list, check if in wishlist                                              | 1 day   |
| **2.4 Implement Controller** | Endpoints with role-based access (customer only)                                     | 0.5 day |
| **2.5 Testing**              | Unit tests and manual testing with `curl`                                            | 0.5 day |

**Estimated**: ~3 days

---

### Priority 3: API Refinement & Integration

| Task                             | Description                                       | Effort  |
| :------------------------------- | :------------------------------------------------ | :------ |
| **3.1 Swagger/OpenAPI**          | Add `@nestjs/swagger` for auto-generated API docs | 1 day   |
| **3.2 Global Exception Filters** | Standardize error responses                       | 0.5 day |
| **3.3 CORS Configuration**       | Allow frontend domains                            | 0.5 day |

**Estimated**: ~2 days

---

### Priority 4: Testing & Deployment

| Task                      | Description                               | Effort |
| :------------------------ | :---------------------------------------- | :----- |
| **4.1 Unit Tests**        | Services, controllers, guards             | 3 days |
| **4.2 Integration Tests** | Database, webhooks, Stripe mocks          | 3 days |
| **4.3 E2E Tests**         | Full user flows (happy path + edge cases) | 2 days |
| **4.4 Deploy to Render**  | API deployment with environment variables | 1 day  |

**Estimated**: ~9 days

---

## 📊 Milestone Checklist (Aligned with Roadmap)

### Phase 1: Complete Core Business Modules

- [x] Bookings Module
- [x] Booking Status Enhancement (`ONGOING`, `COMPLETED`, `NO_SHOW`, check-in, cron job)
- [x] Payments Module (Stripe integration)
- [x] Partners Module
- [ ] Reviews Module
- [ ] Wishlists Module
- [ ] Profiles Module (optional – handled by auth)

### Phase 2: Database Logic Migration

- [x] Move `handle_expired_bookings` to NestJS (using cron job)
- [x] Move `update_booking_cancelled_and_release_seats` to NestJS (in BookingsService)
- [x] Move `update_booking_expired_and_release_seats` to NestJS (in BookingsService)
- [x] Keep `update_updated_at_column` trigger in database

### Phase 3: API Refinement & Integration

- [ ] Swagger/OpenAPI documentation
- [ ] Global exception filters
- [ ] CORS configuration

### Phase 4: Testing & Deployment

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Deploy to Render

---

## 📝 How to Update This File

After each meaningful commit, update the relevant sections:

1. **Now**: Update with the current focus.
2. **Last Done**: Add a new entry with the commit summary, date, and "why".
3. **Caveats**: Add or remove known issues.
4. **Next**: Adjust priorities if needed.
5. **Milestone Checklist**: Tick off completed items.

---

## 🔄 Last Updated

**Date**: September 11, 2026  
**Author**: Andre Wicaksono  
**Branch**: `feat/nest-js`

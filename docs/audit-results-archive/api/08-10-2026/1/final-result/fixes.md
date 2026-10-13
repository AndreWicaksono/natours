# Backend (`apps/api`) Audit Fixes Report (Oct 13, 2026)

This document records the final state of the fixes applied for the Oct 8 backend audit (9 bugs, 6 best-practice gaps).

**How these fixes were produced**: the first pass implemented the audit's own recommendations. A second review of that first pass found that six of those recommendations were wrong or incomplete (BUG-1, BUG-5, BUG-8, BUG-9, BP-2, BP-4) — they would have failed at runtime, silently lost data, or recorded states that never happened. Those were reworked; the table below shows the **final** behavior, and "Corrections after review" explains what changed and why.

**Verification status**
- Tested manually: create booking → pay → cancel. Booking status and seat count updated; the payment transaction is visible in Stripe.
- Not yet verified: the refund itself (full amount, reversed partner transfer, refunded application fee), the `charge.refunded` webhook arriving after an API-initiated cancel without changing the already-cancelled booking, and the `ONGOING → COMPLETED` cron against a seeded ongoing booking.

## Final state: Before vs. After

| Issue | Before | After | Files Changed |
|:---|:---|:---|:---|
| **BUG-1** ONGOING → COMPLETED cron | Marked *every* ongoing booking completed on each run, ignoring the tour's end date. | Loads ONGOING bookings, computes `startDate + durationDays` in TypeScript, and updates by id (re-asserting `status: ONGOING`). No raw SQL. `@Cron` pinned to `timeZone: 'UTC'`. | `bookings/booking-status.service.ts` |
| **BUG-2** NO_SHOW boundary | Compared against local-time midnight. | Compares against UTC midnight. | `bookings/booking-status.service.ts` |
| **BUG-3** Expiration payment updates | `paymentsService` called inside `$transaction` (separate connection, can't roll back). | Payment statuses updated post-commit, in a loop with per-booking error handling. | `bookings/expiration.service.ts` |
| **BUG-4** Customer tour detail | Partner isolation applied to every non-admin role → 403 for all customers. | Partner isolation applies only to partner roles; customers only see `LIVE` tours (others return 404). | `tours/tours.service.ts` |
| **BUG-5** Paid-booking cancellation | Payment marked `FAILED`. | `REFUNDED` added to `payment_status`. Cancelling a paid booking now issues a real Stripe refund (`reverse_transfer` + `refund_application_fee`) **before** cancelling; the payment is marked `REFUNDED` only after that. Unpaid → `FAILED`. | `prisma/schema.prisma`, `prisma/migrations/20261008093141_add_payment_status_refunded/`, `bookings/bookings.service.ts` |
| **BUG-6** Manual confirm | `PATCH /bookings/:id/confirm` let admins confirm unpaid bookings. | Endpoint removed; confirmation is webhook-only. | `bookings/bookings.controller.ts` |
| **BUG-7** Availability rules | `findFirst` ignored all but one rule. | `findMany`; slots merged and de-duplicated. | `tours/availability.service.ts` |
| **BUG-8** `resumePayment` fee | No `application_fee_amount` (0% commission). | Price and currency come from the tour (same as checkout creation) and `application_fee_amount` is included. Rejects a non-positive price. | `bookings/bookings.service.ts` |
| **BUG-9** Terminal states | Late refund webhook could revert COMPLETED/NO_SHOW bookings; user cancel had no terminal guard. | Users can cancel only `PENDING` or not-yet-started `CONFIRMED` bookings. The refund webhook **always** marks the payment `REFUNDED`, but leaves CANCELLED/EXPIRED/COMPLETED/NO_SHOW bookings unchanged. | `bookings/bookings.service.ts` |
| **BP-1 / BP-2** Webhook logging & idempotency | `console.log`; events could be processed twice. | NestJS `Logger`. Each event is claimed with an atomic insert (`P2002` = duplicate → 200) and the claim is **released if processing fails**, so Stripe's retry reprocesses it. Partial refunds ignored (`charge.refunded` must be true). Duplicate `PlatformTransfer` creation guarded. | `payments/webhooks/stripe-webhook.controller.ts` |
| **BP-3 / BP-4 / BP-5** Clean-up | Stale imports; public `test-expire` open unless `NODE_ENV === 'production'`; error bodies returned with 200. | Unused `JwtAuthGuard` imports removed. `test-expire` is default-deny: only works when `NODE_ENV === 'development'`, otherwise a real 404. `PartnersController` throws `NotFoundException`. | `bookings/bookings.controller.ts`, `partners/partners.controller.ts`, `reviews/reviews.controller.ts` |
| **BP-6** URL config | Code read `SITE_URL`; README documents `APP_URL`. | Standardized on `APP_URL`. | `bookings/bookings.service.ts`, `partners/partners-connect.service.ts` |

## Corrections after review

| Item | Audit's recommendation | Problem | Resolution |
|:---|:---|:---|:---|
| **BUG-1** | Raw SQL with `SET status = 'COMPLETED' WHERE status = 'ONGOING'`. | DB enum labels are lowercase (`'ongoing'`, `'completed'`) and `$queryRaw` bypasses Prisma's enum `@map`, so the query fails at runtime. | Date arithmetic in TypeScript, update through the typed client. |
| **BUG-5** | Mark payment `REFUNDED` on cancelling a paid booking, "even if the Stripe refund hasn't been issued yet". | The database claimed a refund that never happened; no code anywhere called Stripe's refund API. | Real refund first; status changes only if it succeeds. |
| **BUG-8** | Re-include `application_fee_amount`. | `resumePayment` priced from `booking.pricePaid`, a column nothing ever writes — the price (and fee) were always 0, and Stripe rejects a $0 session. | Price and currency from the tour. |
| **BUG-9** | Early-return for terminal states. | Returning before the payment update left a refunded COMPLETED booking showing `SUCCEEDED` forever; the user-facing `cancelBooking` had no equivalent guard. (The write-up's heading also says "ONGOING" while its fix covers COMPLETED/NO_SHOW.) | Payment always updated; booking guarded in both paths. |
| **BP-2** | Insert the event id before processing. | If processing fails after the insert, Stripe's retry is skipped as a "duplicate" — a paid booking could stay `PENDING` and expire. | Claim/release pattern. |
| **BP-4** | Gate on `NODE_ENV !== 'production'`. | Fails open: an unset or misspelled `NODE_ENV` leaves a public mass-seat-release endpoint callable. | Default-deny on `=== 'development'`. |
| **"Confirmed correct" rows** on seat decrement ("Atomic, no TOCTOU race on seats") | Marked correct. | The availability check runs outside the transaction and the decrement has no guard, so concurrent bookings can oversell. | Listed under open item 1 below. |

## Known open items (found during review, not yet fixed)

1. **Seat overbooking** — guard the decrement: `updateMany({ where: { id, seatsAvailable: { gte: n } }, ... })` and fail when `count === 0`.
2. **Paid-after-expiry** — bookings expire after 15 minutes but the Stripe Checkout session stays payable (24h default). A late payment confirms nothing (`confirmBooking` skips non-`PENDING`) yet still records `SUCCEEDED` and a `PlatformTransfer`. Fix: expire the session in the cron, or align the timeouts (Stripe minimum is 30 min), and auto-refund payments that can't be confirmed. The expiration cron's update should also be conditional on `status: PENDING`.
3. **Cancelling a `PENDING` booking doesn't expire its Checkout session** — it can still be paid afterwards (same family as item 2).
4. **Partner authorization gap** — `POST /partners/:id/onboarding` and `GET /partners/:id/connect-status` never check `user.partnerId === id`, so any `PARTNER_ADMIN` can act on another partner.
5. **PII in tour detail** — `ToursService.findOne` returns the full `partner` record (Stripe account id, contact email) plus reviewer and creator emails to customers, and doesn't filter flagged reviews.
6. **`Review` still declares `@@unique([tourId, customerId])`** — blocks reviewing the same tour from a second booking and contradicts the `bookingId @unique` design. Needs a migration to drop it.
7. **`PlatformTransfer` isn't reversed on refund** — Stripe reverses the money, but `TransferStatus` has no reversed state (needs an enum value + migration).
8. **Webhook idempotency has one narrow race** — a concurrent duplicate delivery can answer 200 while the first attempt fails. Closing it needs a processing/done status column on `stripe_webhook_events`.

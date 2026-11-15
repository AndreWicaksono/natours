# Backend Audit Fixes Report: Open Items (Nov 15, 2026)

This document records the final state of the fixes for the **eight open items** found while reviewing the fixes from the [08-10-2026 audit](../../../08-10-2026/1/final-result/fixes.md). The reasoning behind each item is in [`0. summary.md`](../analysis/0.%20summary.md) and [`1. detail.md`](../analysis/1.%20detail.md).

Item numbering (OI-1 to OI-8) follows the "Known open items" list of the 08-10-2026 report, so each item can be traced across both audits. While implementing them, eight more problems in the same code surfaced; they are listed under "Additional fixes made while implementing".

**Verification status**: every line of the checklist at the end of this document was run on a local Supabase instance with Stripe in test mode, and the evidence is written next to each line.

## Final state: Before vs. After

| Item | Before | After | Files Changed |
|:---|:---|:---|:---|
| **OI-1** Seat overbooking | Availability was read outside the transaction, then seats were decremented with an unconditional update. Two concurrent bookings for the last seat both succeeded and `seats_available` went negative. | Seats are claimed with a single conditional `updateMany` (`seatsAvailable >= n`). If another request took them first, the count is 0 and the customer gets "Not enough seats available." | `bookings/bookings.service.ts` |
| **OI-2** Paid after expiry | Seats were held 15 minutes, but the Stripe Checkout Session stayed payable for 24 hours. A late payment recorded `SUCCEEDED` and a `PlatformTransfer` for a booking that was already `EXPIRED`, and the customer was charged for nothing. The expiry paths also overwrote bookings without checking their current status. | The Checkout Session and the seat hold share one expiry (31 minutes; Stripe's minimum is 30). A payment that arrives for an `EXPIRED` or `CANCELLED` booking is refunded in full automatically (partner transfer reversed, platform fee returned), the payment is marked `REFUNDED`, and no `PlatformTransfer` is created. `confirmBooking` now returns the resulting status, so a retried event is not mistaken for a late payment. `expireBooking` and the expiration cron only touch bookings that are still `PENDING`. | `bookings/bookings.service.ts`, `bookings/expiration.service.ts`, `payments/webhooks/stripe-webhook.controller.ts` |
| **OI-3** Cancelled booking still payable | Cancelling a `PENDING` booking left its Checkout Session open, so it could still be paid afterwards. | Cancelling closes the open session. If a payment still slips through, the OI-2 path refunds it. Resuming a payment creates and saves the new session first, then closes the old one, so the customer can never pay twice. | `bookings/bookings.service.ts` |
| **OI-4** Partner authorization gap | `POST /partners/:id/onboarding` and `GET /partners/:id/connect-status` checked the role but never the partner. Any `PARTNER_ADMIN` could act on any other partner by changing the id in the URL. | `assertCanManagePartner`: `ADMIN` may manage any partner, `PARTNER_ADMIN` only their own `partnerId`. The check runs before the database lookup, so a foreign id and a nonexistent id both return 403. | `partners/partners.controller.ts` |
| **OI-5** Personal data in tour detail | Every customer received the full `partner` record (Stripe account id, contact email), every reviewer's email, the tour creator's email, and flagged reviews. | The response is shaped by role (table below). Reviews carry the reviewer's first name and avatar instead of an email. | `tours/tours.service.ts` |
| **OI-6** Leftover review constraint | `@@unique([tourId, customerId])` still existed. A customer who booked the same tour twice could not review the second booking, and saw the misleading "already reviewed this booking". | The constraint is removed. `bookingId @unique` is the only uniqueness rule, which is the real business rule (one review per booking). | `prisma/schema.prisma`, migration |
| **OI-7** Transfer not reversed | After a refund the `PlatformTransfer` row still said `SUCCEEDED`, although the partner no longer had the money. | `TransferStatus.REVERSED` is added. Both refund paths (API cancel and the `charge.refunded` webhook) set `SUCCEEDED` rows to `REVERSED`. The update is idempotent and repairs itself if one path fails. | `prisma/schema.prisma`, migration, `bookings/bookings.service.ts` |
| **OI-8** Webhook idempotency race | A claimed event was just a row. A duplicate delivery answered 200 even while the first attempt was still running; if that attempt then failed, Stripe considered the event delivered and it was lost. | A `completed_at` column marks finished events. Completed means 200. In progress means 409 (Stripe retries later). A failed attempt releases its claim. A claim stuck for more than 5 minutes is taken over by the next delivery. | `prisma/schema.prisma`, migration, `payments/webhooks/stripe-webhook.controller.ts` |

### OI-5: what `GET /tours/:id` returns, by role

| Caller | Partner | Tour creator | Reviews |
|:---|:---|:---|:---|
| `CUSTOMER`, `GUIDE`, `LEAD_GUIDE` | `{ id, name }` only | not returned | unflagged only; each has `reviewer: { firstName, avatarUrl }` |
| `PARTNER_ADMIN` | full record | `{ id, email }` | unflagged only; same reviewer shape |
| `ADMIN` | full record | `{ id, email }` | all reviews, including `isFlagged`; same reviewer shape |

Reviewer emails are never returned to anyone. The previous field `reviews[].user` no longer exists; clients should read `reviews[].reviewer`.

## Additional fixes made while implementing

| # | Problem found | Fix |
|:---|:---|:---|
| A1 | In `createBookingWithCheckout`, the price, platform fee and partner Stripe-account checks ran after the booking had been created. A tour whose partner had not finished Stripe onboarding left its seats held until the cron expired the booking. | All validation now happens before any seat is claimed. A tour with no partner returns a clear 400 instead of a Prisma error. |
| A2 | If creating the Stripe Checkout Session failed (network error, Stripe rejection), a `PENDING` booking kept its seats until expiry, with no way to pay for it. | The seats are released immediately (`releaseUnpaidBooking`, conditional on `PENDING`). If saving the payment record fails, the session is expired as well. |
| A3 | Two customers booking the same new departure date at the same moment both tried to create the on-demand schedule. The second insert hit the unique `(tour_id, start_date)` index and returned a 500. | The second request reuses the schedule the first one created. |
| A4 | `resumePayment` left the previous session payable (double-payment risk), and the new session could outlive the booking. | The new session is created and saved first, then the old one is closed. The seat hold moves with the new session. A booking older than 2 hours can no longer be resumed, so repeated resumes cannot hold seats forever. |
| A5 | `confirmBooking` read the status and then wrote it, and silently skipped any booking that was not `PENDING`, so the webhook could not tell "already confirmed" from "expired while paying". | One conditional update; the method returns the resulting status. |
| A6 | `expireBooking` (called by the `checkout.session.expired` event) left the payment `PENDING`, and an expiry event about a replaced session could expire a live, resumed booking. | The payment is marked `FAILED`, and the event is ignored when its session is no longer the booking's current one. |
| A7 | The expiration cron updated bookings it had read earlier without re-checking their status. A booking confirmed in between could be flipped to `EXPIRED` with its seats released. | The update is conditional on `PENDING`; a booking that changed state is skipped. |
| A8 | Found during verification: `assertCanManagePartner` compared `user.partnerId` (a `bigint` at runtime, although `UserPayload` declares `number \| null`) with a `number` from `ParseIntPipe` using `!==`. That comparison is always true across types, so every partner admin was rejected, including the owner. | Both sides are converted with `BigInt()` before comparing. The wrong declared type is tracked as a follow-up (see Remaining limitations). |

## Behavior changes clients should know about

- `bookings.expiresAt` is now about 31 minutes after creation (it was 15) and equals the Stripe session expiry. The UI should say "pay within 30 minutes".
- `GET /tours/:id` has the new shape described above.
- `POST /webhooks/stripe` answers **409** for an event that another request is still processing.
- `POST /bookings/:id/resume-payment` can now return 409 (the booking changed or was just paid) or 400 (the booking is older than 2 hours).
- Booking a tour that has no partner returns 400.

## Database migration

A single migration (`<timestamp>_open_item_fixes`) contains three schema changes and one data backfill:

| Statement | Item |
|:---|:---|
| `DROP INDEX "tour"."reviews_tour_id_customer_id_key"` | OI-6 |
| `ALTER TYPE "billing"."TransferStatus" ADD VALUE 'REVERSED'` | OI-7 |
| `ALTER TABLE "billing"."stripe_webhook_events" ADD COLUMN "completed_at" TIMESTAMPTZ(6)` | OI-8 |
| `UPDATE "billing"."stripe_webhook_events" SET "completed_at" = "processed_at" WHERE "completed_at" IS NULL` (added by hand) | OI-8 |

The backfill is required. Every event stored before this column existed was fully processed. Without it, those rows would look like abandoned claims, and a Stripe redelivery could reprocess them after 5 minutes.

**Deploy order**: run `prisma migrate deploy` against the live project before deploying the code. The code uses the new enum value and column. Bookings and Checkout Sessions created before the deploy keep their old windows (15-minute hold, 24-hour session); the automatic refund from OI-2 covers any late payment during that transition.

## Verification checklist

Every line was run against a local Supabase instance with Stripe in test mode and `stripe listen` running. The evidence is written next to each line. The step-by-step procedure for each line, so it can be repeated, is in [`verification-procedures.md`](verification-procedures.md).

- [x] `pnpm --filter api build` passes.
- [x] Migration applied locally. `prisma migrate status` up to date; migration row finished; `\d tour.reviews` shows `reviews_booking_id_key` (unique) and no `reviews_tour_id_customer_id_key`; `TransferStatus` includes `REVERSED`; `stripe_webhook_events.completed_at` backfilled (79 rows, 0 empty); `prisma migrate diff` reports no drift.
- [x] A customer with two completed bookings of the same tour can review both (OI-6). Database: the same customer holds two reviews on tour 1. API: `POST /bookings/88/reviews` returned 201 for a second booking (booking 88 was set to `completed` by SQL as a test shortcut), and repeating the call returned 409 "You already reviewed this booking".
- [x] `GET /tours/:id` as customer, partner admin and admin matches the role table (OI-5). Verified on tour 1 with one flagged and one unflagged review. The customer response had only `partner.{ id, name }`, no creator and only the unflagged review, and a search of the response for `email`, `stripeAccountId`, `contactEmail`, `createdByUser`, `isFlagged`, `customerId` and `user` found nothing. The partner admin and the admin received the full partner and creator, and only the admin saw the flagged review. Another partner's admin got 403, and a customer opening a non-live or soft-deleted tour got 404.
- [x] Two simultaneous bookings for the last seat: one succeeds, the other is rejected, `seats_available` ends at 0 (OI-1). Verified with a repeatable 20-round script. The previous code (commit `718218a`) failed 20 of 20 rounds: both requests returned 201, `seats_available` reached -1 and two bookings were pending. The fixed code passed 20 of 20: one 201, one 400, `seats_available` 0, one pending booking.
- [x] A new booking's Checkout Session expires in about 31 minutes and matches `bookings.expires_at` (OI-2). Booking 93: `hold_minutes = 31.0`, and the booking's expiry equals the Stripe session's `expires_at` (`1794284583`) to the second.
- [x] Cancelling an unpaid booking shows its session as Expired in Stripe (OI-3). Booking 93: after the cancel the session was `expired`, the booking `cancelled`, the payment `failed`, and `seats_available` back to its starting value.
- [x] Resuming a payment: old session expired, new session open, `payments.stripe_session_id` updated, `expires_at` later (OI-3). Booking 93: the old session became `expired`, the new one stayed `open`, `payments.stripe_session_id` held the new id, and `bookings.expires_at` moved 7.1 minutes later, to the new session's expiry. The `checkout.session.expired` event for the old session arrived one second later and was ignored ("Ignoring expiry of replaced session"), so the booking stayed `pending` (A6).
- [x] Late payment: force a booking to expire (`UPDATE tour.bookings SET expires_at = now() - interval '1 minute' WHERE id = ...`, then `POST /bookings/test-expire`), pay its checkout URL, and confirm a full refund in Stripe, payment `refunded`, no `platform_transfers` row (OI-2). Booking 7: the API logged "Booking 7 is EXPIRED, not pending" followed by "payment refunded automatically". Stripe showed the full refund with the partner transfer reversed and the application fee refunded. The booking stayed `expired`, the payment became `refunded`, and no `platform_transfers` row was created.
- [x] Cancelling a paid booking: refund visible in Stripe, partner transfer reversed in Stripe, `platform_transfers.status = 'REVERSED'` (OI-7). Booking 6: the refund covered the full amount (59998, equal to the session total) and carried a `transfer_reversal`. The database showed the booking `cancelled`, the payment `refunded`, the transfer `REVERSED` and the seats restored. The `charge.refunded` webhook that followed found the booking already final and changed nothing.
- [x] A partner admin of partner A gets 403 on `/partners/<B>/onboarding` and `/partners/<B>/connect-status`; their own partner and an admin succeed (OI-4). Verified on `connect-status` (own partner 200, admin 200, other partner 403, nonexistent id 403) and `POST onboarding` for another partner (403). The positive onboarding path was not exercised, as it would create a Stripe account. The first run of this test exposed a bug in the check (A8); after the fix the whole test was repeated with the results above.
- [x] After any webhook, `stripe_webhook_events.completed_at` is set, and `stripe events resend <event id>` behaves correctly in every state of the claim (OI-8). Verified by resending one processed event and editing its row to reach each branch: completed gave `[200]`; a claim in progress (`completed_at` empty, `processed_at` = now) gave `[409]`; a stale claim (`processed_at` 10 minutes old) was taken over and processed again, gave `[200]`, and left `processed_at` and `completed_at` refreshed.

## Remaining limitations

1. **`transfer.reversed` events are not consumed.** The reversal is recorded from the refund paths instead, which covers every refund this API issues or receives.
2. **The 2-hour resume limit is a product guess**, not a requirement. Change `MAX_PENDING_BOOKING_AGE_MS` in `bookings.service.ts` if it does not fit.
3. **Marking a webhook event completed can fail.** If it does, the claim goes stale after 5 minutes and a redelivery reprocesses the event. The handlers tolerate this (transfer creation is guarded, status updates are conditional), but it is logged.
4. **The automatic refund depends on Stripe being reachable.** If it is not, the webhook answers 500 and Stripe retries until it succeeds.
5. **There are still no automated tests** for any of this (Priority 4 in `docs/STATUS.md`). The checklist above is the only verification.
6. **`UserPayload.partnerId` is declared `number | null` but is a `bigint` at runtime.** Changing the declaration to `bigint | null` will make the compiler list every place that needs attention (for example `ToursService.create`). Until then, never compare it directly with a `number`.

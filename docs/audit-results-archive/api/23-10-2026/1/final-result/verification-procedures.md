# 🧪 Verification Procedures: Open Items (OI-1 to OI-8)

Step-by-step procedures for **every line of the Verification checklist** in [`fixes.md`](fixes.md). The two files answer different questions:

| File | Answers |
|:--|:--|
| [`fixes.md`](fixes.md) | *What was verified, and what the result was* |
| this file | *How to run each check again* (after a change to bookings, payments, webhooks or the schema, and before a deploy) |

Every procedure follows the same pattern: **setup → run → expected result → what a mismatch means → cleanup**. Expected results use ✅ for a pass, ❌ for a failure and ⚠️ for something to double-check.

> ⚠️ **Test mode only.** These procedures create bookings, charge test cards and edit rows by hand. Run them against a local Supabase instance with a Stripe **test** key, never against live data or live keys.

## 📋 Index

The sections follow the order of the checklist in `fixes.md`.

| § | Checklist line | Item | Needs Stripe? |
|:--|:--|:--|:--|
| 1 | `pnpm --filter api build` passes | – | no |
| 2 | Migration applied locally | OI-6, OI-7, OI-8 | no |
| 3 | A customer with two completed bookings of the same tour can review both | OI-6 | no |
| 4 | `GET /tours/:id` as customer, partner admin and admin | OI-5 | no |
| 5 | Two simultaneous bookings for the last seat | OI-1 | creates sessions (not paid) |
| 6 | 31-minute window, resume, and cancel of an unpaid booking (**three lines, one pass**) | OI-2, OI-3 | yes (no payment) |
| 7 | Late payment | OI-2 | yes (pays) |
| 8 | Cancelling a paid booking | OI-7 | yes (pays) |
| 9 | Partner admin gets 403 on another partner | OI-4 | no |
| 10 | Webhook idempotency (`stripe events resend`) | OI-8 | yes (resend) |

---
## 🧰 Before you start

### Environment

- **Local Supabase** is running (`supabase start`) and the migrations are applied.
- **The API** is running locally with `NODE_ENV=development`. Without it, `POST /bookings/test-expire` returns 404 and section 7 cannot run.
- **Stripe is in test mode.** Keep `stripe listen --forward-to localhost:3000/webhooks/stripe` running in its own terminal. The `whsec_…` secret it prints must match `STRIPE_WEBHOOK_SIGNING_SECRET` in `.env`, or every webhook answers 400.
- **Tools**: `psql`, `curl`, `jq` (`nix-shell -p jq`) and the Stripe CLI. The examples work in bash and zsh; the seat-race script is run with `bash` explicitly.
- **Test card**: `4242 4242 4242 4242`, any CVC, any future expiry date.

### Variables

| Variable | Meaning |
|:--|:--|
| `DATABASE_URL` | the local Postgres connection string |
| `TOKEN_CUSTOMER` | a login token of a customer |
| `TOKEN_PARTNER` | a partner admin of the **tour's** partner (section 4) |
| `TOKEN_A` | a partner admin whose **partner id** is `A` (section 9) |
| `TOKEN_OTHER_PARTNER` | a partner admin of a **different** partner (sections 4 and 9) |
| `TOKEN_ADMIN` | an admin |

The repository `README.md` ("Authentication & Authorization") has the local recipe for obtaining tokens.

### Where to look

A fix only counts as working when **Stripe and the database agree**. Check three places for every payment test: the **database**, the **Stripe dashboard or CLI**, and the **API log**.

> ℹ️ **Enum casing is not a bug.** `bookings.status` and `payments.status` are **lowercase** (`confirmed`, `refunded`), while `platform_transfers.status` is **uppercase** (`SUCCEEDED`, `REVERSED`).

### Queries used throughout

With `N` as the booking id:

```sql
SELECT status, seats_booked, expires_at FROM tour.bookings WHERE id = N;
SELECT status, stripe_session_id        FROM billing.payments WHERE booking_id = N;
SELECT status, stripe_transfer_id       FROM billing.platform_transfers WHERE booking_id = N;
SELECT seats_available FROM tour.tour_schedules
  WHERE id = (SELECT tour_schedule_id FROM tour.bookings WHERE id = N);
```

---
## 1. 🏗️ Build passes

**Checklist line**: `pnpm --filter api build` passes.

```bash
pnpm --filter api build
```

| Result | Meaning |
|:--|:--|
| ✅ Completes without errors | The code type-checks against the **generated Prisma client**. That also proves the client contains the new schema members the code uses (`TransferStatus.REVERSED`, `StripeWebhookEvent.completedAt`). |
| ❌ Type errors about `REVERSED` or `completedAt` | The client is stale. Run `npx prisma generate` from `apps/api` and build again. |

---
## 2. 🗄️ Migration applied locally

**Checklist line**: Migration applied locally (status, `\d tour.reviews`, enum value, backfill, no drift).

The check has two parts: ask Prisma what it believes, then ask Postgres what is really there. The migration is `apps/api/prisma/migrations/<timestamp>_23_10_2026_fixes/migration.sql`. It contains three schema statements and one hand-written backfill.

### 2.1 What Prisma believes

Run from `apps/api`:

```bash
npx prisma migrate status
```
✅ Expected: `Database schema is up to date!`, with the migration among those found and none pending.

```bash
psql "$DATABASE_URL" -c "SELECT migration_name, finished_at, rolled_back_at
  FROM _prisma_migrations ORDER BY started_at DESC LIMIT 3;"
```
✅ The `..._23_10_2026_fixes` row has `finished_at` set and `rolled_back_at` empty. An empty `finished_at` means it started and did not finish.

### 2.2 What Postgres actually has

One check per statement in the migration.

**OI-6: the leftover unique index is gone**

```bash
psql "$DATABASE_URL" -c "\d tour.reviews"
```

| Index | Expected |
|:--|:--|
| `reviews_booking_id_key` | ✅ present, `UNIQUE`, on `booking_id` |
| `reviews_tour_id_customer_id_key` | ✅ **absent** |
| `reviews_customer_id_idx`, `reviews_tour_id_idx` | ✅ present (plain btree) |
| `reviews_pkey` | ✅ present |

To print only the index names:

```bash
psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes
  WHERE schemaname = 'tour' AND tablename = 'reviews' ORDER BY 1;"
```

**OI-7: the new enum value exists**

```bash
psql "$DATABASE_URL" -c 'SELECT unnest(enum_range(NULL::billing."TransferStatus"));'
```
✅ Expected: `PENDING`, `SUCCEEDED`, `FAILED`, `REVERSED`.

**OI-8: the column exists and is backfilled**

```bash
psql "$DATABASE_URL" -c "SELECT count(*) AS total,
  count(*) FILTER (WHERE completed_at IS NULL) AS not_completed
  FROM billing.stripe_webhook_events;"
```
✅ Expected: `not_completed = 0`. A nonzero count means the backfill did not run, or a webhook was being processed at that moment. To see which rows:

```bash
psql "$DATABASE_URL" -c "SELECT event_id, processed_at FROM billing.stripe_webhook_events
  WHERE completed_at IS NULL;"
```

### 2.3 No drift between `schema.prisma` and the database

The strongest check. Run from `apps/api`:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```
✅ Expected output: `-- This is an empty migration`. The migration files, the schema file and the real database all agree. Any statements in the output mean one of the three differs.

> 💡 **Live project**: after `prisma migrate deploy`, repeat 2.1 to 2.3 with the live connection string **before** deploying the code.

---
## 3. ⭐ One customer can review each booking of the same tour (OI-6)

**Checklist line**: A customer with two completed bookings of the same tour can review both.

The old `@@unique([tourId, customerId])` allowed one review per customer **per tour, ever**. The rule is now **one review per booking**. The index check in section 2.2 shows the constraint is gone; this section shows the behavior.

### 3.1 Database level

```sql
-- Any row here is a customer with several reviews on one tour: proof the old constraint is gone.
SELECT customer_id, tour_id, count(*) FROM tour.reviews
GROUP BY 1, 2 HAVING count(*) > 1;
```

### 3.2 API level

**Prerequisites**: a customer token (`TOKEN_CUSTOMER`) and a customer who already has one review on a tour.

1. Find a booking of that customer on the same tour that has no review yet:

   ```sql
   SELECT b.id, b.status FROM tour.bookings b
   JOIN tour.tour_schedules ts ON ts.id = b.tour_schedule_id
   LEFT JOIN tour.reviews r ON r.booking_id = b.id
   WHERE ts.tour_id = <tour id>
     AND b.customer_id = '<customer uuid>'
     AND r.id IS NULL
   ORDER BY b.id DESC LIMIT 5;
   ```

2. Only a `completed` booking can be reviewed. If none is `completed`, mark a leftover test booking for the test:

   ```sql
   UPDATE tour.bookings SET status = 'completed' WHERE id = <booking id>;
   ```

3. Post the review twice:

   ```bash
   BK=<booking id>
   post_review() {
     curl -s -w ' -> %{http_code}\n' -X POST "localhost:3000/bookings/$BK/reviews" \
       -H "Authorization: Bearer $TOKEN_CUSTOMER" \
       -H "Content-Type: application/json" \
       -d '{"reviewText": "OI-6 API check", "rating": 5}'
   }
   post_review    # first call
   post_review    # repeat
   ```

4. Confirm the rows:

   ```sql
   SELECT id, booking_id, tour_id FROM tour.reviews
   WHERE customer_id = '<customer uuid>' AND tour_id = <tour id>;
   ```

| Step | Expected |
|:--|:--|
| First `post_review` | ✅ **201** with the new review |
| Repeat `post_review` | ✅ **409** `You already reviewed this booking` (the per-booking rule still holds) |
| Query | ✅ one more review row on the tour, with the new `booking_id` |

**Cleanup**: `DELETE FROM tour.reviews WHERE review_text = 'OI-6 API check';` and set the booking back to its previous status.

---
## 4. 🔒 Tour detail is shaped by role (OI-5)

**Checklist line**: `GET /tours/:id` as customer, partner admin and admin matches the role table.

The bug this checks is about **what the response contains**, so the test needs a tour with a flagged review, an unflagged review, and a reviewer who has a first name. It also needs three logins.

### 4.1 Set up the test data

**Pick a live tour that has a partner** (call its id `<T>`) and note its `partner_id`:

```sql
SELECT id, name, status, partner_id, created_by
FROM tour.tours
WHERE status = 'live' AND is_deleted = false AND partner_id IS NOT NULL
ORDER BY id;
```

**See which reviews it already has:**

```sql
SELECT r.id, r.rating, r.is_flagged, r.booking_id, p.first_name
FROM tour.reviews r
LEFT JOIN account.profiles p ON p.id = r.customer_id
WHERE r.tour_id = <T>;
```

**You need at least one unflagged and one flagged review.** If they do not exist, find bookings of that tour without a review and insert two test rows. `booking_id` is unique, so each review needs its own booking:

```sql
SELECT b.id AS booking_id, b.customer_id
FROM tour.bookings b
JOIN tour.tour_schedules ts ON ts.id = b.tour_schedule_id
LEFT JOIN tour.reviews r ON r.booking_id = b.id
WHERE ts.tour_id = <T> AND r.id IS NULL;

INSERT INTO tour.reviews (review_text, rating, tour_id, customer_id, booking_id, is_flagged)
VALUES ('TEST-OI5 visible review', 5, <T>, '<customer uuid>', <booking id 1>, false),
       ('TEST-OI5 flagged review', 1, <T>, '<customer uuid>', <booking id 2>, true);
```

> 💡 If both bookings belong to the same customer, this also shows that the old `(tourId, customerId)` constraint is gone (see section 3).

**The reviewer needs a first name.** Set one if it is empty:

```sql
UPDATE account.profiles SET first_name = 'Anna'
WHERE id = '<customer uuid>' AND first_name IS NULL;
```

### 4.2 Tokens

Log in three times and keep three variables:

| Variable | Login |
|:--|:--|
| `TOKEN_CUSTOMER` | a customer |
| `TOKEN_PARTNER` | a **partner admin of the tour's partner** (not of another partner) |
| `TOKEN_ADMIN` | an admin |

### 4.3 Run it

`jq` is required (`nix-shell -p jq` if it is not installed). The helper prints only the parts that matter:

```bash
summ() { jq '{
  partnerKeys: (.partner | keys),
  createdByUser: .createdByUser,
  reviews: [.reviews[] | {id, isFlagged, reviewer, keys: (keys | join(","))}]
}'; }

T=<tour id>
for who in CUSTOMER PARTNER ADMIN; do
  echo "=== $who ==="
  eval "tok=\$TOKEN_$who"
  curl -s localhost:3000/tours/$T -H "Authorization: Bearer $tok" | summ
done
```

### 4.4 What each role must see

| Role | `partnerKeys` | `createdByUser` | `reviews` |
|:--|:--|:--|:--|
| 👤 **CUSTOMER** | ✅ exactly `["id","name"]` | ✅ `null` | ✅ the **unflagged** review only. `keys` is `createdAt,id,rating,reviewText,reviewer`; `isFlagged` shows as `null` (absent); `reviewer` is `{ firstName, avatarUrl }` |
| 🏢 **PARTNER** | ✅ the full list (includes `contactEmail`, `stripeAccountId`, …) | ✅ `{ id, email }` | ✅ same as customer: the flagged review is **absent** |
| 🛡️ **ADMIN** | ✅ the full list | ✅ `{ id, email }` | ✅ **both** reviews. `keys` is `createdAt,id,isFlagged,rating,reviewText,reviewer`, and the flagged one shows `isFlagged: true` |

No role may ever receive a `user` key or a `customerId` key on a review, and no review may contain an email.

**Leak sweep for the customer response**: this must print **nothing**:

```bash
curl -s localhost:3000/tours/$T -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  | grep -o '"email"\|"stripeAccountId"\|"contactEmail"\|"createdByUser"\|"isFlagged"\|"customerId"\|"user"' \
  | sort | uniq -c
```

### 4.5 Negative checks

```bash
# partner admin of a DIFFERENT partner -> expect 403
curl -s -w ' -> %{http_code}\n' localhost:3000/tours/$T \
  -H "Authorization: Bearer $TOKEN_OTHER_PARTNER"

# customer opening a non-live tour -> expect 404 (not 403: drafts must not reveal that they exist)
curl -s -w ' -> %{http_code}\n' localhost:3000/tours/<non-live tour id> \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

A `404` also appears when a tour does not exist or is soft-deleted, so confirm that the tour is a real, non-live one and that an admin can open it:

```sql
SELECT id, status, is_deleted FROM tour.tours WHERE id = <non-live tour id>;
-- want: a status other than 'live', is_deleted = false
```
```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/tours/<non-live tour id> \
  -H "Authorization: Bearer $TOKEN_ADMIN"      # want 200
```

Customer **404** plus admin **200** proves the 404 is deliberate. Repeat the customer call with a soft-deleted tour (`is_deleted = true`) and with a `coming_soon` tour; both must also return **404**.

### 4.6 If something does not match

| You see | Meaning |
|:--|:--|
| ❌ The customer response has the full `partner` | The old code is running. Check that the dev server recompiled. |
| ❌ `PARTNER` gets 403 on their own tour | A `bigint` against `number` comparison in the tour's partner check (the same class of bug as A8). Compare the ids as `BigInt`. |
| ❌ Reviews missing for everyone | `is_flagged` may be `NULL`: `UPDATE tour.reviews SET is_flagged = false WHERE tour_id = <T> AND is_flagged IS NULL;` |
| ℹ️ `reviewer` is `{ firstName: null, … }` | That reviewer has no profile name. This is correct behavior; set a name to see the full shape. |
| ❌ 500 error | A query or type problem in the conditional `include` of `ToursService.findOne`. Read the Prisma error in the API log. |

**Cleanup**: `DELETE FROM tour.reviews WHERE review_text LIKE 'TEST-OI5%';`

---
## 5. 🏁 Two simultaneous bookings for the last seat (OI-1)

**Checklist line**: Two simultaneous bookings for the last seat: one succeeds, the other is rejected, `seats_available` ends at 0.

The seat claim is one conditional `UPDATE ... WHERE seats_available >= n`. Postgres serializes updates to the same row, so when two requests race for the last seat, the second re-checks the condition after the first commits and matches nothing. That is a guarantee, not luck.

### 5.1 Setup

1. Use a **customer** token. The token of a partner admin of another partner gets a 403 and tells you nothing.
2. Use a `startDate` that books normally.
3. The schedule row for that date must **already exist**: make one normal booking for it and cancel it. Otherwise the test also exercises on-demand schedule creation (A3), which is a different test.
4. Confirm the server runs the new code and has recompiled. This must print a line:

   ```bash
   grep -n "claimed.count" apps/api/src/bookings/bookings.service.ts
   ```

### 5.2 Quick manual version

```bash
# force the schedule down to exactly one seat
psql "$DATABASE_URL" -c "UPDATE tour.tour_schedules SET seats_available = 1 WHERE id = <schedule id>;"

BODY='{"tourId": 1, "startDate": "2026-11-20T11:00:00Z", "seatsBooked": 1}'
curl -s -w ' -> HTTP %{http_code}\n' -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" -H "Content-Type: application/json" -d "$BODY" &
curl -s -w ' -> HTTP %{http_code}\n' -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" -H "Content-Type: application/json" -d "$BODY" &
wait
```

| Request | Expected |
|:--|:--|
| One of the two | ✅ **2xx** with a `checkout_url` |
| The other | ✅ **400** `Not enough seats available.` |

Then check the database:

```sql
SELECT seats_available FROM tour.tour_schedules WHERE id = <schedule id>;        -- 0
SELECT count(*) FROM tour.bookings
  WHERE tour_schedule_id = <schedule id> AND status = 'pending';                 -- 1
SELECT count(*) FROM tour.tour_schedules WHERE seats_available < 0;              -- 0
```

### 5.3 Repeatable version

One run proves little, because a race depends on timing. This script repeats the test and checks the same things each round. It lives in `.script/seat-race.sh`, a folder that is **git-ignored**, so the full script is kept here.

```bash
#!/usr/bin/env bash
set -u
API="${API:-http://localhost:3000}"
TOKEN="${TOKEN:?export TOKEN (a CUSTOMER token) first}"
DB="${DB:?export DB, e.g. postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
TOUR_ID="${TOUR_ID:-1}"
START_DATE="${START_DATE:?a date that books normally, e.g. 2026-11-20T11:00:00Z}"
ROUNDS="${ROUNDS:-20}"

q() { psql "$DB" -Atc "$1"; }

SID=$(q "SELECT id FROM tour.tour_schedules WHERE tour_id=$TOUR_ID AND start_date='$START_DATE' LIMIT 1")
[ -n "$SID" ] || { echo "No schedule row for that date yet: make one booking, cancel it, rerun."; exit 1; }
ORIG=$(q "SELECT seats_available FROM tour.tour_schedules WHERE id=$SID")

BODY="{\"tourId\": $TOUR_ID, \"startDate\": \"$START_DATE\", \"seatsBooked\": 1}"
fire() {
  curl -s -o /dev/null -w '%{http_code}' -X POST "$API/bookings" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$BODY"
}

T1=$(mktemp); T2=$(mktemp); pass=0; fail=0
for i in $(seq 1 "$ROUNDS"); do
  q "UPDATE tour.bookings SET status='cancelled' WHERE tour_schedule_id=$SID AND status='pending'" >/dev/null
  q "UPDATE tour.tour_schedules SET seats_available=1 WHERE id=$SID" >/dev/null
  fire >"$T1" & fire >"$T2" & wait
  seats=$(q "SELECT seats_available FROM tour.tour_schedules WHERE id=$SID")
  pend=$(q "SELECT count(*) FROM tour.bookings WHERE tour_schedule_id=$SID AND status='pending'")
  codes=$(printf '%s\n%s\n' "$(cat "$T1")" "$(cat "$T2")" | sort | tr '\n' ' ')
  if [ "$seats" = "0" ] && [ "$pend" = "1" ] && echo "$codes" | grep -Eq '^2[0-9]{2} 400 $'; then
    pass=$((pass+1))
  else
    fail=$((fail+1)); echo "round $i UNEXPECTED: codes=[$codes] seats=$seats pending=$pend"
  fi
done

q "UPDATE tour.bookings SET status='cancelled' WHERE tour_schedule_id=$SID AND status='pending'" >/dev/null
q "UPDATE tour.tour_schedules SET seats_available=$ORIG WHERE id=$SID" >/dev/null
echo "rounds=$ROUNDS passed=$pass unexpected=$fail"
```

Run it with the variables in front:

```bash
TOKEN="$TOKEN_CUSTOMER" DB="$DATABASE_URL" START_DATE=2026-11-20T11:00:00Z bash .script/seat-race.sh
```

✅ **Success is `passed=20 unexpected=0`.** The script resets `seats_available` to its original value at the end. Do **not** pay the Checkout Sessions it creates.

**Side effects to know about**

- The test bookings end up `cancelled`, each with a `pending` payment, and their Checkout Sessions stay open in Stripe until they expire (about 31 minutes). `stripe listen` then delivers `checkout.session.expired` events, and the API log shows `Booking N is not pending, skipping expire`. This is harmless.
- Optional cleanup of the stray payment rows:

  ```sql
  UPDATE billing.payments p SET status = 'failed'
  FROM tour.bookings b
  WHERE p.booking_id = b.id
    AND b.tour_schedule_id = <schedule id>
    AND b.status = 'cancelled'
    AND p.status = 'pending';
  ```

### 5.4 Prove the test can catch the bug

A test that has never failed might not be testing anything. If the two requests never overlapped enough to collide, the **old** code would also pass all 20 rounds. Run the script once against the old behavior to prove it fails there.

1. **Back up the file.**

   ```bash
   cp apps/api/src/bookings/bookings.service.ts /tmp/bookings.service.ts.good
   ```

2. **Delete this one line** from the seat claim in `createBookingWithCheckout`:

   ```ts
   const claimed = await tx.tourSchedule.updateMany({
     where: {
       id: schedule.id,
       seatsAvailable: { gte: dto.seatsBooked },   // <- delete this line only
     },
     data: { seatsAvailable: { decrement: dto.seatsBooked } },
   });
   ```

   This recreates the old behavior: the check happens outside the transaction and the decrement is unconditional. The `if (claimed.count === 0)` check below it can stay, because it can no longer fire.

3. Wait for the dev server to recompile, then run the script again.

   ❌ **Expected on the broken code**: most rounds report `UNEXPECTED`, for example

   ```text
   round 7 UNEXPECTED: codes=[201 201 ] seats=-1 pending=2
   ```

   Both bookings succeeded and the seat count went negative. That is the bug, reproduced by the script. If `passed=20` appears on the broken code, the requests are not overlapping enough: the harness is too weak and must fire more requests per round.

4. **Restore the fix and confirm it.** Do not skip this: it guards against shipping the experiment.

   ```bash
   cp /tmp/bookings.service.ts.good apps/api/src/bookings/bookings.service.ts
   grep -c "seatsAvailable: { gte: dto.seatsBooked }" apps/api/src/bookings/bookings.service.ts   # must print 1
   ```

   Run the script once more: ✅ `passed=20 unexpected=0`.

> ℹ️ **How the recorded result was produced**: before this fix was committed, the same experiment was run by stashing the working tree (`git stash -u`), which returned the code to commit `718218a`. The old code failed 20 of 20 rounds; the fixed code passed 20 of 20. After the commit the tree is clean, so use the one-line method above instead.

### 5.5 If a round fails on the fixed code

| You see | Meaning |
|:--|:--|
| ❌ `[201 201 ]`, seats `-1` | The old code is running. Check the `grep` in 5.1 and that the dev server recompiled. |
| ❌ `[400 400 ]`, seats `0` | The reset did not apply, or another booking already holds the seat. |
| ⚠️ A code such as `502` | Stripe failed (the cleanup then released the seat). Rare in test mode; rerun. |
| ❌ `201` plus `400`, but seats `1` | The successful request did not claim the seat. Capture the round output and the API log. |

---
## 6. ⏱️ Payment window, resume and cancel of an unpaid booking (OI-2, OI-3)

**Checklist lines** (three lines, one combined pass):

| Checklist line | Step |
|:--|:--|
| A new booking's Checkout Session expires in about 31 minutes and matches `bookings.expires_at` (OI-2) | **A** |
| Resuming a payment: old session expired, new session open, `payments.stripe_session_id` updated, `expires_at` later (OI-3) | **B** |
| Cancelling an unpaid booking shows its session as Expired in Stripe (OI-3) | **C** |

The whole pass uses **one unpaid booking**; nothing is paid. Keep `stripe listen` running, keep the API log visible, and make sure `jq` is available (`nix-shell -p jq`).

### 6.1 Setup

```bash
BODY='{"tourId": 1, "startDate": "2026-11-20T11:00:00Z", "seatsBooked": 1}'
SEATS="SELECT seats_available FROM tour.tour_schedules WHERE tour_id = 1 AND start_date = '2026-11-20T11:00:00Z'"
psql "$DATABASE_URL" -Atc "$SEATS"        # write this down: S0
```

### 6.2 Step A: create the booking and check the 31-minute match

```bash
curl -s -w ' -> %{http_code}\n' -X POST localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" -H "Content-Type: application/json" -d "$BODY"
# keep the checkout_url from this response for the optional check at the end

N=$(psql "$DATABASE_URL" -Atc "SELECT max(id) FROM tour.bookings"); echo "booking = $N"

psql "$DATABASE_URL" -x -c "SELECT b.status,
  round(extract(epoch FROM (b.expires_at - b.created_at))/60, 1) AS hold_minutes,
  extract(epoch FROM b.expires_at)::bigint AS expires_epoch,
  p.status AS payment, p.stripe_session_id
  FROM tour.bookings b JOIN billing.payments p ON p.booking_id = b.id WHERE b.id = $N"

SID=$(psql "$DATABASE_URL" -Atc "SELECT stripe_session_id FROM billing.payments WHERE booking_id = $N ORDER BY created_at DESC LIMIT 1")
stripe checkout sessions retrieve "$SID" | jq '{status, expires_at}'
psql "$DATABASE_URL" -Atc "$SEATS"        # S0 - 1
```

> ℹ️ `max(id)` assumes no other booking is created during the test. Confirm it against the API log line `Booking created: ID <N>`.

| Check | Expected |
|:--|:--|
| Booking `status` / payment | ✅ `pending` / `pending` |
| `hold_minutes` | ✅ `31.0` |
| Stripe session `status` | ✅ `open` |
| Stripe `expires_at` vs `expires_epoch` | ✅ **the same number**: the seat hold and the session expire at the same instant (OI-2) |
| Seats | ✅ one less than S0 |

### 6.3 Step B: resume the payment

```bash
OLD=$SID
curl -s -w ' -> %{http_code}\n' -X POST localhost:3000/bookings/$N/resume-payment \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
NEW=$(psql "$DATABASE_URL" -Atc "SELECT stripe_session_id FROM billing.payments WHERE booking_id = $N ORDER BY created_at DESC LIMIT 1")
echo "old=$OLD"; echo "new=$NEW"
for s in "$OLD" "$NEW"; do stripe checkout sessions retrieve "$s" | jq -c '{id, status, expires_at}'; done

sleep 5      # let the webhook for the old session's expiry arrive
psql "$DATABASE_URL" -c "SELECT status, expires_at FROM tour.bookings WHERE id = $N"
psql "$DATABASE_URL" -Atc "$SEATS"
```

| Check | Expected |
|:--|:--|
| Response | ✅ 2xx with a new `checkout_url` |
| `old` vs `new` session id | ✅ different; `payments.stripe_session_id` holds `NEW` |
| Stripe | ✅ `OLD` is **expired**, `NEW` is **open** |
| Booking after the `sleep` | ✅ still **pending**, with `expires_at` **later** than in Step A |
| Seats | ✅ unchanged from Step A |
| `stripe listen` | ✅ a `checkout.session.expired` event for the old session, answered `[200]` |
| API log | ✅ `Ignoring expiry of replaced session cs_test_… for booking N` |

**The last two rows are required evidence, not extras.** Closing the old session fires an expiry event, and that event must **not** expire the booking that was just resumed. The booking staying `pending` is consistent with that, but it does not prove it: if the event had not reached the server within the `sleep`, the booking would look identical. The `Ignoring expiry of replaced session` log line is the only direct proof of the stale-session guard (A6).

The expected log order:

```text
Stripe session ID updated for booking N                 <- the new session is saved FIRST
Processing Stripe event: checkout.session.expired (evt_...)
Ignoring expiry of replaced session cs_test_... for booking N.
```

⚠️ Check the log **within a few seconds of the resume, before cancelling**. If you see `Booking N is not pending, skipping expire` instead, the event arrived after the cancel, and the guard has still not been demonstrated: repeat Steps A and B and watch the log right after the resume.

### 6.4 Step C: cancel the unpaid booking

```bash
curl -s -w ' -> %{http_code}\n' -X PATCH localhost:3000/bookings/$N/cancel \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
sleep 5
stripe checkout sessions retrieve "$NEW" | jq -c '{id, status}'
psql "$DATABASE_URL" -x -c "SELECT b.status AS booking, p.status AS payment
  FROM tour.bookings b JOIN billing.payments p ON p.booking_id = b.id WHERE b.id = $N"
psql "$DATABASE_URL" -Atc "$SEATS"
```

| Check | Expected |
|:--|:--|
| Response | ✅ `Booking cancelled and seats released.` |
| Stripe `NEW` session | ✅ **expired**: cancelling an unpaid booking closes its session |
| Booking / payment | ✅ `cancelled` / `failed` |
| Seats | ✅ back to **S0** |
| API log | ✅ `Booking N is not pending, skipping expire`, for the event this cancel triggered |
| `stripe listen` | ✅ the second `checkout.session.expired` event, answered `[200]` |

### 6.5 Optional: the old session cannot be paid

Open the `checkout_url` saved in Step A. Stripe should show an expired-session page ("You've either completed your payment or this checkout session has timed out") with **no payment form**. This is the double-payment protection seen from the customer's side.

> 💡 **A log line to ignore.** After an expiry event the webhook controller prints `⏰ Booking N expired from Stripe session.` even when the service ignored the event or skipped a booking that was not pending. That line appears either way and proves nothing. Use the service's own `Ignoring…` or `skipping expire` line as the evidence.

---
## 7. 💸 Late payment is refunded automatically (OI-2)

**Checklist line**: Late payment: force a booking to expire, pay its checkout URL, and confirm a full refund in Stripe, payment `refunded`, no `platform_transfers` row.

This is the highest-risk path of the batch. A customer pays after the seat hold ended, so the booking is already `expired` and its seats are gone. The webhook must refund instead of recording a payment.

**Prerequisites**: see "Before you start". The API must run with `NODE_ENV=development`, or `test-expire` returns 404.

### 7.1 Create a booking and do not pay

```bash
BODY='{"tourId": 1, "startDate": "2026-11-20T11:00:00Z", "seatsBooked": 1}'
psql "$DATABASE_URL" -Atc "SELECT seats_available FROM tour.tour_schedules WHERE tour_id = 1 AND start_date = '2026-11-20T11:00:00Z'"   # write this down

curl -s -X POST localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" -H "Content-Type: application/json" -d "$BODY"
# keep the checkout_url from the response

N=$(psql "$DATABASE_URL" -Atc "SELECT max(id) FROM tour.bookings"); echo "booking = $N"
```

### 7.2 Force it to expire

```sql
UPDATE tour.bookings SET expires_at = now() - interval '1 minute' WHERE id = <N>;
```
```bash
curl -s -X POST localhost:3000/bookings/test-expire
```

### 7.3 Confirm the expiry first

The Stripe session is still open at this point, which is exactly the situation this fix covers.

```sql
SELECT status FROM tour.bookings WHERE id = <N>;                       -- expired
SELECT status FROM billing.payments WHERE booking_id = <N>;            -- failed
```
The seat count should be back to the value you wrote down.

### 7.4 Pay the saved `checkout_url`

Open the `checkout_url` from 7.1 and pay with the test card `4242 4242 4242 4242` (any CVC, any future date).

### 7.5 What success looks like

| Where | Expected |
|:--|:--|
| 📜 API log | ✅ `Booking N is EXPIRED, not pending — not confirmed by this call`, then `Booking N was EXPIRED when its payment arrived — payment refunded automatically` |
| 💳 Stripe | ✅ the payment succeeded, then is **fully refunded**; the partner transfer is **reversed** and the application fee **refunded** (`transfer.reversed` and `application_fee.refunded` events appear) |
| 🗄️ Database | ✅ booking **stays `expired`**; payment becomes `refunded`; the `platform_transfers` query returns **0 rows**; `seats_available` is unchanged from 7.3 |
| 🗄️ `billing.stripe_webhook_events` | ✅ the event's row has `completed_at` set |
| 📡 `stripe listen` | ✅ `checkout.session.completed` answered `[200]` (the answer takes a few seconds, because the refund call happens first) |

The later `charge.refunded` event is also answered `[200]`. It finds the booking already final and logs `already in terminal state EXPIRED; payment marked REFUNDED, booking left unchanged`. That warning is correct.

```sql
SELECT status FROM tour.bookings WHERE id = <N>;                       -- expired
SELECT status FROM billing.payments WHERE booking_id = <N>;            -- refunded
SELECT count(*) FROM billing.platform_transfers WHERE booking_id = <N>;-- 0
```

> 💡 The customer's browser still lands on the `…/payment-success` URL, because the payment really succeeded and the refund comes afterwards. The frontend must read the booking's status (`GET /bookings/N`) and show an `expired` booking as "your payment arrived after the booking expired and has been refunded", instead of trusting the redirect. (With `APP_URL` pointing at the API, that page is a 404 locally. See the follow-ups in `docs/STATUS.md`.)

### 7.6 If something does not match

| You see | Likely meaning |
|:--|:--|
| ❌ Booking becomes `confirmed`, or a `platform_transfers` row appears | The expiry in 7.2 did not take effect. Re-check 7.3 before paying. |
| ❌ The customer was charged and not refunded, and the webhook shows 500 | Stripe retries. Read the error in the API log and in the dashboard's event delivery attempts. |
| ❌ Every webhook gets 400 | The signing secret does not match the one `stripe listen` printed. |

**Cleanup**: none is required; the booking is `expired` and the payment `refunded`.

---
## 8. ↩️ Cancelling a paid booking refunds it and reverses the transfer (OI-7)

**Checklist line**: Cancelling a paid booking: refund visible in Stripe, partner transfer reversed in Stripe, `platform_transfers.status = 'REVERSED'`.

### 8.1 Create and pay a booking

1. Write down `seats_available`. Create a booking (see section 7.1) and pay its `checkout_url` with the test card.
2. **Check the state after payment.**

   | Check | Expected |
   |:--|:--|
   | Booking | ✅ `confirmed` |
   | Payment | ✅ `succeeded` |
   | `platform_transfers` | ✅ one `SUCCEEDED` row |
   | `seats_available` | ✅ lower by the seats booked |

### 8.2 Cancel it

```bash
curl -s -w ' -> %{http_code}\n' -X PATCH localhost:3000/bookings/<N>/cancel \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```
✅ Expected: `Booking cancelled and seats released.`

### 8.3 What success looks like

| Where | Expected |
|:--|:--|
| 💳 Stripe, the payment | ✅ **Refunded**, full amount |
| 💳 Stripe, the transfer | ✅ **reversed** (see 8.4) |
| 💳 Stripe, application fee | ✅ **refunded** |
| 🗄️ Database | ✅ booking `cancelled`, payment `refunded`, transfer `REVERSED`, `seats_available` back to its starting value |
| 📜 API log | ✅ `payment marked REFUNDED`, then `1 platform transfer(s) … marked REVERSED` |
| 📡 `stripe listen` | ✅ `charge.refunded` → `[200]`. Other events, such as `transfer.reversed`, may also appear as 200 with `Unhandled event type`: that is fine. |
| 📜 Log, when `charge.refunded` arrives | ✅ `already in terminal state CANCELLED; payment marked REFUNDED, booking left unchanged`. This **warning is correct**: the webhook found nothing left to change. |

### 8.4 Checking the refund and the reversal with the CLI

The dashboard labels move between versions; the CLI gives the same answer. Stripe ids carry a prefix that says what they are:

| Prefix | Object | Where you get it |
|:--|:--|:--|
| `pi_` | PaymentIntent | `stripe checkout sessions retrieve <stripe_session_id>` → `payment_intent` |
| `re_` | Refund | `stripe refunds list --payment-intent pi_…` |
| `trr_` | **Transfer reversal** (money taken back from the partner) | the `transfer_reversal` field of the refund |
| `tr_` | **Transfer** (money sent to the partner) | `platform_transfers.stripe_transfer_id`, or the charge's `transfer` field |

`stripe transfers retrieve` only accepts a `tr_…` id. Passing it the `trr_…` reversal id fails with `No such transfer`, which is not a failure of the fix.

```bash
SID=$(psql "$DATABASE_URL" -Atc "SELECT stripe_session_id FROM billing.payments WHERE booking_id = <N> ORDER BY created_at DESC LIMIT 1")
PI=$(stripe checkout sessions retrieve "$SID" | jq -r .payment_intent)
stripe refunds list --payment-intent "$PI"
```

In the refund, check:

| Field | Expected |
|:--|:--|
| `status` | ✅ `succeeded` |
| `amount` | ✅ equal to the session's `amount_total` (a full refund) |
| `transfer_reversal` | ✅ non-null (`trr_…`): the partner's transfer was reversed |

To inspect the transfer itself:

```bash
psql "$DATABASE_URL" -c "SELECT stripe_transfer_id, net_amount FROM billing.platform_transfers WHERE booking_id = <N>;"
# if stripe_transfer_id shows 'pending', take it from the charge instead:
stripe charges retrieve <ch_… from the refund> | grep '"transfer":'

stripe transfers retrieve tr_XXXX
stripe get /v1/transfers/tr_XXXX/reversals
```
✅ Expect `"reversed": true` and `amount_reversed` equal to `amount`. The reversals list must contain the `trr_…` from the refund.

### 8.5 Cancelling twice

Click cancel again straight away. The second call must return **400** `A booking that is CANCELLED cannot be cancelled`, and Stripe must show **one** refund.

### 8.6 If something does not match

| You see | Likely meaning |
|:--|:--|
| ❌ Cancel returns 502 and the booking stays `confirmed` | The refund call failed, which is the designed safe behavior: nothing changes and the customer can retry. The log has `Refund failed for booking N: <Stripe's message>`; start with that message. |
| ❌ Stripe refunded, but the transfer is not reversed | The charge is not a destination charge, or the reversal failed. Look at the Stripe error on the refund. |

---
## 9. 🛡️ A partner admin can only manage their own partner (OI-4)

**Checklist line**: A partner admin of partner A gets 403 on `/partners/<B>/onboarding` and `/partners/<B>/connect-status`; their own partner and an admin succeed.

### 9.1 Prerequisites

You need a token for a **partner admin of partner A** (`TOKEN_A`), an admin token (`TOKEN_ADMIN`), and two **partner ids**:

| Variable | Meaning |
|:--|:--|
| `A` | the **partner id** of the partner admin: a small integer from `account.profiles.partner_id` |
| `B` | the id of a **different** partner |

```sql
-- which partner does this partner admin belong to?
SELECT id AS user_id, role, partner_id FROM account.profiles WHERE id = '<partner admin user uuid>';

-- all partners, to pick B
SELECT id, name FROM tour.partners ORDER BY id;
```

> ⚠️ `A` and `B` are **partner ids (integers)**, not user UUIDs. The routes take `:id` through `ParseIntPipe`, so a UUID returns `400 Validation failed (numeric string is expected)`. That is correct behavior, not a bug.

### 9.2 Run it

```bash
A=<partner id of the partner admin>
B=<a different partner id>

# own partner (control, no side effects): expect 200
curl -s -w ' -> %{http_code}\n' localhost:3000/partners/$A/connect-status -H "Authorization: Bearer $TOKEN_A"

# someone else's partner: expect 403 "You do not have access to this partner."
curl -s -w ' -> %{http_code}\n' localhost:3000/partners/$B/connect-status -H "Authorization: Bearer $TOKEN_A"
curl -s -w ' -> %{http_code}\n' -X POST localhost:3000/partners/$B/onboarding -H "Authorization: Bearer $TOKEN_A"

# nonexistent id: must ALSO be 403, not 404 (no way to probe which ids exist)
curl -s -w ' -> %{http_code}\n' localhost:3000/partners/99999/connect-status -H "Authorization: Bearer $TOKEN_A"

# admin can still reach any partner: expect 200
curl -s -w ' -> %{http_code}\n' localhost:3000/partners/$B/connect-status -H "Authorization: Bearer $TOKEN_ADMIN"
```

| Call | Expected |
|:--|:--|
| Partner admin, own partner (`connect-status`) | ✅ **200** (`not_started` or the account details) |
| Partner admin, partner B (`connect-status`) | ✅ **403** |
| Partner admin, partner B (`POST …/onboarding`) | ✅ **403** |
| Partner admin, nonexistent id `99999` | ✅ **403**, not 404 |
| Admin, partner B | ✅ **200** |

⚠️ **Always run the control call (own partner → 200).** The 403 cases alone cannot tell a correct check from a broken one that rejects everyone. This is exactly how the `bigint` against `number` bug (A8) was found: every 403 passed, and only the control case failed.

The `POST` to partner B is the call that used to start Stripe onboarding for another partner, so confirm nothing changed for B:

```sql
SELECT id, stripe_account_id FROM tour.partners WHERE id = <B>;   -- same value as before the test
```

The positive path of `POST …/onboarding` is deliberately not exercised: it would create a Stripe Express account.

### 9.3 If something does not match

| You see | Likely meaning |
|:--|:--|
| ❌ 400 `numeric string is expected` | You passed a user UUID instead of a partner id. |
| ❌ 403 on the **own partner** control call | The user's `partner_id` is `NULL`, or ids are compared across types (`bigint` against `number`). Compare both sides as `BigInt`. |
| ❌ 200 on another partner's id | The ownership check is missing; the old code is running. |
| ❌ 404 on a nonexistent id | The check runs after the database lookup, so it leaks which ids exist. It must run before. |

---
## 10. 🔁 Webhook claims distinguish in-progress from completed events (OI-8)

**Checklist line**: After any webhook, `stripe_webhook_events.completed_at` is set, and `stripe events resend <event id>` behaves correctly in every state of the claim.

With `stripe listen` running, `stripe events resend <evt_id>` re-sends an event to the CLI's local endpoint. It only works for events created in the **last 30 days**, so pick a recent one.

A plain resend only exercises the "already completed" branch. **Editing the event's row** lets you reach all three branches of the claim logic on demand:

| State of the claim | Row | Expected answer |
|:--|:--|:--|
| ✅ completed | `completed_at` set | **200** |
| 🔄 in progress | `completed_at` empty, `processed_at` recent | **409** (Stripe retries later) |
| ⏳ stale | `completed_at` empty, `processed_at` older than 5 minutes | taken over and processed again, **200** |

### 10.1 Pick a harmless event

Re-processing must not be able to hurt anything. A `checkout.session.expired` event of an already-cancelled booking is ideal: it only reaches the "booking not pending" branch. Keep `stripe listen` and the API log visible.

```bash
EVT=<evt id of a processed checkout.session.expired event from the last 30 days>
psql "$DATABASE_URL" -c "SELECT event_id, processed_at, completed_at FROM billing.stripe_webhook_events WHERE event_id = '$EVT'"
```
✅ Expected: `completed_at` is set.

### 10.2 Case 1: a completed event gets 200

```bash
stripe events resend $EVT
```

### 10.3 Case 2: an event in progress gets 409

Run the `resend` **immediately** after the `UPDATE`: after 5 minutes the claim counts as stale.

```bash
psql "$DATABASE_URL" -c "UPDATE billing.stripe_webhook_events SET completed_at = NULL, processed_at = now() WHERE event_id = '$EVT'"
stripe events resend $EVT
```

### 10.4 Case 3: a stale claim is taken over

```bash
psql "$DATABASE_URL" -c "UPDATE billing.stripe_webhook_events SET processed_at = now() - interval '10 minutes' WHERE event_id = '$EVT'"
stripe events resend $EVT
psql "$DATABASE_URL" -c "SELECT processed_at, completed_at FROM billing.stripe_webhook_events WHERE event_id = '$EVT'"
```

### 10.5 What each case must show

| Case | `stripe listen` | API log | Database |
|:--|:--|:--|:--|
| 1 | ✅ `[200]` | `DEBUG … Webhook event evt_… already processed. Skipping.` and **no** `Processing Stripe event` line | unchanged |
| 2 | ✅ **`[409]`** | `DEBUG … is being processed by another request — asking Stripe to retry.` and no processing line | `completed_at` still empty |
| 3 | ✅ `[200]` | `WARN … Took over stale claim for webhook event evt_…`, then `Processing Stripe event`, then `Booking N is not pending, skipping expire` | `processed_at` refreshed, **`completed_at` set again** |

- Case 2 answering **200** means more than 5 minutes passed after the `UPDATE`. Repeat it.
- The Stripe CLI responses and the row's timestamps are enough to prove each branch even if the API log was not captured: a `409` can only come from the in-progress branch, and in Case 3 both timestamps are refreshed only if the event was processed again.
- If `events resend` asks for a webhook endpoint, check `stripe events resend --help` for the `--webhook-endpoint` option.

After Case 3 the row is complete again, so no cleanup is needed.

---
## 🧹 Cleanup

These procedures leave test data in the **local** database. None of it is committed, but clean it up so later runs start from a known state.

```sql
-- reviews created by sections 3 and 4
DELETE FROM tour.reviews WHERE review_text = 'OI-6 API check' OR review_text LIKE 'TEST-OI5%';

-- any booking you set to 'completed' only for section 3: put it back to its previous status
UPDATE tour.bookings SET status = '<previous status>' WHERE id = <booking id>;
```

- **Section 5** leaves `cancelled` bookings with `pending` payments and open Checkout Sessions that expire on their own after about 31 minutes. The optional cleanup query is in 5.3.
- **Sections 6, 7 and 8** leave bookings in a final state (`cancelled`, `expired`) and need no cleanup.
- **Section 10** leaves the event row complete again.

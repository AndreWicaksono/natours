import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import { UserPayload } from '../auth/user-payload.interface';
import {
  AppRole,
  BookingStatus,
  PaymentStatus,
  TransferStatus,
} from '../generated/prisma/enums';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from 'src/payments/payments.service';

// A Stripe Checkout Session must stay open for at least 30 minutes. We use 31 so the value
// is still >= 30 minutes by the time Stripe receives the request. The customer's payment
// window is therefore ~30 minutes, and the seat hold ends at the same moment the session does
// — Stripe's own `checkout.session.expired` event releases the seats, with the cron only as a
// fallback. (Previously seats were held 15 minutes but the session stayed payable for 24
// hours, so a customer could pay for a booking that had already expired.)
const CHECKOUT_SESSION_TTL_SECONDS = 31 * 60;

// A pending booking can be resumed (new Checkout Session, fresh payment window) only while it
// is younger than this — otherwise repeated resumes could hold seats indefinitely.
const MAX_PENDING_BOOKING_AGE_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private paymentsService: PaymentsService,
  ) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }
    // Use the Stripe package's default API version by omitting apiVersion
    this.stripe = new Stripe(secretKey);
  }

  // --- Create booking with Stripe Checkout (on‑demand schedule creation) ---
  async createBookingWithCheckout(user: UserPayload, dto: CreateBookingDto) {
    // 1. Check role
    const allowedRoles = [
      AppRole.CUSTOMER,
      AppRole.ADMIN,
      AppRole.PARTNER_ADMIN,
    ];
    if (!allowedRoles.includes(user.role as any)) {
      throw new ForbiddenException('You are not allowed to create bookings.');
    }

    // 2. Validate input: either tourScheduleId or (tourId + startDate)
    if (!dto.tourScheduleId && (!dto.tourId || !dto.startDate)) {
      throw new BadRequestException(
        'Either tourScheduleId or tourId+startDate must be provided.',
      );
    }

    let schedule: any;
    let tour: any;

    // 3. If tourId + startDate provided, validate against availability rules
    if (dto.tourId && dto.startDate) {
      const startDate = new Date(dto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format.');
      }

      // Fetch all rules for this tour
      const rules = await this.prisma.availabilityRule.findMany({
        where: { tourId: dto.tourId },
      });

      if (rules.length === 0) {
        throw new BadRequestException(
          'No availability rules found for this tour. Please contact support.',
        );
      }

      let matchedRule: any = null;
      const dayOfWeek = startDate.getUTCDay();

      for (const rule of rules) {
        // Skip if startDate is null
        if (!rule.startDate) continue;

        // Check date range
        if (
          startDate < rule.startDate ||
          (rule.endDate && startDate > rule.endDate)
        ) {
          continue;
        }

        // Check day of week (bitmask)
        const dayMatches =
          rule.daysOfWeek !== null
            ? (rule.daysOfWeek & (1 << dayOfWeek)) !== 0
            : false;
        if (!dayMatches) continue;

        // Check start_time match (hour and minute)
        if (!rule.startTime) continue;
        const ruleTime = new Date(rule.startTime);
        const ruleHours = ruleTime.getUTCHours();
        const ruleMinutes = ruleTime.getUTCMinutes();
        if (
          startDate.getUTCHours() !== ruleHours ||
          startDate.getUTCMinutes() !== ruleMinutes
        ) {
          continue;
        }

        // Check exceptions
        const exception = await this.prisma.availabilityException.findFirst({
          where: {
            tourId: dto.tourId,
            unavailableDate: {
              gte: new Date(startDate.toISOString().slice(0, 10)),
              lt: new Date(
                new Date(startDate.toISOString().slice(0, 10)).getTime() +
                  24 * 60 * 60 * 1000,
              ),
            },
          },
        });

        if (exception) {
          throw new BadRequestException(
            `This tour is not available on the selected date. Reason: ${exception.reason || 'Blocked date'}`,
          );
        }

        // Check the 1‑hour rule
        const now = new Date();
        const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000);
        if (startDate < minBookingTime) {
          throw new BadRequestException(
            'Bookings must be made at least 1 hour before the tour departure.',
          );
        }

        // If we get here, this rule matches
        matchedRule = rule;
        break;
      }

      if (!matchedRule) {
        throw new BadRequestException(
          'The selected date/time does not match any availability rule for this tour.',
        );
      }

      // Now we know the date/time is valid. Proceed to find or create schedule.
      const tourData = await this.prisma.tour.findUnique({
        where: { id: dto.tourId },
        select: {
          id: true,
          maxGroupSize: true,
          partnerId: true,
          isDeleted: true,
          name: true,
          price: true,
          currency: true,
        },
      });
      if (!tourData) throw new NotFoundException('Tour not found.');
      if (tourData.isDeleted)
        throw new BadRequestException('Tour is no longer available.');
      tour = tourData;

      // Try to find existing schedule for this exact startDate
      let existingSchedule = await this.prisma.tourSchedule.findFirst({
        where: {
          tourId: dto.tourId,
          startDate: startDate,
        },
        include: { tour: true },
      });

      if (!existingSchedule) {
        // Create on‑demand
        try {
          existingSchedule = await this.prisma.tourSchedule.create({
            data: {
              tourId: dto.tourId,
              startDate: startDate,
              seatsAvailable: tour.maxGroupSize ?? 0,
              startLocationId: dto.startLocationId || null,
            },
            include: { tour: true },
          });
        } catch (error) {
          // Two customers booking the same departure at the same moment both reach this
          // point; the second insert violates the unique (tour_id, start_date) index.
          // That's not an error for the customer — use the schedule the first one created.
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            existingSchedule = await this.prisma.tourSchedule.findFirst({
              where: { tourId: dto.tourId, startDate: startDate },
              include: { tour: true },
            });
            if (!existingSchedule) throw error;
          } else {
            throw error;
          }
        }
      }
      schedule = existingSchedule;
    } else if (dto.tourScheduleId) {
      // If tourScheduleId provided, fetch and validate
      schedule = await this.prisma.tourSchedule.findUnique({
        where: { id: dto.tourScheduleId },
        include: { tour: true },
      });
      if (!schedule) throw new NotFoundException('Tour schedule not found.');
      if (!schedule.tour)
        throw new BadRequestException('Tour not found for this schedule.');
      if (schedule.tour.isDeleted)
        throw new BadRequestException('Tour is no longer available.');
      tour = schedule.tour;
      // No need to re‑validate against rules – the schedule was created valid.
    }

    // 4. Check seat availability.
    // This is only a fast, friendly pre-check. Another customer can take the last seats
    // between this read and the write below, so the AUTHORITATIVE guard is the atomic
    // seat claim in step 7.
    const availableSeats = schedule.seatsAvailable ?? 0;
    if (availableSeats < dto.seatsBooked) {
      throw new BadRequestException('Not enough seats available.');
    }

    // 5. Partner isolation
    if (
      user.role === AppRole.PARTNER_ADMIN &&
      tour.partnerId !== user.partnerId
    ) {
      throw new ForbiddenException(
        'You can only book tours for your own partner.',
      );
    }

    // 6. Validate everything that can be validated BEFORE any seats are held.
    // Previously the price, fee and partner Stripe-account checks ran after the booking
    // had been created, so a tour with no onboarded partner left seats locked until the
    // cron expired the booking.
    if (!tour.partnerId) {
      throw new BadRequestException(
        'This tour is not associated with a partner.',
      );
    }

    const price = Number(tour.price ?? 0);
    const unitAmount = Math.round(price * 100);
    if (unitAmount <= 0) {
      throw new BadRequestException('This tour has no valid price.');
    }
    const totalAmount = unitAmount * dto.seatsBooked;

    // 💰 Calculate platform fee (commission percentage set in config)
    const PLATFORM_FEE_PERCENTAGE =
      this.configService.get<number>('PLATFORM_FEE_PERCENTAGE') || 10;
    const platformFee = Math.round(
      (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100,
    );

    // Fetch the partner's Stripe Connect account ID
    const partner = await this.prisma.partner.findUnique({
      where: { id: tour.partnerId },
      select: { stripeAccountId: true },
    });

    if (!partner?.stripeAccountId) {
      throw new BadRequestException(
        'The partner has not completed Stripe Connect onboarding. Please contact support.',
      );
    }

    // 7. Claim the seats and create the pending booking, atomically.
    // `updateMany` with `seatsAvailable >= n` is a single conditional UPDATE: if two
    // requests race for the last seats, exactly one matches the condition and the other
    // gets count 0. (A plain `update` + `decrement` has no such guard, so both succeed
    // and seatsAvailable goes negative — an oversold tour.)
    // The seat hold and the Stripe Checkout Session expire at the same instant.
    const sessionExpiresAtSec =
      Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS;
    const expiresAt = new Date(sessionExpiresAtSec * 1000);

    const booking = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.tourSchedule.updateMany({
        where: {
          id: schedule.id,
          seatsAvailable: { gte: dto.seatsBooked },
        },
        data: { seatsAvailable: { decrement: dto.seatsBooked } },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Not enough seats available.');
      }

      return tx.booking.create({
        data: {
          tourScheduleId: schedule.id,
          customerId: user.id,
          seatsBooked: dto.seatsBooked,
          status: BookingStatus.PENDING,
          expiresAt,
          partnerId: tour.partnerId,
        },
      });
    });

    // 8. Create Stripe Checkout Session with Connect split.
    // If Stripe is unreachable or rejects the request, hand the seats back immediately
    // instead of leaving them held by a booking nobody can pay for.
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: tour.currency || 'usd',
              product_data: {
                name: tour.name ?? 'Tour',
              },
              unit_amount: unitAmount,
            },
            quantity: dto.seatsBooked,
          },
        ],
        mode: 'payment',
        expires_at: sessionExpiresAtSec,
        // BP-6 FIX: README documents APP_URL; code previously read SITE_URL (undefined in
        // any env that only defines APP_URL → Stripe redirects silently pointed to undefined).
        success_url: `${this.configService.get('APP_URL')}/payment-success?booking_id=${booking.id}`,
        cancel_url: `${this.configService.get('APP_URL')}/payment-cancelled`,
        metadata: {
          booking_id: booking.id.toString(),
          user_id: user.id,
          partner_id: tour.partnerId.toString(),
        },
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: {
            destination: partner.stripeAccountId, // ✅ guaranteed string
          },
          transfer_group: `booking_${booking.id}`,
          metadata: {
            booking_id: booking.id.toString(),
            user_id: user.id,
            partner_id: tour.partnerId.toString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Stripe Checkout Session creation failed for booking ${booking.id}: ${error.message}`,
      );
      await this.releaseUnpaidBooking(booking.id).catch((releaseErr) =>
        this.logger.error(
          `Could not release seats for booking ${booking.id}: ${releaseErr.message}`,
        ),
      );
      throw new BadGatewayException(
        'We could not start the payment right now. Please try again shortly.',
      );
    }

    // 9. Create payment record
    try {
      await this.paymentsService.createPayment({
        bookingId: Number(booking.id),
        amount: price * dto.seatsBooked,
        currency: tour.currency || 'usd',
        provider: 'stripe',
        stripeSessionId: session.id,
        status: PaymentStatus.PENDING,
      });
    } catch (error) {
      // A payable session exists but we can't track it: close it and release the seats.
      this.logger.error(
        `Payment record creation failed for booking ${booking.id}: ${error.message}`,
      );
      await this.stripe.checkout.sessions
        .expire(session.id)
        .catch(() => undefined);
      await this.releaseUnpaidBooking(booking.id).catch(() => undefined);
      throw error;
    }

    this.logger.log(
      `📖 Booking created: ID ${booking.id}, checkout URL: ${session.url}`,
    );
    return { checkout_url: session.url };
  }

  // Hand back the seats of a booking whose checkout could not be started. Conditional on
  // PENDING, so it can never undo a booking that was confirmed or cancelled meanwhile.
  private async releaseUnpaidBooking(bookingId: number | bigint) {
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { seatsBooked: true, tourScheduleId: true },
      });
      if (!booking) return;

      const result = await tx.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: { status: BookingStatus.CANCELLED },
      });

      if (result.count === 1 && booking.tourScheduleId) {
        await tx.tourSchedule.update({
          where: { id: booking.tourScheduleId },
          data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
        });
      }
    });
  }

  // --- Resume payment ---
  async resumePayment(user: UserPayload, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tourSchedule: {
          include: {
            tour: {
              include: { partner: true },
            },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.customerId !== user.id) {
      throw new ForbiddenException('You do not own this booking.');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending.');
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new BadRequestException(
        'This booking has expired. Please create a new one.',
      );
    }
    if (
      booking.createdAt &&
      Date.now() - booking.createdAt.getTime() > MAX_PENDING_BOOKING_AGE_MS
    ) {
      throw new BadRequestException(
        'This booking can no longer be resumed. Please create a new one.',
      );
    }

    const tour = booking.tourSchedule?.tour;
    if (!tour)
      throw new BadRequestException('Tour not found for this booking.');

    // ✅ Check that the tour has a partner
    if (!tour.partnerId) {
      throw new BadRequestException('Tour has no associated partner.');
    }

    // ✅ Fetch the partner's Stripe Connect account ID
    const partner = await this.prisma.partner.findUnique({
      where: { id: tour.partnerId },
      select: { stripeAccountId: true },
    });

    if (!partner?.stripeAccountId) {
      throw new BadRequestException(
        'The partner has not completed Stripe Connect onboarding. Please contact support.',
      );
    }

    // BUG-8 FIX (corrected): price and currency come from the TOUR, exactly as in
    // createBookingWithCheckout(). The first attempt read `booking.pricePaid` /
    // `booking.currencyPaid`, but nothing in this codebase ever writes those columns —
    // so the price was always 0, the platform fee was always 0, and Stripe rejects a
    // $0 Checkout Session. (Snapshotting the price on the booking at creation time would
    // protect against a partner changing the price mid-checkout; that's a separate change.)
    const price = Number(tour.price ?? 0);
    const unitAmount = Math.round(price * 100);
    if (unitAmount <= 0) {
      throw new BadRequestException('This tour has no valid price.');
    }
    const totalAmount = unitAmount * (booking.seatsBooked ?? 1);

    // The original resumePayment session omitted `application_fee_amount`, so the
    // platform earned zero commission on any resumed payment. Re-calculate the platform
    // fee here, identical to the logic in createBookingWithCheckout().
    const PLATFORM_FEE_PERCENTAGE =
      this.configService.get<number>('PLATFORM_FEE_PERCENTAGE') || 10;
    const platformFee = Math.round(
      (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100,
    );

    // Remember the session we're replacing. It is closed only AFTER the new one is saved
    // (below): closing it first would fire a `checkout.session.expired` event for a session
    // still recorded as current, and the webhook would expire the very booking being resumed.
    const previousSessionId = await this.getLatestSessionId(Number(booking.id));

    const sessionExpiresAtSec =
      Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS;

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: tour.currency || 'usd',
              product_data: {
                name: tour.name ?? 'Tour',
              },
              unit_amount: unitAmount,
            },
            quantity: booking.seatsBooked ?? 1,
          },
        ],
        mode: 'payment',
        expires_at: sessionExpiresAtSec,
        // BP-6 FIX: Use APP_URL (matches README env var docs) instead of SITE_URL.
        success_url: `${this.configService.get('APP_URL')}/payment-success?booking_id=${booking.id}`,
        cancel_url: `${this.configService.get('APP_URL')}/payment-cancelled`,
        metadata: {
          booking_id: booking.id.toString(),
          user_id: user.id,
          partner_id: tour.partnerId.toString(),
        },
        payment_intent_data: {
          application_fee_amount: platformFee, // BUG-8 FIX: was missing
          transfer_data: {
            destination: partner.stripeAccountId,
          },
          transfer_group: `booking_${booking.id}`,
          metadata: {
            booking_id: booking.id.toString(),
            user_id: user.id,
            partner_id: tour.partnerId.toString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Resume: Stripe Checkout Session creation failed for booking ${booking.id}: ${error.message}`,
      );
      throw new BadGatewayException(
        'We could not restart the payment right now. Please try again shortly.',
      );
    }

    // The payment window restarts, so the seat hold must move with it — otherwise the
    // cron could expire the booking while its new session is still payable.
    const extended = await this.prisma.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.PENDING },
      data: { expiresAt: new Date(sessionExpiresAtSec * 1000) },
    });
    if (extended.count === 0) {
      await this.stripe.checkout.sessions
        .expire(session.id)
        .catch(() => undefined);
      throw new ConflictException(
        'This booking changed while the payment was being restarted. Please refresh.',
      );
    }

    await this.paymentsService.updatePaymentStripeSession(
      Number(booking.id),
      session.id,
    );

    // Close the old session so the customer can't pay twice.
    if (previousSessionId && previousSessionId !== session.id) {
      const outcome = await this.closeCheckoutSession(previousSessionId);
      if (outcome === 'already_paid') {
        // The old session was paid while we were creating the new one: keep it as the
        // booking's session (the refund path reads it) and discard the new one.
        await this.paymentsService.updatePaymentStripeSession(
          Number(booking.id),
          previousSessionId,
        );
        await this.stripe.checkout.sessions
          .expire(session.id)
          .catch(() => undefined);
        throw new ConflictException(
          'This booking has just been paid. Please refresh the page.',
        );
      }
    }

    return { checkout_url: session.url };
  }

  // --- Confirm booking (webhook) ---
  // Returns the booking's status AFTER the attempt, so the webhook can tell apart:
  //   CONFIRMED      → confirmed by this call
  //   CONFIRMED etc. → already confirmed by an earlier delivery of the same event (retry)
  //   EXPIRED / CANCELLED → the customer paid, but the booking can no longer be confirmed
  async confirmBooking(bookingId: number): Promise<BookingStatus | null> {
    // One conditional UPDATE, so a concurrent expire/cancel can't be overwritten.
    const result = await this.prisma.booking.updateMany({
      where: { id: bookingId, status: BookingStatus.PENDING },
      data: { status: BookingStatus.CONFIRMED },
    });
    if (result.count === 1) {
      this.logger.log(`✅ Booking ${bookingId} confirmed.`);
      return BookingStatus.CONFIRMED;
    }

    const current = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    if (!current) throw new NotFoundException('Booking not found.');
    this.logger.warn(
      `Booking ${bookingId} is ${current.status}, not pending — not confirmed by this call.`,
    );
    return current.status;
  }

  // --- Expire booking (webhook/cron) ---
  // `expiredSessionId` is passed by the `checkout.session.expired` webhook. If the booking has
  // since been given a NEW session (see resumePayment), the event is about a replaced session
  // and must not expire the booking.
  async expireBooking(bookingId: number, expiredSessionId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status !== BookingStatus.PENDING) {
      this.logger.warn(`Booking ${bookingId} is not pending, skipping expire.`);
      return;
    }

    if (expiredSessionId) {
      const currentSessionId = await this.getLatestSessionId(bookingId);
      if (currentSessionId && currentSessionId !== expiredSessionId) {
        this.logger.log(
          `Ignoring expiry of replaced session ${expiredSessionId} for booking ${bookingId}.`,
        );
        return;
      }
    }

    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');

    const expired = await this.prisma.$transaction(async (tx) => {
      // Conditional on PENDING: a payment confirmed a moment ago must not be overwritten.
      const result = await tx.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: { status: BookingStatus.EXPIRED },
      });
      if (result.count === 0) return false;

      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
      return true;
    });

    if (!expired) {
      this.logger.warn(`Booking ${bookingId} changed state, skipping expire.`);
      return;
    }

    // The payment never succeeded. (The cron path does the same after its own transaction.)
    try {
      await this.paymentsService.updatePaymentStatus(
        bookingId,
        PaymentStatus.FAILED,
      );
    } catch (error) {
      this.logger.warn(
        `Payment status update failed for expired booking ${bookingId}: ${error.message}`,
      );
    }

    this.logger.log(`⏰ Booking ${bookingId} expired and seats released.`);
  }

  // A refund takes the money back from the partner (`reverse_transfer`), so the platform's own
  // payout record has to say so — otherwise `platform_transfers` keeps showing money the
  // partner no longer has. Idempotent (only SUCCEEDED rows are touched) and never throws: the
  // refund and cancellation have already happened, and the `charge.refunded` webhook runs
  // this again, so a failure here repairs itself.
  private async markTransfersReversed(bookingId: number) {
    try {
      const result = await this.prisma.platformTransfer.updateMany({
        where: { bookingId, status: TransferStatus.SUCCEEDED },
        data: { status: TransferStatus.REVERSED },
      });
      if (result.count > 0) {
        this.logger.log(
          `↩️ ${result.count} platform transfer(s) for booking ${bookingId} marked REVERSED.`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not mark transfers reversed for booking ${bookingId}: ${error.message}`,
      );
    }
  }

  // --- Stripe Checkout Session helpers ---
  private async getLatestSessionId(bookingId: number): Promise<string | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      select: { stripeSessionId: true },
    });
    return payment?.stripeSessionId ?? null;
  }

  // Make an open Checkout Session unpayable. Never throws: callers decide what to do with the
  // outcome. If Stripe can't be reached the session may stay payable — acceptable, because a
  // payment for a booking that is no longer PENDING is refunded automatically by the webhook.
  private async closeCheckoutSession(
    sessionId: string,
  ): Promise<'closed' | 'already_paid' | 'unknown'> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === 'complete') return 'already_paid';
      if (session.status === 'open') {
        await this.stripe.checkout.sessions.expire(sessionId);
      }
      return 'closed';
    } catch (error) {
      this.logger.warn(
        `Could not close Checkout Session ${sessionId}: ${error.message}`,
      );
      return 'unknown';
    }
  }

  // --- Cancel booking (customer, or admin / partner admin acting on their behalf) ---
  async cancelBooking(user: UserPayload, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.checkAccess(user, booking);

    // BUG-9 FIX (user-facing path): only unpaid (PENDING) and paid-but-not-yet-started
    // (CONFIRMED) bookings may be cancelled. The previous check only rejected CANCELLED
    // and EXPIRED, so a customer could "cancel" a COMPLETED or NO_SHOW booking after the
    // tour — releasing seats on a past schedule and flagging the payment as refunded.
    // ONGOING (already checked in) is excluded too; if you want to allow it, make that an
    // explicit business rule rather than an accident of a missing guard.
    const cancellableStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(booking.status as BookingStatus)) {
      throw new BadRequestException(
        `A booking that is ${booking.status} cannot be cancelled.`,
      );
    }
    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');

    const wasPaid = booking.status === BookingStatus.CONFIRMED;
    const startDate = booking.tourSchedule.startDate;
    if (wasPaid && startDate && startDate <= new Date()) {
      throw new BadRequestException(
        'This tour has already started and can no longer be cancelled.',
      );
    }

    // BUG-5 FIX (corrected): a paid booking is only marked REFUNDED if a refund was
    // actually issued. The first attempt set REFUNDED without ever calling Stripe, so the
    // database claimed a refund that never happened. We now refund FIRST: if Stripe
    // fails, an error is thrown and NOTHING has changed — the booking stays CONFIRMED and
    // the customer can retry.
    if (wasPaid) {
      await this.refundBookingPayment(bookingId);
    }

    // Conditional on the status we read above, so a concurrent change (e.g. the
    // `checkout.session.completed` webhook confirming a PENDING booking at the same
    // moment) can't be silently overwritten.
    const cancelled = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: BookingStatus.CANCELLED },
      });
      if (result.count === 0) return false;

      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
      return true;
    });

    if (!cancelled) {
      // If a refund was already issued above, the `charge.refunded` webhook reconciles
      // the booking and payment records when it arrives (see cancelBookingByAdmin).
      throw new ConflictException(
        'This booking changed while it was being cancelled. Please refresh and try again.',
      );
    }

    // An unpaid booking may still have an open Checkout Session: close it so it can't be
    // paid after the cancellation. If the customer paid in the meantime, the webhook sees a
    // CANCELLED booking and refunds the payment automatically.
    if (!wasPaid) {
      const sessionId = await this.getLatestSessionId(bookingId);
      if (sessionId) {
        const outcome = await this.closeCheckoutSession(sessionId);
        if (outcome === 'already_paid') {
          this.logger.warn(
            `Booking ${bookingId} was paid while it was being cancelled; the payment webhook will refund it.`,
          );
        }
      }
    }

    // PENDING → payment never succeeded → FAILED. CONFIRMED → a refund was just issued
    // above → REFUNDED.
    const paymentStatus = wasPaid
      ? PaymentStatus.REFUNDED
      : PaymentStatus.FAILED;
    await this.paymentsService.updatePaymentStatus(bookingId, paymentStatus);
    if (wasPaid) {
      await this.markTransfersReversed(bookingId);
    }

    this.logger.log(
      `❌ Booking ${bookingId} cancelled, seats released, payment marked ${paymentStatus}.`,
    );
    return { message: 'Booking cancelled and seats released.' };
  }

  // --- Issue a full Stripe refund for a paid booking ---
  private async refundBookingPayment(bookingId: number): Promise<void> {
    const sessionId = await this.getLatestSessionId(bookingId);
    if (!sessionId) {
      throw new BadRequestException(
        'No Stripe payment was found for this booking, so it cannot be refunded automatically. Please contact support.',
      );
    }

    let paymentIntentId: string | undefined;
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
    } catch (error) {
      this.logger.error(
        `Could not load Checkout Session for booking ${bookingId}: ${error.message}`,
      );
    }

    const failureMessage =
      'We could not process the refund right now. Your booking was not cancelled — please try again shortly.';
    if (!paymentIntentId) {
      throw new BadGatewayException(failureMessage);
    }
    await this.refundPaymentIntent(
      paymentIntentId,
      `booking ${bookingId}`,
      failureMessage,
    );
  }

  // Full refund of one PaymentIntent. Public: the Stripe webhook also uses it to refund a
  // payment that arrives for a booking that is no longer confirmable.
  // The payment is a destination charge (see createBookingWithCheckout), so the refund also
  // takes the partner's transfer back and returns the platform's application fee —
  // otherwise the platform would be paying refunds out of its own balance.
  async refundPaymentIntent(
    paymentIntentId: string,
    context: string,
    failureMessage = 'We could not process the refund right now. Please try again shortly.',
  ): Promise<void> {
    try {
      // No explicit idempotency key on purpose: Stripe replays the result of a keyed
      // request for 24h, including failures, which would make a transient error
      // un-retryable. A double click is already safe — a second full refund of the same
      // charge is rejected by Stripe with `charge_already_refunded`, handled below.
      await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        refund_application_fee: true,
        reverse_transfer: true,
      });
    } catch (error) {
      if (error?.code === 'charge_already_refunded') {
        // E.g. refunded manually from the Stripe dashboard first — the goal (money
        // returned) is already achieved.
        this.logger.warn(
          `${context}: charge was already refunded in Stripe; continuing.`,
        );
        return;
      }
      this.logger.error(`Refund failed for ${context}: ${error.message}`);
      throw new BadGatewayException(failureMessage);
    }
  }

  // --- Apply a full Stripe refund to a booking (called by the `charge.refunded` webhook) ---
  // Kept under its original name so the webhook controller needs no change.
  async cancelBookingByAdmin(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) {
      // Stripe retrying can't make a missing booking appear, so answer the webhook
      // normally instead of throwing (which would just cause endless retries).
      this.logger.warn(
        `Refund event for unknown booking ${bookingId} — nothing to update.`,
      );
      return;
    }

    // BUG-9 FIX (corrected): the money has ALREADY been returned in Stripe by the time
    // this runs, so the payment record must say REFUNDED whatever state the booking is
    // in. The first attempt returned early for terminal bookings *before* touching the
    // payment, leaving a refunded COMPLETED booking showing SUCCEEDED forever.
    await this.paymentsService.updatePaymentStatus(
      bookingId,
      PaymentStatus.REFUNDED,
    );

    // The refund also took the money back from the partner, so the platform's payout
    // record must say so — again regardless of the booking's state.
    await this.markTransfersReversed(bookingId);

    // Terminal bookings keep their status (and their seats stay as they are): a late
    // refund webhook must never revert a COMPLETED or NO_SHOW booking back to CANCELLED.
    const terminalStatuses: BookingStatus[] = [
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
      BookingStatus.COMPLETED,
      BookingStatus.NO_SHOW,
    ];
    if (terminalStatuses.includes(booking.status as BookingStatus)) {
      this.logger.warn(
        `Booking ${bookingId} already in terminal state ${booking.status}; payment marked REFUNDED, booking left unchanged.`,
      );
      return;
    }

    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: BookingStatus.CANCELLED },
      });
      if (result.count === 0) {
        // Changed under us. Throwing makes the webhook answer 500, Stripe retries, and
        // the retry sees the booking's new state.
        throw new ConflictException(
          `Booking ${bookingId} changed state during refund handling.`,
        );
      }

      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
    });

    this.logger.log(
      `🔄 Booking ${bookingId} cancelled (full refund event), seats released, payment marked REFUNDED.`,
    );
  }

  // --- Check-in a booking (customer confirms attendance) ---
  async checkIn(user: UserPayload, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tourSchedule: {
          include: {
            tour: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }

    // ✅ Check tourSchedule exists
    if (!booking.tourSchedule) {
      throw new BadRequestException(
        'Tour schedule not found for this booking.',
      );
    }

    // ✅ Check startDate exists
    if (!booking.tourSchedule.startDate) {
      throw new BadRequestException('Tour schedule has no start date.');
    }

    // Security: check access
    this.checkAccess(user, booking);

    // Must be CONFIRMED
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking is ${booking.status}, cannot check in.`,
      );
    }

    // Check-in must be on or after the tour start date
    const now = new Date();
    if (now < booking.tourSchedule.startDate) {
      throw new BadRequestException(
        'Check-in is only available on or after the tour start date.',
      );
    }

    // Mark as ONGOING
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ONGOING },
    });
  }

  // --- Find all bookings ---
  async findAll(user: UserPayload) {
    const where: any = {};
    if (user.role === AppRole.ADMIN) {
      // no filter
    } else if (user.role === AppRole.PARTNER_ADMIN) {
      where.partnerId = user.partnerId;
    } else {
      where.customerId = user.id;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        tourSchedule: {
          include: { tour: true, location: true },
        },
        user: { select: { id: true, email: true } },
        partner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Find one booking ---
  async findOne(user: UserPayload, id: number) {
    const booking = await this.findBookingById(id);
    this.checkAccess(user, booking);
    return booking;
  }

  private async findBookingById(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tourSchedule: { include: { tour: true, location: true } },
        user: { select: { id: true, email: true } },
        partner: { select: { id: true, name: true } },
      },
    });
    if (!booking)
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    return booking;
  }

  private checkAccess(user: UserPayload, booking: any) {
    if (user.role === AppRole.ADMIN) return;
    if (user.role === AppRole.CUSTOMER) {
      if (booking.customerId !== user.id) {
        throw new ForbiddenException('You do not have access to this booking.');
      }
      return;
    }
    if (user.role === AppRole.PARTNER_ADMIN) {
      if (booking.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have access to this booking.');
      }
      return;
    }
    throw new ForbiddenException('You do not have access to this booking.');
  }
}

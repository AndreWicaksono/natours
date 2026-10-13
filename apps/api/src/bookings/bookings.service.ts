import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import { UserPayload } from '../auth/user-payload.interface';
import {
  AppRole,
  BookingStatus,
  PaymentStatus,
} from '../generated/prisma/enums';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from 'src/payments/payments.service';

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
        existingSchedule = await this.prisma.tourSchedule.create({
          data: {
            tourId: dto.tourId,
            startDate: startDate,
            seatsAvailable: tour.maxGroupSize ?? 0,
            startLocationId: dto.startLocationId || null,
          },
          include: { tour: true },
        });
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

    // 4. Check seat availability
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

    // 6. Create pending booking and decrement seats (transaction)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const booking = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          tourScheduleId: schedule.id,
          customerId: user.id,
          seatsBooked: dto.seatsBooked,
          status: BookingStatus.PENDING,
          expiresAt,
          partnerId: tour.partnerId,
        },
      });

      await tx.tourSchedule.update({
        where: { id: schedule.id },
        data: { seatsAvailable: { decrement: dto.seatsBooked } },
      });

      return b;
    });

    // 7. Create Stripe Checkout Session with Connect split
    const price = Number(tour.price ?? 0);
    const unitAmount = Math.round(price * 100);
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

    const session = await this.stripe.checkout.sessions.create({
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

    // 8. Create payment record
    await this.paymentsService.createPayment({
      bookingId: Number(booking.id),
      amount: price * dto.seatsBooked,
      currency: tour.currency || 'usd',
      provider: 'stripe',
      stripeSessionId: session.id,
      status: PaymentStatus.PENDING,
    });

    this.logger.log(
      `📖 Booking created: ID ${booking.id}, checkout URL: ${session.url}`,
    );
    return { checkout_url: session.url };
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

    const session = await this.stripe.checkout.sessions.create({
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

    await this.paymentsService.updatePaymentStripeSession(
      Number(booking.id),
      session.id,
    );

    return { checkout_url: session.url };
  }

  // --- Confirm booking (webhook) ---
  async confirmBooking(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status !== BookingStatus.PENDING) {
      this.logger.warn(
        `Booking ${bookingId} is not pending, skipping confirmation.`,
      );
      return;
    }
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
    this.logger.log(`✅ Booking ${bookingId} confirmed.`);
  }

  // --- Expire booking (webhook/cron) ---
  async expireBooking(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status !== BookingStatus.PENDING) {
      this.logger.warn(`Booking ${bookingId} is not pending, skipping expire.`);
      return;
    }
    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.EXPIRED },
      });
      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
    });
    this.logger.log(`⏰ Booking ${bookingId} expired and seats released.`);
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

    // PENDING → payment never succeeded → FAILED. CONFIRMED → a refund was just issued
    // above → REFUNDED.
    const paymentStatus = wasPaid
      ? PaymentStatus.REFUNDED
      : PaymentStatus.FAILED;
    await this.paymentsService.updatePaymentStatus(bookingId, paymentStatus);

    this.logger.log(
      `❌ Booking ${bookingId} cancelled, seats released, payment marked ${paymentStatus}.`,
    );
    return { message: 'Booking cancelled and seats released.' };
  }

  // --- Issue a full Stripe refund for a paid booking ---
  // The payment is a destination charge (see createBookingWithCheckout), so the refund
  // also takes the partner's transfer back and returns the platform's application fee —
  // otherwise the platform would be paying refunds out of its own balance.
  private async refundBookingPayment(bookingId: number): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      select: { stripeSessionId: true },
    });

    if (!payment?.stripeSessionId) {
      throw new BadRequestException(
        'No Stripe payment was found for this booking, so it cannot be refunded automatically. Please contact support.',
      );
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(
        payment.stripeSessionId,
      );
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!paymentIntentId) {
        throw new Error('Checkout session has no payment intent');
      }

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
        // returned) is already achieved, so carry on and cancel the booking.
        this.logger.warn(
          `Booking ${bookingId}: charge was already refunded in Stripe; continuing with cancellation.`,
        );
        return;
      }
      this.logger.error(
        `Refund failed for booking ${bookingId}: ${error.message}`,
      );
      throw new BadGatewayException(
        'We could not process the refund right now. Your booking was not cancelled — please try again shortly.',
      );
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
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

    // 7. Create Stripe Checkout Session
    const price = Number(tour.price ?? 0);
    const unitAmount = Math.round(price * 100);

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
      success_url: `${this.configService.get('SITE_URL')}/payment-success?booking_id=${booking.id}`,
      cancel_url: `${this.configService.get('SITE_URL')}/payment-cancelled`,
      // ✅ Session-level metadata (for checkout.session.completed)
      metadata: {
        booking_id: booking.id.toString(),
        user_id: user.id,
      },
      // ✅ Propagate to Payment Intent (for payment_intent.* and charge.* events)
      payment_intent_data: {
        metadata: {
          booking_id: booking.id.toString(),
          user_id: user.id,
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
          include: { tour: true },
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

    const price = Number(booking.pricePaid ?? 0);
    const unitAmount = Math.round(price * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: booking.currencyPaid || 'usd',
            product_data: {
              name: tour.name ?? 'Tour',
            },
            unit_amount: unitAmount,
          },
          quantity: booking.seatsBooked ?? 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('SITE_URL')}/payment-success?booking_id=${booking.id}`,
      cancel_url: `${this.configService.get('SITE_URL')}/payment-cancelled`,
      metadata: {
        booking_id: booking.id.toString(),
        user_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id.toString(),
          user_id: user.id,
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

  // --- Cancel booking (user) ---
  async cancelBooking(user: UserPayload, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.checkAccess(user, booking);
    // Check if booking status is already cancelled or expired
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.EXPIRED
    ) {
      throw new BadRequestException(`Booking is already ${booking.status}.`);
    }
    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });
      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
    });

    // ✅ Update payment status to FAILED
    await this.paymentsService.updatePaymentStatus(
      bookingId,
      PaymentStatus.FAILED,
    );

    this.logger.log(
      `❌ Booking ${bookingId} cancelled, seats released, and payment marked FAILED.`,
    );
    return { message: 'Booking cancelled and seats released.' };
  }

  // --- Cancel booking by admin (webhook refund) ---
  async cancelBookingByAdmin(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tourSchedule: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.EXPIRED
    ) {
      this.logger.warn(
        `Booking ${bookingId} already ${booking.status}, skipping.`,
      );
      return;
    }
    if (!booking.tourSchedule)
      throw new BadRequestException('Tour schedule not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });
      await tx.tourSchedule.update({
        where: { id: booking.tourSchedule!.id },
        data: { seatsAvailable: { increment: booking.seatsBooked ?? 0 } },
      });
    });

    // ✅ Update payment status to FAILED
    await this.paymentsService.updatePaymentStatus(
      bookingId,
      PaymentStatus.FAILED,
    );

    this.logger.log(
      `🔄 Booking ${bookingId} cancelled due to refund, payment marked FAILED.`,
    );
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

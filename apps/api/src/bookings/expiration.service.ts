import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { BookingStatus, PaymentStatus } from '../generated/prisma/enums';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  @Cron('*/15 * * * *')
  async handleExpiredBookings() {
    this.logger.log('⏰ Running expired bookings cleanup...');

    try {
      const now = new Date();

      const expired = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING,
          expiresAt: { lt: now },
        },
        include: { tourSchedule: true },
      });

      if (expired.length === 0) {
        this.logger.debug('No expired bookings found.');
        return;
      }

      // BUG-3 FIX: The previous implementation called `paymentsService.updatePaymentStatus()`
      // *inside* the `prisma.$transaction()` callback. That service method uses its own
      // `this.prisma` reference — a separate connection from the transaction client `tx` —
      // so it was NOT enlisted in the same transaction. If the outer transaction rolled back
      // (e.g., a seat-increment failure), the payment records had already been mutated with
      // no way to roll them back.
      //
      // Fix: collect the IDs of successfully processed bookings AFTER the transaction commits,
      // then update payment statuses as a separate, post-commit step. If the payment update
      // fails, the worst case is a booking correctly marked EXPIRED with seats released but
      // the payment record still showing PENDING — far safer than the reverse (payment mutated
      // but booking not expired, which would leave seats permanently blocked).
      const processedIds: number[] = [];

      await this.prisma.$transaction(async (tx) => {
        for (const booking of expired) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });

          if (booking.tourSchedule && booking.seatsBooked) {
            await tx.tourSchedule.update({
              where: { id: booking.tourSchedule.id },
              data: { seatsAvailable: { increment: booking.seatsBooked } },
            });
          }

          // Collect IDs rather than calling paymentsService here (would bypass tx)
          processedIds.push(Number(booking.id));
        }
      });

      // Post-commit: update payment statuses for all bookings that were successfully expired.
      // This runs outside the transaction by design — if it fails we get a warning log
      // but the booking/seat state (the critical data) is already correct and committed.
      for (const bookingId of processedIds) {
        try {
          await this.paymentsService.updatePaymentStatus(
            bookingId,
            PaymentStatus.FAILED,
          );
        } catch (paymentErr) {
          this.logger.warn(
            `⚠️ Payment status update failed for expired booking ${bookingId}: ${paymentErr.message}. Booking/seats are correctly expired.`,
          );
        }
      }

      this.logger.log(
        `✅ Expired ${processedIds.length} bookings, released seats, updated payments.`,
      );
    } catch (error) {
      this.logger.error('Failed to process expired bookings:', error);
    }
  }
}
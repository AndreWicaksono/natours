import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service'; // <-- Import
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

      await this.prisma.$transaction(async (tx) => {
        for (const booking of expired) {
          // Update booking status to EXPIRED
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });

          // Release seats
          if (booking.tourSchedule && booking.seatsBooked) {
            await tx.tourSchedule.update({
              where: { id: booking.tourSchedule.id },
              data: { seatsAvailable: { increment: booking.seatsBooked } },
            });
          }

          // ✅ Update payment status to FAILED
          await this.paymentsService.updatePaymentStatus(
            Number(booking.id),
            PaymentStatus.FAILED,
          );
        }
      });

      this.logger.log(`✅ Expired ${expired.length} bookings, released seats, and updated payments.`);
    } catch (error) {
      this.logger.error('Failed to process expired bookings:', error);
    }
  }
}
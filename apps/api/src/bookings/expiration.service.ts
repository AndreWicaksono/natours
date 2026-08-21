import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../generated/prisma/enums';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/15 * * * *') // Every 15 minutes
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
        }
      });

      this.logger.log(`✅ Expired ${expired.length} bookings and released seats.`);
    } catch (error) {
      this.logger.error('Failed to process expired bookings:', error);
    }
  }
}
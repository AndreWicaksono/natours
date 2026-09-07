import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { BookingStatus } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingStatusService {
  private readonly logger = new Logger(BookingStatusService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 1 * * *') // Run daily at 1 AM
  async updateBookingStatuses() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. CONFIRMED → NO_SHOW (tour start date has passed, no check-in)
    const noShows = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.CONFIRMED,
        tourSchedule: {
          startDate: { lt: today },
        },
      },
      data: { status: BookingStatus.NO_SHOW },
    });

    // 2. ONGOING → COMPLETED (tour end date has passed)
    const completed = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.ONGOING,
        tourSchedule: {
          tour: {
            durationDays: { gt: 0 },
          },
        },
        // Note: You'll need to calculate end date = startDate + durationDays
        // This requires a more complex query or a computed field
      },
      data: { status: BookingStatus.COMPLETED },
    });

    this.logger.log(
      `🔄 Updated bookings: ${noShows.count} → NO_SHOW, ${completed.count} → COMPLETED`,
    );
  }
}

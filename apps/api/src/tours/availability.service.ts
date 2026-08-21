import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private prisma: PrismaService) {}

  async getAvailableDates(tourId: number, month: number, year: number) {
    const rule = await this.prisma.availabilityRule.findFirst({
      where: { tourId },
    });

    if (!rule) {
      this.logger.debug(`No availability rule found for tour ${tourId}`);
      return [];
    }

    if (!rule.startDate || !rule.startTime) {
      this.logger.warn(`Rule for tour ${tourId} is missing startDate or startTime`);
      return [];
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const exceptions = await this.prisma.availabilityException.findMany({
      where: {
        tourId,
        unavailableDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { unavailableDate: true },
    });

    const exceptionDates = new Set(
      exceptions
        .filter((e) => e.unavailableDate !== null)
        .map((e) => e.unavailableDate!.toISOString().slice(0, 10)),
    );

    const availableSlots: string[] = [];
    const currentDate = new Date(startOfMonth);

    // ✅ Extract time from the stored time value
    const startTime = new Date(rule.startTime);
    const hours = startTime.getUTCHours();
    const minutes = startTime.getUTCMinutes();

    const now = new Date();

    while (currentDate <= endOfMonth) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dayOfWeek = currentDate.getUTCDay();

      const withinRange =
        currentDate >= rule.startDate &&
        (!rule.endDate || currentDate <= rule.endDate);

      const dayMatches = rule.daysOfWeek !== null
        ? (rule.daysOfWeek & (1 << dayOfWeek)) !== 0
        : false;

      if (withinRange && dayMatches && !exceptionDates.has(dateStr)) {
        const departure = new Date(currentDate);
        departure.setUTCHours(hours, minutes, 0, 0);

        // ✅ Check departure is at least 1 hour from now
        const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000);
        if (departure > minBookingTime) {
          availableSlots.push(departure.toISOString());
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const grouped: Record<string, string[]> = {};
    for (const iso of availableSlots) {
      const dateKey = iso.slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(iso);
    }

    return Object.entries(grouped).map(([date, times]) => ({ date, times }));
  }
}
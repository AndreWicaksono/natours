import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { AppRole, BookingStatus } from 'src/generated/prisma/enums';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateReviewDTO } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async create(bookingId: bigint, user: { id: string, role: AppRole }, dto: CreateReviewDTO) {
        const currentBooking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tourSchedule: { select: { tourId: true } } },
        });

        if (!currentBooking) {
            throw new NotFoundException('Booking not found');
        }
        if (currentBooking.customerId !== user.id) {
            throw new ForbiddenException('This booking does not belong to you');
        }
        if (currentBooking.status !== BookingStatus.COMPLETED) {
            throw new BadRequestException('You can only review completed bookings');
        }
        if (!currentBooking.tourSchedule) {
            throw new BadRequestException('This booking has no associated tour schedule');
        }

        const isReviewExist = await this.prisma.review.findUnique({ where: { bookingId } });
        if (isReviewExist) {
            throw new ConflictException('You already reviewed this booking');
        }

        try {
            return await this.prisma.review.create({
                data: {
                    bookingId,
                    tourId: currentBooking.tourSchedule.tourId,
                    customerId: user.id,
                    ...dto,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('You already reviewed this booking');
            }
            throw error;
        }
    }
}

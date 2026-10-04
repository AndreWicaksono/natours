import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import type { UserPayload } from 'src/auth/user-payload.interface';

import { AppRole } from 'src/generated/prisma/enums';
import { CreateReviewDTO } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@Controller('bookings/:bookingId/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    @Post()
    @Roles(AppRole.CUSTOMER)
    create(
        @Param('bookingId') bookingId: string,
        @CurrentUser() user: UserPayload,
        @Body() dto: CreateReviewDTO,
    ) {
        let parsedBookingId: bigint;
        try {
            parsedBookingId = BigInt(bookingId);
        } catch {
            throw new BadRequestException('Invalid booking ID');
        }
        return this.reviewsService.create(parsedBookingId, user, dto);
    }

}

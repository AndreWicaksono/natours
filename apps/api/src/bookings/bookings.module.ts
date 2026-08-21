import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { ExpirationService } from './expiration.service';

@Module({
  imports: [PrismaModule, forwardRef(() => PaymentsModule)],
  controllers: [BookingsController],
  providers: [BookingsService, ExpirationService],
  exports: [BookingsService],
})
export class BookingsModule {}

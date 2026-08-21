import { forwardRef, Module } from '@nestjs/common';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, forwardRef(() => BookingsModule),],
  controllers: [StripeWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
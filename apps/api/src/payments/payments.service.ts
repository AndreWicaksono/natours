import { Injectable, Logger } from '@nestjs/common';

import { PaymentStatus } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Update the payment status for a given booking ID
   */
  async updatePaymentStatus(bookingId: number, status: PaymentStatus | string) {
    // If status is a string, convert it to the enum value
    const statusEnum =
      typeof status === 'string'
        ? PaymentStatus[status.toUpperCase() as keyof typeof PaymentStatus]
        : status;

    if (!statusEnum) {
      throw new Error(`Invalid payment status: ${status}`);
    }

    const result = await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { status: statusEnum },
    });

    if (result.count === 0) {
      this.logger.warn(`No payment found for booking ${bookingId}`);
    } else {
      this.logger.log(
        `💳 Payment status updated to ${status} for booking ${bookingId}`,
      );
    }
    return result;
  }

  /**
   * Update the Stripe session ID for a payment record
   */
  async updatePaymentStripeSession(bookingId: number, stripeSessionId: string) {
    const result = await this.prisma.payment.updateMany({
      where: { bookingId },
      data: { stripeSessionId },
    });

    if (result.count === 0) {
      this.logger.warn(`No payment found for booking ${bookingId}`);
    } else {
      this.logger.log(`💳 Stripe session ID updated for booking ${bookingId}`);
    }
    return result;
  }

  /**
   * Create a payment record (can be used by BookingsService)
   */
  async createPayment(data: {
    bookingId: number;
    amount: number;
    currency: string;
    provider: string;
    stripeSessionId: string;
    status: PaymentStatus;
  }) {
    return this.prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        stripeSessionId: data.stripeSessionId,
        status: data.status,
      },
    });
  }
}

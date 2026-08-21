import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingsService } from '../../bookings/bookings.service';
import { PaymentsService } from '../payments.service';
import { Public } from '../../auth/public.decorator';
import { PaymentStatus } from 'src/generated/prisma/enums';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.stripe = new Stripe(secretKey);
  }

  @Post()
  @Public()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    console.log('🔔 Webhook received!');

    // ✅ With express.raw, the raw body is in req.body (Buffer)
    const rawBody = req.body; // This is a Buffer or string

    const sig = req.headers['stripe-signature'] as string | undefined;
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SIGNING_SECRET',
    );

    if (!sig) {
      console.error('Missing Stripe signature header');
      return res.status(400).send('Missing Stripe signature');
    }
    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SIGNING_SECRET is not set');
      return res.status(500).send('Webhook secret not configured');
    }
    if (!rawBody) {
      console.error('Missing raw body – express.raw middleware not working');
      return res.status(400).send('Missing raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 Stripe event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = parseInt(session.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.bookingsService.confirmBooking(bookingId);
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.SUCCEEDED,
            );
            console.log(
              `✅ Booking ${bookingId} confirmed and payment succeeded.`,
            );
          }
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = parseInt(session.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.bookingsService.expireBooking(bookingId);
          }
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const bookingId = parseInt(charge.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.bookingsService.cancelBookingByAdmin(bookingId);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          // Optionally update payment status
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook processing error:', error.message);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }

    return res.status(200).json({ received: true });
  }
}

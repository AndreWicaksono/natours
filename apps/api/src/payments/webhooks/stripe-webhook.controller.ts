import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingsService } from '../../bookings/bookings.service';
import { PaymentsService } from '../payments.service';
import { Public } from '../../auth/public.decorator';
import { PaymentStatus, TransferStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
    private prisma: PrismaService,
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
          const partnerId = parseInt(session.metadata?.partner_id ?? '');

          if (!isNaN(bookingId) && !isNaN(partnerId)) {
            // Confirm booking and update payment status
            await this.bookingsService.confirmBooking(bookingId);
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.SUCCEEDED,
            );

            // Retrieve Payment Intent to get application fee and transfer details
            let paymentIntent: Stripe.PaymentIntent | null = null;
            if (session.payment_intent) {
              const piId =
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent.id;
              paymentIntent = await this.stripe.paymentIntents.retrieve(piId);
            }

            // Calculate amounts safely
            const grossAmount = (session.amount_total ?? 0) / 100;
            const platformFee = paymentIntent?.application_fee_amount
              ? paymentIntent.application_fee_amount / 100
              : 0;
            const netAmount = grossAmount - platformFee;

            // ✅ Get transfer ID (using any cast because TypeScript doesn't know about this property)
            const transferId = (paymentIntent as any)?.transfer || null;

            // Record the transfer
            await this.prisma.platformTransfer.create({
              data: {
                bookingId: bookingId,
                partnerId: partnerId,
                grossAmount: grossAmount,
                platformFee: platformFee,
                netAmount: netAmount,
                stripeTransferId: transferId || 'pending',
                status: TransferStatus.SUCCEEDED,
                succeededAt: new Date(),
              },
            });

            console.log(
              `✅ Booking ${bookingId} confirmed, payment succeeded, and transfer recorded.`,
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
          // ✅ Now available from payment_intent_data.metadata (propagated to charge)
          const bookingId = parseInt(charge.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.bookingsService.cancelBookingByAdmin(bookingId);
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.FAILED,
            );
            console.log(`💳 Payment refunded for booking ${bookingId}`);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          // ✅ Now available from payment_intent_data.metadata
          const bookingId = parseInt(paymentIntent.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.FAILED,
            );
            console.log(`💳 Payment failed for booking ${bookingId}`);
          }
          break;
        }
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          const partnerId = account.metadata?.partnerId;

          if (partnerId) {
            const detailsSubmitted = account.details_submitted;
            const chargesEnabled = account.charges_enabled;
            const payoutsEnabled = account.payouts_enabled;

            let status = 'pending';
            if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
              status = 'active';
            } else if (detailsSubmitted) {
              status = 'restricted';
            }

            await this.prisma.partner.update({
              where: { stripeAccountId: account.id },
              data: { stripeOnboardingStatus: status },
            });

            console.log(
              `✅ Partner ${partnerId} onboarding status updated to ${status}`,
            );
          }
          break;
        }
        case 'transfer.created': {
          const transfer = event.data.object as Stripe.Transfer;
          const bookingId = parseInt(
            transfer.transfer_group?.replace('booking_', '') ?? '',
          );

          if (!isNaN(bookingId)) {
            await this.prisma.platformTransfer.updateMany({
              where: { bookingId, stripeTransferId: 'pending' },
              data: { stripeTransferId: transfer.id },
            });
            console.log(
              `✅ Transfer ID updated for booking ${bookingId}: ${transfer.id}`,
            );
          }
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

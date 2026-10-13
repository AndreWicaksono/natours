import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingsService } from '../../bookings/bookings.service';
import { PaymentsService } from '../payments.service';
import { Public } from '../../auth/public.decorator';
import { Prisma } from 'src/generated/prisma/client';
import { PaymentStatus, TransferStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  // BP-1 FIX: Use NestJS Logger instead of raw console.log
  private readonly logger = new Logger(StripeWebhookController.name);
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
    const rawBody = req.body; // Buffer from express.raw
    const sig = req.headers['stripe-signature'] as string | undefined;
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SIGNING_SECRET',
    );

    if (!sig) {
      this.logger.error('Missing Stripe signature header');
      return res.status(400).send('Missing Stripe signature');
    }
    if (!endpointSecret) {
      this.logger.error('STRIPE_WEBHOOK_SIGNING_SECRET is not set');
      return res.status(500).send('Webhook secret not configured');
    }
    if (!rawBody) {
      this.logger.error('Missing raw body – express.raw middleware not working');
      return res.status(400).send('Missing raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // BP-2 FIX: Idempotency via the `stripe_webhook_events` table, so a redelivered
    // event is never processed twice.
    //
    // Claim the event with a single INSERT (the primary key makes it atomic — two
    // concurrent deliveries can't both succeed, unlike findUnique-then-create). The claim
    // is RELEASED if processing fails (see the catch block below): we answer 500 so
    // Stripe retries, and that retry must be allowed to reprocess the event. Recording
    // the event without releasing it on failure would turn every transient error into a
    // permanently lost event — e.g. a paid booking that never gets confirmed.
    let claimed = false;
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { eventId: event.id },
      });
      claimed = true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.debug(`Webhook event ${event.id} already processed. Skipping.`);
        return res.status(200).json({ received: true });
      }
      // Unexpected DB error: bookkeeping must not block payment processing. The
      // handlers below are written to be safe to run again if Stripe redelivers.
      this.logger.error(`Failed to record webhook idempotency: ${err.message}`);
    }

    this.logger.log(`📨 Processing Stripe event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = parseInt(session.metadata?.booking_id ?? '');
          const partnerId = parseInt(session.metadata?.partner_id ?? '');

          if (!isNaN(bookingId) && !isNaN(partnerId)) {
            await this.bookingsService.confirmBooking(bookingId);
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.SUCCEEDED,
            );

            let paymentIntent: Stripe.PaymentIntent | null = null;
            if (session.payment_intent) {
              const piId =
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent.id;
              paymentIntent = await this.stripe.paymentIntents.retrieve(piId);
            }

            const grossAmount = (session.amount_total ?? 0) / 100;
            const platformFee = paymentIntent?.application_fee_amount
              ? paymentIntent.application_fee_amount / 100
              : 0;
            const netAmount = grossAmount - platformFee;

            const transferId = (paymentIntent as any)?.transfer || null;

            // Retry-safe: if an earlier attempt at this event already recorded the
            // transfer (and failed afterwards), don't create a duplicate.
            const existingTransfer = await this.prisma.platformTransfer.findFirst({
              where: { bookingId },
              select: { id: true },
            });

            if (!existingTransfer) {
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
            }

            this.logger.log(
              `✅ Booking ${bookingId} confirmed, payment succeeded, transfer recorded.`,
            );
          }
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = parseInt(session.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.bookingsService.expireBooking(bookingId);
            this.logger.log(`⏰ Booking ${bookingId} expired from Stripe session.`);
          }
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;

          // This event also fires for PARTIAL refunds. `charge.refunded` is only true
          // once the charge is fully refunded; a partial refund must not cancel the
          // booking or release its seats.
          if (!charge.refunded) {
            this.logger.log(
              `💳 Partial refund on charge ${charge.id} — booking left unchanged.`,
            );
            break;
          }

          const bookingId = parseInt(charge.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            // Marks the payment REFUNDED always; cancels the booking and releases seats
            // only if it isn't already in a final state (see BookingsService).
            await this.bookingsService.cancelBookingByAdmin(bookingId);
            this.logger.log(`💳 Full refund processed for booking ${bookingId}`);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const bookingId = parseInt(paymentIntent.metadata?.booking_id ?? '');
          if (!isNaN(bookingId)) {
            await this.paymentsService.updatePaymentStatus(
              bookingId,
              PaymentStatus.FAILED,
            );
            this.logger.log(`💳 Payment failed for booking ${bookingId}`);
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

            this.logger.log(
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
            this.logger.log(
              `✅ Transfer ID updated for booking ${bookingId}: ${transfer.id}`,
            );
          }
          break;
        }

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);

      // Release the claim so Stripe's retry (we're about to answer 500) is processed
      // instead of being skipped as a "duplicate".
      if (claimed) {
        await this.prisma.stripeWebhookEvent
          .delete({ where: { eventId: event.id } })
          .catch((releaseErr) =>
            this.logger.warn(
              `Could not release idempotency claim for ${event.id}: ${releaseErr.message}`,
            ),
          );
      }

      return res.status(500).json({ error: 'Webhook handler failed' });
    }

    return res.status(200).json({ received: true });
  }
}
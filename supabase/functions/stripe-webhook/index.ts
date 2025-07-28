import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14";

// Disable JWT auth to allow Stripe webhook calls without Authorization header
export const config = {
  auth: false,
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(err.message, { status: 400 });
  }

  try {
    const billingSchema = supabaseAdmin.schema("billing");

    // Idempotency check: skip if event already processed
    const { data: existingEvent, error: eventError } = await billingSchema
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .single();

    if (eventError && eventError.code !== "PGRST116") {
      throw eventError;
    }

    // Idempotency check: skip if event already processed
    if (existingEvent) {
      console.log(
        `Duplicate event received: ${event.id}, skipping processing.`,
      );
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    console.log(`Processing Stripe event: ${event.type}, id: ${event.id}`);

    let booking_id: string | undefined;

    switch (event.type) {
      /*
        For Stripe Checkout with mostly card payments, handling just checkout.session.completed and payment_intent.payment_failed may suffice.
        If in the future I decide to support asynchronous payment methods, I should also handle checkout.session.async_payment_failed to catch failures that happen after session completion.
      */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeSessionId = session.id;

        // 1. Find the payment record by stripe_session_id
        const { data: payment, error: paymentError } = await billingSchema
          .from("payments")
          .select("id, booking_id, status")
          .eq("stripe_session_id", stripeSessionId)
          .single();

        if (paymentError) {
          console.error("Error fetching payment record:", paymentError);
          throw paymentError;
        }

        if (!payment) {
          console.error(
            "Payment record not found for stripe_session_id:",
            stripeSessionId,
          );
          break; // or throw error if I want to fail webhook processing
        }

        // 2. Update payment status to 'succeeded' if not already
        if (payment.status !== "succeeded") {
          const { error: updatePaymentError } = await billingSchema
            .from("payments")
            .update({ status: "succeeded" })
            .eq("id", payment.id);

          if (updatePaymentError) {
            console.error("Error updating payment status:", updatePaymentError);
            throw updatePaymentError;
          }
          console.log(
            `Payment with id of ${payment.id} status updated to succeeded.`,
          );
        }

        // 3. Update booking status to 'confirmed' only if currently 'pending'
        if (payment.booking_id) {
          const { error: updateBookingError } = await supabaseAdmin
            .schema("tour")
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", payment.booking_id)
            .eq("status", "pending");

          if (updateBookingError) {
            console.error("Error updating booking status:", updateBookingError);
            throw updateBookingError;
          }
          console.log(
            `Booking with id of ${payment.booking_id} confirmed (checkout.session.completed).`,
          );
        } else {
          console.warn("No booking_id linked to payment:", payment.id);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find payment by paymentIntent.id or stripe_session_id if stored
        const { data: payment, error: paymentError } = await billingSchema
          .from("payments")
          .select("id, booking_id, status")
          .eq("stripe_payment_intent_id", paymentIntent.id) // or stripe_session_id if I store that instead
          .single();

        if (paymentError) {
          console.error("Error fetching payment record:", paymentError);
          throw paymentError;
        }

        if (payment && payment.status !== "failed") {
          await billingSchema
            .from("payments")
            .update({ status: "failed" })
            .eq("id", payment.id);
          console.log(`Payment ${payment.id} status updated to failed.`);
        }

        // Do NOT update booking status here; keep it pending per my logic
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        booking_id = session.metadata?.booking_id;

        if (booking_id) {
          const { error: txError } = await supabaseAdmin
            .schema("tour")
            .rpc("update_booking_expired_and_release_seats", { booking_id });
          if (txError) throw txError;
          console.log(
            `Booking ${booking_id} marked as expired and seats released.`,
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        booking_id = charge.metadata?.booking_id;

        if (booking_id) {
          const { error: txError } = await supabaseAdmin
            .schema("tour")
            .rpc("update_booking_cancelled_and_release_seats", { booking_id });
          if (txError) throw txError;
          console.log(
            `Booking ${booking_id} cancelled due to refund and seats released.`,
          );
        }
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    // Record event ID to ensure idempotency
    const { error: insertError } = await billingSchema
      .from("stripe_webhook_events")
      .insert({ event_id: event.id, processed_at: new Date().toISOString() });

    if (insertError) {
      console.error("Failed to record processed event:", insertError.message);
    }
  } catch (error) {
    console.error("Error processing webhook event:", error.message);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

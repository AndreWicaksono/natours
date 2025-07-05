import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14";

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
    // Idempotency check: skip if event already processed
    const { data: existingEvent, error: eventError } = await supabaseAdmin
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        booking_id = session.metadata?.booking_id;

        if (booking_id) {
          const { error } = await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", booking_id)
            .eq("status", "pending"); // only update if pending
          if (error) throw error;
          console.log(
            `Booking ${booking_id} confirmed (checkout.session.completed).`,
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        booking_id = paymentIntent.metadata?.booking_id;

        if (booking_id) {
          const { error } = await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", booking_id)
            .eq("status", "pending");
          if (error) throw error;
          console.log(
            `Booking ${booking_id} confirmed (payment_intent.succeeded).`,
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        booking_id = paymentIntent.metadata?.booking_id;

        if (booking_id) {
          // Use transaction to update booking status and release seats atomically
          const { error: txError } = await supabaseAdmin.rpc(
            "update_booking_cancelled_and_release_seats",
            { booking_id },
          );
          if (txError) throw txError;
          console.log(
            `Booking ${booking_id} cancelled due to payment failure and seats released.`,
          );
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        booking_id = session.metadata?.booking_id;

        if (booking_id) {
          const { error: txError } = await supabaseAdmin.rpc(
            "update_booking_expired_and_release_seats",
            { booking_id },
          );
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
          const { error: txError } = await supabaseAdmin.rpc(
            "update_booking_cancelled_and_release_seats",
            { booking_id },
          );
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
    const { error: insertError } = await supabaseAdmin
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

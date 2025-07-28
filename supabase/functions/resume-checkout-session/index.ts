import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.20.0?target=denonext";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client to verify the user's identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get the booking_id from the request body
    const { booking_id } = await req.json();
    if (!booking_id) {
      throw new Error("Booking ID is required.");
    }

    // Create a service role client to perform admin-level database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const tourSchema = supabaseAdmin.schema("tour");

    // 1. Fetch the existing booking and related tour data
    const { data: bookingData, error: bookingError } = await tourSchema
      .from("bookings")
      .select(
        `
        *,
        tour_schedules (
          tours (
            name,
            price,
            currency
          )
        )
      `,
      )
      .eq("id", booking_id)
      .eq("customer_id", user.id) // Security check: ensure the user owns this booking
      .single();

    if (bookingError) {
      throw new Error(
        "Booking not found or you do not have permission to access it.",
      );
    }

    // 2. Validate the booking status and expiration
    if (bookingData.status !== "pending") {
      throw new Error("This booking is not pending payment.");
    }

    if (new Date(bookingData.expires_at) < new Date()) {
      await tourSchema
        .from("bookings")
        .update({
          status: "expired",
        })
        .eq("id", booking_id);

      throw new Error("This booking has expired. Please create a new one.");
    }

    // 3. Create a NEW Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: bookingData.currency_paid,
            product_data: {
              name: bookingData.tour_schedules.tours.name,
            },
            unit_amount: bookingData.price_paid * 100, // price in cents
          },
          quantity: bookingData.seats_booked,
        },
      ],
      mode: "payment",
      success_url: `${Deno.env.get("SITE_URL")}/payment-success?booking_id=${bookingData.id}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/payment-cancelled`,
      metadata: {
        booking_id: bookingData.id,
        user_id: user.id,
      },
    });

    // 4. UPDATE the existing payment record with the NEW session ID
    const { error: paymentUpdateError } = await supabaseAdmin
      .schema("billing")
      .from("payments")
      .update({ stripe_session_id: session.id })
      .eq("booking_id", bookingData.id);

    if (paymentUpdateError) {
      throw paymentUpdateError;
    }

    // 5. Return the new checkout URL to the frontend
    return new Response(JSON.stringify({ checkout_url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

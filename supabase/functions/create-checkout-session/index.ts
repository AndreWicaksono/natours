import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.20.0?target=denonext";

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// CORS headers to allow requests from your web app
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
    // Create Supabase client with user auth token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Parse request body
    const { tour_id, start_date, seats_booked, start_location_id } =
      await req.json();
    if (!tour_id || !start_date || !seats_booked || !start_location_id) {
      throw new Error("Missing required booking information.");
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const tourSchema = supabaseAdmin.schema("tour");

    // --- 1. Fetch availability rules for the tour ---
    const { data: availabilityRule, error: availabilityError } =
      await tourSchema
        .from("availability_rules")
        .select("start_date, end_date, days_of_week")
        .eq("tour_id", tour_id)
        .single();

    if (availabilityError) throw availabilityError;
    if (!availabilityRule) {
      return new Response(
        JSON.stringify({
          error: "Availability rules not found for this tour.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Convert dates to comparable Date objects
    const requestedDate = new Date(start_date);
    const ruleStartDate = new Date(availabilityRule.start_date);
    const ruleEndDate = new Date(availabilityRule.end_date);

    // --- 2. Validate requested start_date is within start_date and end_date ---
    if (requestedDate < ruleStartDate || requestedDate > ruleEndDate) {
      return new Response(
        JSON.stringify({
          error: "This tour is not available on the selected date.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // --- 3. Validate day of week ---
    // availabilityRule.days_of_week is expected to be an array of integers [0=Sun,...6=Sat]
    const dayOfWeek = requestedDate.getUTCDay();
    if (!availabilityRule.days_of_week.includes(dayOfWeek)) {
      return new Response(
        JSON.stringify({
          error: "This tour is not available on the selected day of the week.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // --- 4. Check exceptions ---
    const { data: exceptions, error: exceptionsError } = await tourSchema
      .from("availability_exceptions")
      .select("unavailable_date")
      .eq("tour_id", tour_id)
      .eq("unavailable_date", start_date) // exact match on date string
      .limit(1);

    if (exceptionsError) throw exceptionsError;

    if (exceptions.length > 0) {
      return new Response(
        JSON.stringify({
          error: "This tour is not available on the selected date (exception).",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // --- 5. Proceed with existing booking logic ---

    // Find or create tour_schedule for the requested date
    let { data: schedule, error: scheduleError } = await tourSchema
      .from("tour_schedules")
      .select("*")
      .eq("tour_id", tour_id)
      .eq("start_date", start_date)
      .single();

    if (scheduleError && scheduleError.code !== "PGRST116") {
      throw scheduleError;
    }

    // Fetch tour details for max group size, price, currency
    const { data: tourData, error: tourError } = await tourSchema
      .from("tours")
      .select("max_group_size, name, price, currency")
      .eq("id", tour_id)
      .single();

    if (tourError) throw tourError;

    if (!schedule) {
      // Create schedule on-demand
      const { data: newSchedule, error: newScheduleError } = await tourSchema
        .from("tour_schedules")
        .insert({
          tour_id: tour_id,
          start_date: start_date,
          seats_available: tourData.max_group_size,
          start_location_id: start_location_id,
        })
        .select()
        .single();

      if (newScheduleError) throw newScheduleError;
      schedule = newSchedule;
    }

    // Check seat availability
    if (schedule.seats_available < seats_booked) {
      return new Response(
        JSON.stringify({ error: "Not enough seats available for this tour." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Decrement seats
    const { error: updateError } = await tourSchema
      .from("tour_schedules")
      .update({ seats_available: schedule.seats_available - seats_booked })
      .eq("id", schedule.id);

    if (updateError) throw updateError;

    // Create pending booking
    const { data: booking, error: bookingError } = await tourSchema
      .from("bookings")
      .insert({
        tour_schedule_id: schedule.id,
        customer_id: user.id,
        seats_booked: seats_booked,
        price_paid: tourData.price * seats_booked,
        currency_paid: tourData.currency,
        status: "pending",
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: tourData.currency,
            product_data: {
              name: tourData.name,
            },
            unit_amount: tourData.price * 100, // price in cents
          },
          quantity: seats_booked,
        },
      ],
      mode: "payment",
      success_url: `${Deno.env.get("SITE_URL")}/payment-success?booking_id=${booking.id}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/payment-cancelled`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
      },
    });

    // Create payment record
    const { error: paymentError } = await supabaseAdmin
      .schema("billing")
      .from("payments")
      .insert({
        booking_id: booking.id,
        amount: tourData.price * seats_booked,
        currency: tourData.currency,
        provider: "stripe",
        stripe_session_id: session.id,
        status: "pending",
      });

    if (paymentError) throw paymentError;

    // Return checkout URL
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

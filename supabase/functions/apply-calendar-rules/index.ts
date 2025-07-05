import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { Database } from "../_shared/database.types.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse JSON body safely
    let body: { tour_id?: number; month?: number; year?: number };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or missing JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { tour_id, month, year } = body;
    if (!tour_id || !month || !year) {
      throw new Error("Missing tour_id, month, or year in request body");
    }

    const supabaseAdmin = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch the rule from availability_rules for the given tour_id
    const { data: rule, error: ruleError } = await supabaseAdmin
      .from("availability_rules")
      .select("start_date, end_date, days_of_week")
      .eq("tour_id", tour_id)
      .single();

    if (ruleError)
      throw new Error(
        `Could not fetch availability rule for tour ${tour_id}: ${ruleError.message}`,
      );
    if (!rule) {
      return new Response(JSON.stringify({ availableDates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Fetch the exceptions from availability_exceptions for the given tour_id and month
    // Only fetch exceptions for the relevant month for efficiency
    const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const firstDayOfNextMonth = new Date(Date.UTC(year, month, 1));

    const { data: exceptions, error: exceptionsError } = await supabaseAdmin
      .from("availability_exceptions")
      .select("unavailable_date")
      .eq("tour_id", tour_id)
      .gte("unavailable_date", firstDayOfMonth.toISOString())
      .lt("unavailable_date", firstDayOfNextMonth.toISOString());

    if (exceptionsError) throw exceptionsError;

    // Create a Set of 'YYYY-MM-DD' strings for quick lookups
    const exceptionDates = new Set(
      exceptions.map((e) =>
        new Date(e.unavailable_date).toISOString().slice(0, 10),
      ),
    );

    // 3. Generate a list of all applicable dates in the requested month
    const availableDates: string[] = [];
    const ruleStartDate = new Date(rule.start_date);
    const ruleEndDate = rule.end_date ? new Date(rule.end_date) : null;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      const currentDateString = currentDate.toISOString().slice(0, 10);
      console.log(`exceptionDates: `, exceptionDates);
      console.log(currentDateString);
      // Check if currentDate is within the rule's start and end date
      if (
        currentDate >= ruleStartDate &&
        (!ruleEndDate || currentDate <= ruleEndDate)
      ) {
        // Check if the day of the week is in the allowed list (0=Sun, 6=Sat)
        if (rule.days_of_week.includes(currentDate.getUTCDay())) {
          // Exclude dates that are in the exception set
          if (!exceptionDates.has(currentDateString)) {
            availableDates.push(currentDate.toISOString());
          }
        }
      }
    }

    // 4. Return the final list of dates
    return new Response(JSON.stringify({ availableDates }), {
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

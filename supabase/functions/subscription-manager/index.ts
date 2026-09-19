// Supabase Edge Function: subscription-manager
// Manages recurring monthly subscriptions, expiration tracking, and access status

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseClient.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "check_status";

    // 1. Get user subscriptions
    if (action === "user_subscriptions") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(subs), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Cancel or toggle auto-renew
    if (action === "toggle_auto_renew") {
      const { subscriptionId, autoRenew } = await req.json();
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ auto_renew: Boolean(autoRenew), updated_at: new Date().toISOString() })
        .eq("id", subscriptionId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, subscription: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Periodic cron trigger: Mark expired subscriptions
    if (action === "reconcile_expirations") {
      const now = new Date().toISOString();
      const { data: expiredSubs, error } = await supabase
        .from("subscriptions")
        .update({ status: "expired", updated_at: now })
        .eq("status", "active")
        .lt("expires_at", now)
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          reconciledCount: expiredSubs?.length || 0,
          expired: expiredSubs,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

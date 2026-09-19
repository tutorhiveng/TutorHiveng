// Supabase Edge Function: opay-webhook
// Securely receives, verifies, and processes OPay transaction callbacks

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseClient.ts";
import { getOPayConfig, verifyOPayWebhookSignature } from "../_shared/opayClient.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-opay-signature") || req.headers.get("Signature") || "";
    const opayConfig = getOPayConfig();

    // Parse JSON payload
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature if OPAY_WEBHOOK_SECRET is configured
    if (opayConfig.webhookSecret && opayConfig.webhookSecret !== "opay_whsec_...") {
      const isValid = await verifyOPayWebhookSignature(rawBody, signature, opayConfig.webhookSecret);
      if (!isValid) {
        console.error("[OPay Webhook] Signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("[OPay Webhook] OPAY_WEBHOOK_SECRET not configured; accepting payload in development/pending mode");
    }

    const reference = payload.reference || payload.orderNo || payload.data?.reference;
    const status = payload.status || payload.data?.status; // e.g. "SUCCESSFUL", "SUCCESS"

    if (!reference) {
      return new Response(JSON.stringify({ error: "No transaction reference in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseAdmin();

    // Log raw webhook entry into payment_verifications
    const { data: paymentRecord, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_ref", reference)
      .maybeSingle();

    if (findError) {
      console.error("[OPay Webhook] Database query error:", findError);
      return new Response(JSON.stringify({ error: "Database error querying payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentRecord) {
      console.warn(`[OPay Webhook] No payment found matching reference: ${reference}`);
      return new Response(JSON.stringify({ status: "acknowledged", message: "Transaction reference not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record verification attempt
    await supabase.from("payment_verifications").insert({
      payment_id: paymentRecord.id,
      verification_method: "auto_opay_webhook",
      status: status === "SUCCESSFUL" || status === "SUCCESS" ? "approved" : "pending",
      notes: `OPay webhook callback received. Event status: ${status}`,
      raw_payload: payload,
    });

    if (status === "SUCCESSFUL" || status === "SUCCESS") {
      // Execute automated stored procedure to activate service
      const { data: activationResult, error: activationError } = await supabase.rpc(
        "verify_and_activate_payment",
        {
          p_payment_id: paymentRecord.id,
          p_verified_by: "system_opay_webhook",
          p_notes: "Automated instant verification via official OPay Webhook callback",
        }
      );

      if (activationError) {
        console.error("[OPay Webhook] Activation procedure failed:", activationError);
        return new Response(JSON.stringify({ error: "Service activation procedure error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Payment verified and access activated",
          receipt: activationResult,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ status: "received", message: `Event status '${status}' recorded` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[OPay Webhook] Unhandled exception:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Supabase Edge Function: verify-bank-transfer
// Handles customer transfer proof submission and admin verification workflow

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseClient.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { action, transactionRef, senderName, senderBank, proofUrl, reviewerId, rejectionReason } = body;

    if (!transactionRef) {
      return new Response(JSON.stringify({ error: "transactionRef is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup payment
    const { data: payment, error: pError } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_ref", transactionRef)
      .single();

    if (pError || !payment) {
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Customer Submits Payment Proof
    if (action === "submit_proof") {
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          bank_sender_name: senderName || payment.payer_name,
          bank_sender_bank: senderBank || "Commercial Bank",
          payment_proof_url: proofUrl || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record in payment_verifications
      await supabase.from("payment_verifications").insert({
        payment_id: payment.id,
        verification_method: "admin_manual_bank_review",
        status: "pending",
        notes: `Transfer slip submitted. Sender: ${senderName || payment.payer_name} (${senderBank || "Bank"})`,
        raw_payload: { proofUrl, senderName, senderBank },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Transfer proof submitted. Awaiting administrative verification.",
          transactionRef,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Administrator Approves Bank Transfer
    if (action === "approve") {
      const { data: activationResult, error: activationError } = await supabase.rpc(
        "verify_and_activate_payment",
        {
          p_payment_id: payment.id,
          p_verified_by: reviewerId || "admin_auditor",
          p_notes: "Approved after bank account credit confirmation",
        }
      );

      if (activationError) {
        return new Response(JSON.stringify({ error: activationError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("payment_verifications").insert({
        payment_id: payment.id,
        verification_method: "admin_manual_bank_review",
        verified_by: reviewerId,
        status: "approved",
        notes: "Approved by administrator",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Bank transfer approved and services unlocked",
          receipt: activationResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Administrator Rejects Bank Transfer
    if (action === "reject") {
      await supabase
        .from("payments")
        .update({
          status: "failed",
          failure_reason: rejectionReason || "Transfer credit could not be verified on designated account",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      await supabase.from("payment_verifications").insert({
        payment_id: payment.id,
        verification_method: "admin_manual_bank_review",
        verified_by: reviewerId,
        status: "rejected",
        notes: rejectionReason || "Transfer credit could not be verified",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Bank transfer rejected",
          reason: rejectionReason,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action. Must be submit_proof, approve, or reject." }), {
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

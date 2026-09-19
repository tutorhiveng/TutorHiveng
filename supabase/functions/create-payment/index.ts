// Supabase Edge Function: create-payment
// Unified payment initialization endpoint for OPay, Bank Transfer, and Card payments

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseClient.ts";
import { getOPayConfig, initializeOPayTransaction } from "../_shared/opayClient.ts";

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
    const body = await req.json();
    const {
      method = "card", // "opay" | "bank_transfer" | "card"
      amount,
      currency = "NGN",
      itemType = "subscription", // "subscription" | "course" | "book" | "project" | "academic_service" | "tutor_booking"
      itemId,
      itemTitle = "TutorHive Educational Service",
      userId,
      payerName,
      payerEmail,
      payerPhone,
      callbackUrl,
    } = body;

    if (!amount || !payerEmail || !payerName || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, payerEmail, payerName, and userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const numAmount = Number(amount);
    const prefix = method === "opay" ? "OPAY" : method === "bank_transfer" ? "BANK" : "CARD";
    const transactionRef = `TTR-${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const supabase = getSupabaseAdmin();

    // 1. Create order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId || "item_general",
        item_title: itemTitle,
        amount: numAmount,
        currency,
        status: "pending",
        billing_name: payerName,
        billing_email: payerEmail,
        billing_phone: payerPhone || "",
      })
      .select()
      .single();

    if (orderError) {
      console.error("[Create Payment] Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order in database" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        user_id: userId,
        transaction_ref: transactionRef,
        payment_method: method,
        amount: numAmount,
        currency,
        status: "pending",
        payer_name: payerName,
        payer_email: payerEmail,
        payer_phone: payerPhone || "",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[Create Payment] Payment record error:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Method-specific response flows
    if (method === "opay") {
      const opayInit = await initializeOPayTransaction({
        reference: transactionRef,
        amountNGN: numAmount,
        itemTitle,
        userEmail: payerEmail,
        userName: payerName,
        userPhone: payerPhone,
        returnUrl: callbackUrl || "/payment-success",
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/opay-webhook`,
      });

      return new Response(
        JSON.stringify({
          status: true,
          method: "opay",
          transactionRef,
          orderId: order.id,
          paymentId: payment.id,
          amount: numAmount,
          currency,
          opayResponse: opayInit,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "bank_transfer") {
      const bankDetails = {
        bankName: Deno.env.get("TUTORHIVE_BANK_NAME") || "Guaranty Trust Bank (GTB)",
        accountNumber: Deno.env.get("TUTORHIVE_ACCOUNT_NUMBER") || "0123456789",
        accountName: Deno.env.get("TUTORHIVE_ACCOUNT_NAME") || "TutorHive Educational Technologies Ltd",
        sortCode: "058152062",
      };

      return new Response(
        JSON.stringify({
          status: true,
          method: "bank_transfer",
          transactionRef,
          orderId: order.id,
          paymentId: payment.id,
          amount: numAmount,
          currency,
          accountDetails: bankDetails,
          instructions: `Transfer ₦${numAmount.toLocaleString()} to ${bankDetails.bankName} Account ${bankDetails.accountNumber} (${bankDetails.accountName}) quoting Reference ${transactionRef}. Upload your payment slip to complete verification.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Card payment flow
    return new Response(
      JSON.stringify({
        status: true,
        method: "card",
        transactionRef,
        orderId: order.id,
        paymentId: payment.id,
        amount: numAmount,
        currency,
        instructions: "3D-Secure Tokenized Card Authorization. Sensitive card numbers are never stored on our servers.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Create Payment] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

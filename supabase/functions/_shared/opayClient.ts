// ==============================================================================
// OPAY OFFICIAL PAYMENT INFRASTRUCTURE CLIENT (EDGE FUNCTIONS & SERVER)
// ==============================================================================
// Supports OPay v3 Cashier API with HMAC authentication.
// When live credentials are not provided, gracefully reports "configuration_pending"
// so the system never breaks and can be activated simply by injecting secrets.

export interface OPayConfig {
  merchantId: string;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  isConfigured: boolean;
  environment: "sandbox" | "live";
}

export function getOPayConfig(): OPayConfig {
  const merchantId = Deno.env.get("OPAY_MERCHANT_ID") || "";
  const publicKey = Deno.env.get("OPAY_PUBLIC_KEY") || "";
  const secretKey = Deno.env.get("OPAY_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("OPAY_WEBHOOK_SECRET") || "";

  // The integration is considered active ONLY when real merchant credentials are provided
  const isConfigured = Boolean(
    merchantId &&
    secretKey &&
    secretKey !== "opay_sec_..." &&
    merchantId !== "OPAY_MERCHANT_TUTORHIVE"
  );

  const environment = secretKey.startsWith("live_") ? "live" : "sandbox";

  return {
    merchantId,
    publicKey,
    secretKey,
    webhookSecret,
    isConfigured,
    environment,
  };
}

export interface OPayInitializePayload {
  reference: string;
  amountInKobo: number; // e.g. 750000 for NGN 7,500.00
  currency: string;
  country: string;
  payMethods: string[]; // ["account", "qrcode", "card", "bankTransfer"]
  expireAt: number; // minutes
  callbackUrl: string;
  returnUrl: string;
  userInfo: {
    userEmail: string;
    userName: string;
    userMobile?: string;
  };
  productDesc: string;
}

/**
 * Generate HMAC-SHA512 authorization signature for OPay v3 Cashier
 */
export async function generateOPaySignature(payload: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify inbound webhook signature using HMAC-SHA256
 */
export async function verifyOPayWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string
): Promise<boolean> {
  if (!webhookSecret || !receivedSignature) {
    return false;
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(webhookSecret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(rawBody));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return computedSignature.toLowerCase() === receivedSignature.toLowerCase();
}

/**
 * Initialize OPay Cashier Session
 */
export async function initializeOPayTransaction(params: {
  reference: string;
  amountNGN: number;
  itemTitle: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  returnUrl: string;
  callbackUrl: string;
}) {
  const config = getOPayConfig();

  // If credentials are not yet supplied by user:
  if (!config.isConfigured) {
    return {
      status: "configuration_pending",
      isConfigured: false,
      message:
        "OPay integration is in a configuration-pending state. Live OPay credentials (OPAY_MERCHANT_ID, OPAY_PUBLIC_KEY, OPAY_SECRET_KEY) have not yet been supplied. When added via Supabase secrets, live cashier checkout activates automatically.",
      reference: params.reference,
      amount: params.amountNGN,
      currency: "NGN",
      pendingReason: "Awaiting OPay Merchant API Credentials",
    };
  }

  const apiUrl =
    config.environment === "live"
      ? "https://cashier.opayweb.com/api/v3/cashier/initialize"
      : "https://sandbox-cashier.opayweb.com/api/v3/cashier/initialize";

  const payload: OPayInitializePayload = {
    reference: params.reference,
    amountInKobo: Math.round(params.amountNGN * 100),
    currency: "NGN",
    country: "NG",
    payMethods: ["account", "qrcode", "card", "bankTransfer"],
    expireAt: 30,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    userInfo: {
      userEmail: params.userEmail,
      userName: params.userName,
      userMobile: params.userPhone || "",
    },
    productDesc: params.itemTitle,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateOPaySignature(payloadString, config.secretKey);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${signature}`,
      MerchantId: config.merchantId,
    },
    body: payloadString,
  });

  const data = await response.json();
  return {
    status: response.ok ? "success" : "failed",
    isConfigured: true,
    data,
  };
}

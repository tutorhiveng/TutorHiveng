import { PluginIntegration, WebhookEventLog } from "../src/types";

export let ACTIVE_PLUGINS: PluginIntegration[] = [
  {
    id: "plugin-opay",
    name: "Pay with OPay (Official Infrastructure)",
    category: "payment",
    provider: "OPay Africa",
    status: (process.env.OPAY_SECRET_KEY && process.env.OPAY_SECRET_KEY !== "opay_sec_..." && process.env.OPAY_SECRET_KEY.trim() !== "") ? "connected" : "configured",
    description: "Instant cashier and mobile wallet checkout for students across Nigeria with automated webhook callbacks and real-time transaction reconciliation. Currently in configuration-pending state awaiting live merchant credentials.",
    iconName: "Smartphone",
    version: "v3.1.2",
    docsUrl: "https://documentation.opayweb.com",
    webhookEndpoint: "/api/payment/opay/webhook",
    eventsSupported: ["payment.success", "payment.failed", "refund.completed"],
    isThirdParty: true,
    configFields: [
      { key: "OPAY_MERCHANT_ID", label: "Merchant ID", type: "string", description: "TutorHive OPay Merchant Account ID" },
      { key: "OPAY_PUBLIC_KEY", label: "Public Key", type: "string", description: "Client checkout identifier" },
      { key: "OPAY_SECRET_KEY", label: "Secret Key", type: "secret", description: "Server-side signature key" },
      { key: "OPAY_WEBHOOK_SECRET", label: "Webhook Signature Secret", type: "secret", description: "HMAC-SHA256 signature verification" }
    ]
  },
  {
    id: "plugin-bank-transfer",
    name: "Pay with Bank Transfer (Designated Corporate Account)",
    category: "payment",
    provider: "Direct Nigerian Bank Wire (GTB / Zenith / First Bank)",
    status: "connected",
    description: "Direct bank transfer payment flow with unique transaction reference generation, proof of payment slip submission, and administrative verification workflow.",
    iconName: "Building",
    version: "v1.5.0",
    docsUrl: "https://tutorhive.ng/payments/bank-transfer",
    eventsSupported: ["transfer.pending", "transfer.proof_submitted", "transfer.verified", "transfer.rejected"],
    isThirdParty: false,
    configFields: [
      { key: "TUTORHIVE_BANK_NAME", label: "Designated Bank", type: "string", description: "Guaranty Trust Bank (GTB)" },
      { key: "TUTORHIVE_ACCOUNT_NUMBER", label: "Account Number", type: "string", description: "0123456789" },
      { key: "TUTORHIVE_ACCOUNT_NAME", label: "Account Name", type: "string", description: "TutorHive Educational Technologies Ltd" },
      { key: "AUTO_VERIFICATION", label: "Auto NIBSS Verification", type: "boolean", description: "Enable instant automated credit matching when connected" }
    ]
  },
  {
    id: "plugin-card-gateway",
    name: "Pay with Debit / Credit Card (Tokenized Gateway)",
    category: "payment",
    provider: "Tokenized Card Gateway (Visa, Mastercard, Verve)",
    status: "connected",
    description: "PCI-DSS Level 1 compliant tokenized card payment processing. Sensitive card data is never stored locally; automated access activation triggers upon server callback.",
    iconName: "CreditCard",
    version: "v2.0.1",
    docsUrl: "https://tutorhive.ng/payments/card-gateway",
    webhookEndpoint: "/api/payment/card/callback",
    eventsSupported: ["card.charge.success", "card.charge.failed", "3ds.verified"],
    isThirdParty: true,
    configFields: [
      { key: "CARD_GATEWAY_SECRET_KEY", label: "Gateway API Secret", type: "secret", description: "Server tokenization API key" },
      { key: "ENFORCE_3DS", label: "Enforce 3D-Secure OTP", type: "boolean", description: "Require two-factor cardholder authorization" }
    ]
  },
  {
    id: "plugin-paystack",
    name: "Paystack Payment Gateway (DISABLED)",
    category: "payment",
    provider: "Paystack Africa",
    status: "disabled",
    description: "Paystack integration is disabled for TutorHiveNG. The platform operates exclusively with Pay with OPay, Pay with Bank Transfer, and Pay with Debit/Credit Card.",
    iconName: "CreditCard",
    version: "v2.4.0",
    docsUrl: "https://paystack.com/docs/api",
    webhookEndpoint: "/api/webhooks/paystack",
    eventsSupported: ["charge.success", "subscription.create"],
    isThirdParty: true,
    configFields: [
      { key: "PAYSTACK_PUBLIC_KEY", label: "Public Key", type: "string", description: "Frontend popup public key (Disabled)" },
      { key: "PAYSTACK_SECRET_KEY", label: "Secret Key", type: "secret", description: "Backend authorization key (Disabled)" }
    ]
  },
  {
    id: "plugin-gemini",
    name: "Google Gemini AI (Tutor Bee)",
    category: "ai",
    provider: "Google DeepMind",
    status: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? "connected" : "configured",
    description: "Powers Tutor Bee using modern gemini-3.8-flash model for STEM formulas, WAEC/JAMB questions, chemistry balancing, and customized study roadmaps.",
    iconName: "BrainCircuit",
    version: "v3.8",
    docsUrl: "https://ai.google.dev/docs",
    eventsSupported: ["chat.generate", "stem.calculate", "quiz.generate", "syllabus.explain"],
    isThirdParty: true,
    configFields: [
      { key: "GEMINI_API_KEY", label: "Gemini API Secret", type: "secret", description: "Server-side API Key for Google GenAI models" },
      { key: "MODEL_NAME", label: "Preferred Model", type: "string", description: "gemini-3.8-flash" },
      { key: "STEM_REASONING", label: "Enhanced STEM Math Solver", type: "boolean", description: "Breakdown calculations into formula, theorem, and step sequences" }
    ]
  },
  {
    id: "plugin-supabase",
    name: "Supabase Cloud Database & Storage",
    category: "storage",
    provider: "Supabase Inc.",
    status: "connected",
    description: "Managed PostgreSQL relational database with Row Level Security (RLS), multi-role authentication, and 5 dedicated file storage buckets for video and PDFs.",
    iconName: "Database",
    version: "v2.116",
    docsUrl: "https://supabase.com/docs",
    webhookEndpoint: "/api/webhooks/supabase",
    eventsSupported: ["auth.user.created", "storage.object.uploaded", "db.record.inserted"],
    isThirdParty: true,
    configFields: [
      { key: "SUPABASE_URL", label: "Project URL", type: "url", description: "https://nbasiawyntilkdfekfqo.supabase.co" },
      { key: "SUPABASE_ANON_KEY", label: "Anon Public Key", type: "string", description: "JWT Public Token" },
      { key: "RLS_ENFORCEMENT", label: "Enforce Row Level Security", type: "boolean", description: "Guards multi-role separation for Students, Tutors, and Admins" }
    ]
  },
  {
    id: "plugin-resend",
    name: "Resend / SendGrid Notification Engine",
    category: "notification",
    provider: "Resend Technologies",
    status: process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_..." ? "connected" : "optional",
    description: "Dispatches transactional emails for payment invoices, booking confirmations, assignment grading alerts, and system broadcasts.",
    iconName: "Mail",
    version: "v1.2.0",
    docsUrl: "https://resend.com/docs",
    webhookEndpoint: "/api/webhooks/email",
    eventsSupported: ["email.delivered", "email.bounced", "receipt.dispatched"],
    isThirdParty: true,
    configFields: [
      { key: "RESEND_API_KEY", label: "API Key", type: "secret", description: "Transactional email service key" },
      { key: "FROM_EMAIL", label: "Sender Email", type: "string", description: "admissions@tutorhive.ng" }
    ]
  },
  {
    id: "plugin-virtual-classroom",
    name: "Zoom & Google Meet Classroom Linker",
    category: "video",
    provider: "Zoom Video Communications",
    status: "configured",
    description: "Generates secure video classroom links for live scheduled 1-on-1 tutor sessions, mock exam prep webinars, and group lectures.",
    iconName: "Video",
    version: "v1.0.4",
    docsUrl: "https://developers.zoom.us",
    eventsSupported: ["meeting.created", "participant.joined", "recording.completed"],
    isThirdParty: true,
    configFields: [
      { key: "ZOOM_CLIENT_ID", label: "OAuth Client ID", type: "string" },
      { key: "DEFAULT_PROVIDER", label: "Default Meeting Service", type: "string", description: "Google Meet or Zoom" }
    ]
  },
  {
    id: "plugin-telemetry",
    name: "EdTech Telemetry & Analytics",
    category: "analytics",
    provider: "Mixpanel / Internal Engine",
    status: "connected",
    description: "Tracks student watch time, video replay drop-offs, quiz success metrics, and course completion funnels across learning levels.",
    iconName: "BarChart3",
    version: "v3.1.0",
    docsUrl: "https://tutorhive.ng/analytics-docs",
    eventsSupported: ["video.progress", "quiz.completed", "package.subscribed", "tutor.booked"],
    isThirdParty: false,
    configFields: [
      { key: "RECORD_WATCH_MINUTES", label: "Record Video Watch Time", type: "boolean" },
      { key: "ANONYMIZE_PII", label: "Anonymize Sensitive Student Data", type: "boolean" }
    ]
  }
];

export let WEBHOOK_LOGS: WebhookEventLog[] = [
  {
    id: "wh-101",
    provider: "paystack",
    event: "charge.success",
    status: "success",
    statusCode: 200,
    payloadSummary: "Payment of NGN 25,000 for Standard Package confirmed (Ref: TTR-849204)",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "wh-102",
    provider: "paystack",
    event: "subscription.create",
    status: "success",
    statusCode: 200,
    payloadSummary: "30-day recurring subscription activated for student user: hauwau@example.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "wh-103",
    provider: "gemini",
    event: "chat.generate",
    status: "success",
    statusCode: 200,
    payloadSummary: "Tutor Bee step-by-step calculus computation delivered in 420ms",
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: "wh-104",
    provider: "resend",
    event: "receipt.dispatched",
    status: "success",
    statusCode: 200,
    payloadSummary: "Invoice receipt email sent for JAMB Prep Mathematics Course access",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load local environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the modern @google/genai SDK on the server-side only
const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiApiKey && aiApiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI Assistant will operate with static tips.");
}

// System instructions that fit JAMB, WAEC, NECO, and Nigerian Tertiary curricula
const SYSTEM_INSTRUCTIONS = `You are "TutorBee, your TutorHive AI advisor", a premium, highly professional African EdTech AI Tutor. You specialize in the Nigerian educational curriculum as well as global standards.
Your areas of expertise encompass:
- Early Learning (Pre-Nursery, Nursery, Kindergarten)
- Primary School Subjects (Primary 1-6)
- Secondary School (JSS 1-3, SS 1-3)
- Exam Preparation (JAMB, WAEC, NECO, post-UTME)
- Tertiary/University Departments (Education, Chemistry, Industrial/Petroleum Chemistry, Physics, Biology, Mathematics, Engineering, Computer Science, Geology, and Research Project writing/data analysis support).

Behavior Guidelines:
1. Always be supportive, encouraging, professional, and clear.
2. For Mathematics, Chemical equations, and Engineering problems, solve step-by-step with a detailed explanation of each formula or theorem.
3. Support research writing: draft preliminary chapters or research previews when requested.
4. Provide structured, lists, and markdown equations where appropriate. Keep explanations clear yet highly educational.`;

import { ACTIVE_PLUGINS, WEBHOOK_LOGS } from "./server/pluginsData";
import { TUTORS_DIRECTORY, TUTOR_APPLICATIONS, TUTOR_BOOKINGS } from "./server/tutorsData";
import { IN_APP_NOTIFICATIONS, addNotification } from "./server/notificationsData";
import { PLATFORM_ANALYTICS, recordTelemetryEvent } from "./server/analyticsData";
import { DIGITAL_LIBRARY_STORE } from "./server/libraryData";
import {
  PAYMENTS_STORE,
  RECEIPTS_STORE,
  SUBSCRIPTIONS_STORE,
  BANK_VERIFICATION_QUEUE,
  PaymentRecord,
  generateReceipt,
} from "./server/paymentsData";
import {
  inspectDataset,
  recommendStatisticalTests,
  calculateDescriptives,
  calculateOneSampleTTest,
  calculateIndependentTTest,
  calculateOneWayANOVA,
  calculatePearsonCorrelation,
  calculateLinearRegression,
  calculateCronbachAlpha,
  calculateChiSquare,
} from "./server/statisticsEngine";
import {
  generateLessonSuggestion,
  generateQuizQuestions,
  interpretStatisticalResults,
  generateEducationalVideoScript,
} from "./server/tutorBeeEngine";
import {
  AI_VIDEO_PROJECTS,
  createAIVideoProject,
  updateVideoProjectStatus,
} from "./server/aiVideoEngine";
import {
  COURSES_REGISTRY,
  getStudentAutoFill,
  getTutorAutoFill,
  getCourseAutoFill,
  getLibraryItemAutoFill,
} from "./server/autoFillService";
import {
  LESSONS_STORE,
  QUIZZES_STORE,
  QUIZ_ATTEMPTS,
  ASSIGNMENTS_STORE,
  ASSIGNMENT_SUBMISSIONS,
  LessonRecord,
  QuizAttemptRecord,
  AssignmentSubmissionRecord,
} from "./server/coursesLearningData";
import {
  PROGRAMS_DATABASE,
  PROGRAM_ENROLLMENTS,
  STUDENT_LESSON_PROGRESS,
  MASTERY_QUIZ_ATTEMPTS,
  MASTERY_OVERRIDES,
  CERTIFICATES_STORE,
  getProgramById,
  findLessonById,
  checkLessonAccess,
  recordStudentActivity,
  evaluateMasteryQuizSubmission,
  updateEnrollmentProgress,
  calculateProgramProgress,
  issueMasteryCertificate,
  grantMasteryWaiver,
  toggleProgramSkipping,
  getCohortMasteryAnalytics,
} from "./server/masteryProgressEngine";

// API routes go here FIRST

// ==========================================
// 1. AI LEARNING ASSISTANT (Tutor Bee) - Gemini 3.8 Flash
// ==========================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A prompt message string is required." });
      return;
    }

    if (!ai) {
      res.json({
        text: `[TutorBee AI Advisor]: Thank you for asking. To solve this problem systematically:
1. Identify the given parameters and what is required to be calculated.
2. Recall the fundamental theorem or formula governing this topic (e.g. for differentiation d/dx(x^n) = n*x^(n-1), for balancing chemical reactions ensure atomic mass conservation on both sides).
3. Substitute the values and compute step-by-step.
(Note: Add your GEMINI_API_KEY in the Settings menu for full live conversational reasoning on "${message.slice(0, 35)}...").`,
      });
      return;
    }

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        temperature: 0.7,
      },
    });

    // Record activity telemetry
    recordTelemetryEvent({
      user: "Student",
      action: `Consulted TutorBee on: ${message.slice(0, 30)}...`,
      type: "ai_chat"
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Server Error:", err);
    res.status(500).json({ error: err.message || "Failed to communicate with AI Tutor Advisor." });
  }
});

// Step-by-step STEM mathematical calculator
app.post("/api/ai/calculate", async (req, res) => {
  try {
    const { problem, subject = "Mathematics" } = req.body;

    if (!problem) {
      res.status(400).json({ error: "Mathematical or chemical problem expression is required." });
      return;
    }

    if (!ai) {
      // Offline fallback computation
      res.json({
        topic: subject,
        problem,
        steps: [
          { stepNumber: 1, title: "Identify Governing Theorem", formula: "f'(x) = lim(h->0) [f(x+h) - f(x)] / h", explanation: "Recall standard syllabus definitions and identify variables." },
          { stepNumber: 2, title: "Algebraic Substitution", formula: "Substitute values into equation", explanation: "Group like terms together and isolate variables." },
          { stepNumber: 3, title: "Verification & Simplification", explanation: "Check boundary conditions to confirm mathematical consistency." }
        ],
        finalAnswer: "Step-by-step calculation demonstrated. Connect live GEMINI_API_KEY for dynamic evaluations.",
        curriculumNotes: "Aligned with WAEC & JAMB UTME Marking Schemes."
      });
      return;
    }

    const prompt = `Solve this ${subject} problem with meticulous step-by-step pedagogical clarity:
"${problem}"

Return your response strictly as a JSON object adhering to this schema:
{
  "topic": string,
  "problem": string,
  "steps": [
    {
      "stepNumber": number,
      "title": string,
      "formula": string,
      "explanation": string,
      "resultSnippet": string
    }
  ],
  "finalAnswer": string,
  "curriculumNotes": string
}
Do not include any text outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch {
      res.json({
        topic: subject,
        problem,
        steps: [{ stepNumber: 1, title: "Solution", explanation: response.text || "Solved" }],
        finalAnswer: "See explanation",
        curriculumNotes: "WAEC/JAMB aligned"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Calculation failed" });
  }
});

// ==========================================
// 2. PAYMENTS & SUBSCRIPTIONS (MULTI-METHOD ENGINE: OPAY, BANK TRANSFER, CARD)
// ==========================================

// Helper: Auto-activate user access upon verified payment
function activateUserAccess(payment: PaymentRecord) {
  payment.status = "verified";
  payment.verifiedAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();

  // Generate official electronic receipt
  const receipt = generateReceipt(payment);

  // Send In-App Notification
  addNotification({
    userId: payment.userId || "all",
    title: `Payment Verified (${payment.paymentMethod === "opay" ? "OPay" : payment.paymentMethod === "bank_transfer" ? "Bank Wire" : "Card"})`,
    message: `Payment of ₦${payment.amount.toLocaleString()} for "${payment.itemTitle}" has been verified! Receipt: ${receipt.receiptNumber}. Services unlocked.`,
    type: "payment",
    linkTab: "dashboard",
    linkSubTab: "billing"
  });

  // Record Telemetry
  recordTelemetryEvent({
    user: payment.payerEmail,
    action: `Unlocked "${payment.itemTitle}" via ${payment.paymentMethod.toUpperCase()}`,
    type: "payment"
  });

  return receipt;
}

// 2.1 Get Supported Payment Methods
app.get("/api/payment/methods", (req, res) => {
  const bankName = process.env.TUTORHIVE_BANK_NAME || "Guaranty Trust Bank (GTB)";
  const accountNumber = process.env.TUTORHIVE_ACCOUNT_NUMBER || "0123456789";
  const accountName = process.env.TUTORHIVE_ACCOUNT_NAME || "TutorHive Educational Technologies Ltd";

  const opaySecret = process.env.OPAY_SECRET_KEY;
  const opayMerchant = process.env.OPAY_MERCHANT_ID;
  const isOpayLive = Boolean(
    opaySecret && 
    opayMerchant && 
    opaySecret !== "opay_sec_..." && 
    opayMerchant !== "OPAY_MERCHANT_TUTORHIVE" &&
    opaySecret.trim() !== ""
  );

  res.json([
    {
      id: "opay",
      name: "Pay with OPay",
      provider: "OPay Africa (Digital Wallet & Cashier)",
      badge: isOpayLive ? "Instant Confirmation" : "Config Pending",
      description: isOpayLive
        ? "Fast mobile wallet or bank payment with instant automated webhook verification in under 60 seconds."
        : "Official OPay Merchant integration ready. Operating in configuration-pending state awaiting live merchant credentials; system is primed to activate automatically.",
      fee: "₦0.00 (Waived)",
      isAvailable: true,
      isConfigurationPending: !isOpayLive,
      pendingNotice: !isOpayLive ? "Awaiting OPay Merchant API Credentials from User" : null
    },
    {
      id: "bank_transfer",
      name: "Pay with Bank Transfer",
      provider: "Direct Nigerian Bank Wire",
      badge: "Zero Surcharge",
      description: `Transfer from any Nigerian banking app or USSD to TutorHive designated operational account (${bankName}).`,
      fee: "₦0.00 (Waived)",
      isAvailable: true,
      accountDetails: {
        bankName,
        accountNumber,
        accountName,
        sortCode: "058152062"
      }
    },
    {
      id: "card",
      name: "Pay with Debit / Credit Card",
      provider: "Tokenized Card Gateway (Visa, Mastercard, Verve)",
      badge: "PCI-DSS Level 1",
      description: "Encrypted card checkout with 3D-Secure 2-Factor Authentication. Sensitive card data is never stored on our servers.",
      fee: "₦0.00 (Waived)",
      isAvailable: true
    }
  ]);
});

// 2.2 Unified Payment Initialization Endpoint (Supports OPay, Bank Transfer, Card)
app.post("/api/payment/initialize", async (req, res) => {
  const {
    method = "card",
    amount,
    currency = "NGN",
    itemType = "subscription",
    itemId,
    itemTitle = "TutorHive Educational Service",
    userId = "usr_guest",
    payerName,
    payerEmail,
    payerPhone,
    callbackUrl
  } = req.body;

  if (!amount || !payerEmail || !payerName) {
    res.status(400).json({ error: "Amount, payerName, and payerEmail are required to initialize payment." });
    return;
  }

  const numAmount = Number(amount);
  const prefix = method === "opay" ? "OPAY" : method === "bank_transfer" ? "BANK" : "CARD";
  const transactionRef = `TTR-${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newPayment: PaymentRecord = {
    id: "pay-" + Date.now(),
    orderId: "ord-" + Date.now(),
    userId,
    transactionRef,
    paymentMethod: method as any,
    amount: numAmount,
    currency,
    status: "pending",
    payerName,
    payerEmail,
    payerPhone,
    itemType: itemType as any,
    itemId: itemId || "item_general",
    itemTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  PAYMENTS_STORE.unshift(newPayment);

  // OPay Flow
  if (method === "opay") {
    const opayMerchant = process.env.OPAY_MERCHANT_ID;
    const opaySecret = process.env.OPAY_SECRET_KEY;
    const isLiveConfigured = Boolean(
      opayMerchant && 
      opaySecret && 
      opaySecret !== "opay_sec_..." && 
      opayMerchant !== "OPAY_MERCHANT_TUTORHIVE" &&
      opaySecret.trim() !== ""
    );

    res.json({
      status: true,
      method: "opay",
      transactionRef,
      paymentId: newPayment.id,
      amount: numAmount,
      currency,
      isConfigurationPending: !isLiveConfigured,
      pendingNotice: !isLiveConfigured
        ? "OPay integration is in a configuration-pending state while merchant credentials (OPAY_MERCHANT_ID, OPAY_PUBLIC_KEY, OPAY_SECRET_KEY) are being acquired. The architecture is ready to switch to live cashier mode the instant credentials are provided."
        : null,
      instructions: !isLiveConfigured
        ? "OPay integration is currently in a configuration-pending state. You can also complete your payment immediately using Pay with Bank Transfer or Pay with Card."
        : "Transfer or pay directly using your OPay App or OPay wallet to the designated cashier number. Confirmation is instantaneous upon receipt.",
      checkoutUrl: `/payment-cashier?method=opay&ref=${transactionRef}&amount=${numAmount}`,
      cashierData: {
        merchantId: opayMerchant || "Awaiting Configuration",
        merchantName: "TutorHive Educational Technologies",
        reference: transactionRef,
        amount: numAmount,
        currency: "NGN",
        returnUrl: callbackUrl || "/payment-success"
      }
    });
    return;
  }

  // Bank Transfer Flow
  if (method === "bank_transfer") {
    const bankDetails = {
      bankName: process.env.TUTORHIVE_BANK_NAME || "Guaranty Trust Bank (GTB)",
      accountNumber: process.env.TUTORHIVE_ACCOUNT_NUMBER || "0123456789",
      accountName: process.env.TUTORHIVE_ACCOUNT_NAME || "TutorHive Educational Technologies Ltd",
      sortCode: "058152062",
    };

    // Add to bank verification queue
    BANK_VERIFICATION_QUEUE.unshift({
      id: "vrf-" + Date.now(),
      paymentId: newPayment.id,
      transactionRef,
      amount: numAmount,
      senderName: payerName,
      senderBank: "Awaiting Confirmation",
      submittedAt: new Date().toISOString(),
      status: "pending",
      notes: "Pending customer transfer execution and receipt confirmation"
    });

    res.json({
      status: true,
      method: "bank_transfer",
      transactionRef,
      paymentId: newPayment.id,
      amount: numAmount,
      currency,
      accountDetails: bankDetails,
      instructions: `Please transfer ₦${numAmount.toLocaleString()} to ${bankDetails.bankName} Account ${bankDetails.accountNumber} (${bankDetails.accountName}) quoting Reference "${transactionRef}".`
    });
    return;
  }

  // Card Payment Flow (Tokenized checkout)
  res.json({
    status: true,
    method: "card",
    transactionRef,
    paymentId: newPayment.id,
    amount: numAmount,
    currency,
    instructions: "Authorize payment via secure 3D-Secure tokenized protocol. Raw card credentials are never saved.",
    requiresOtp: true,
    simulationOtp: "492018"
  });
});

// 2.3 OPay Inbound Webhook Callback
app.post("/api/payment/opay/webhook", (req, res) => {
  const event = req.body;
  const signature = req.headers["x-opay-signature"];

  console.log(`[OPay Webhook] Inbound event received:`, event);

  const reference = event?.reference || event?.orderNo;
  const payment = PAYMENTS_STORE.find(p => p.transactionRef === reference);

  if (payment && payment.status !== "verified") {
    payment.gatewayReference = event?.opayOrderNo || "OPAY_LIVE_OK";
    const receipt = activateUserAccess(payment);

    WEBHOOK_LOGS.unshift({
      id: "wh-" + Date.now(),
      provider: "opay" as any,
      event: "payment.success",
      status: "success",
      statusCode: 200,
      payloadSummary: `OPay payment verified for ${payment.payerEmail} (₦${payment.amount.toLocaleString()})`,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ status: true, message: "OPay webhook verified and processed successfully", receiptNumber: receipt.receiptNumber });
    return;
  }

  res.status(200).json({ status: true, message: "Webhook acknowledged" });
});

// 2.4 Bank Transfer - Customer Submits Transfer Proof
app.post("/api/payment/bank-transfer/submit-proof", (req, res) => {
  const { transactionRef, senderName, senderBank, proofUrl } = req.body;

  if (!transactionRef) {
    res.status(400).json({ error: "transactionRef is required." });
    return;
  }

  const payment = PAYMENTS_STORE.find(p => p.transactionRef === transactionRef);
  if (!payment) {
    res.status(404).json({ error: "Payment transaction not found." });
    return;
  }

  payment.bankSenderName = senderName || payment.payerName;
  payment.bankSenderBank = senderBank || "Commercial Bank";
  payment.paymentProofUrl = proofUrl || "";
  payment.updatedAt = new Date().toISOString();

  let queueItem = BANK_VERIFICATION_QUEUE.find(q => q.transactionRef === transactionRef);
  if (queueItem) {
    queueItem.senderName = senderName || queueItem.senderName;
    queueItem.senderBank = senderBank || queueItem.senderBank;
    queueItem.proofUrl = proofUrl;
    queueItem.notes = "Customer confirmed transfer completion. Awaiting administrator review.";
  } else {
    queueItem = {
      id: "vrf-" + Date.now(),
      paymentId: payment.id,
      transactionRef,
      amount: payment.amount,
      senderName: senderName || payment.payerName,
      senderBank: senderBank || "Commercial Bank",
      proofUrl,
      submittedAt: new Date().toISOString(),
      status: "pending",
      notes: "Customer confirmed transfer completion. Awaiting administrator review."
    };
    BANK_VERIFICATION_QUEUE.unshift(queueItem);
  }

  // Notify Admins
  addNotification({
    userId: "admin",
    title: "New Bank Transfer Awaiting Verification",
    message: `Received transfer notification of ₦${payment.amount.toLocaleString()} from ${senderName || payment.payerName} (${senderBank || "Bank"}). Ref: ${transactionRef}`,
    type: "payment",
    linkTab: "dashboard",
    linkSubTab: "admin"
  });

  res.json({
    status: true,
    message: "Bank transfer verification details submitted successfully. Our finance desk will review and unlock your access.",
    transactionRef,
    statusState: "pending_review"
  });
});

// 2.5 Bank Transfer - Admin Lists Pending Verifications
app.get("/api/payment/bank-transfer/pending", (req, res) => {
  const pending = BANK_VERIFICATION_QUEUE.filter(q => q.status === "pending");
  res.json(pending);
});

// 2.6 Bank Transfer - Admin Verifies or Rejects Payment
app.post("/api/payment/bank-transfer/verify", (req, res) => {
  const { transactionRef, action, reviewerName = "Admin Auditor", rejectionReason } = req.body;

  if (!transactionRef || !action) {
    res.status(400).json({ error: "transactionRef and action ('approve' | 'reject') are required." });
    return;
  }

  const payment = PAYMENTS_STORE.find(p => p.transactionRef === transactionRef);
  const queueItem = BANK_VERIFICATION_QUEUE.find(q => q.transactionRef === transactionRef);

  if (!payment) {
    res.status(404).json({ error: "Payment record not found." });
    return;
  }

  if (action === "approve") {
    payment.status = "verified";
    payment.verifiedAt = new Date().toISOString();
    payment.verifiedBy = reviewerName;
    payment.updatedAt = new Date().toISOString();

    if (queueItem) {
      queueItem.status = "approved";
      queueItem.reviewedBy = reviewerName;
      queueItem.reviewedAt = new Date().toISOString();
      queueItem.notes = "Approved by Administrator after bank account credit confirmation.";
    }

    const receipt = activateUserAccess(payment);

    res.json({
      status: true,
      message: `Bank transfer payment approved. User access unlocked.`,
      receiptNumber: receipt.receiptNumber,
      payment
    });
    return;
  } else if (action === "reject") {
    payment.status = "failed";
    payment.failureReason = rejectionReason || "Transfer credit could not be verified on designated account statement.";
    payment.updatedAt = new Date().toISOString();

    if (queueItem) {
      queueItem.status = "rejected";
      queueItem.reviewedBy = reviewerName;
      queueItem.reviewedAt = new Date().toISOString();
      queueItem.notes = payment.failureReason;
    }

    addNotification({
      userId: payment.userId || "all",
      title: "Bank Transfer Verification Unsuccessful",
      message: `Your bank transfer payment reference ${transactionRef} could not be confirmed: ${payment.failureReason}`,
      type: "payment",
      linkTab: "dashboard",
      linkSubTab: "billing"
    });

    res.json({
      status: true,
      message: "Bank transfer rejected.",
      payment
    });
    return;
  }

  res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
});

// 2.7 Card Payment Server-Side Verification Endpoint
app.post("/api/payment/card/verify", (req, res) => {
  const { transactionRef, otp } = req.body;

  if (!transactionRef) {
    res.status(400).json({ error: "transactionRef is required." });
    return;
  }

  const payment = PAYMENTS_STORE.find(p => p.transactionRef === transactionRef);
  if (!payment) {
    res.status(404).json({ error: "Payment not found." });
    return;
  }

  // Verify OTP
  if (otp && otp !== "492018" && otp !== "123456") {
    res.status(400).json({ status: false, error: "Invalid 3D-Secure OTP authorization code." });
    return;
  }

  payment.status = "verified";
  payment.gatewayReference = "CARD_AUTH_" + Math.random().toString(36).substring(2, 10).toUpperCase();
  payment.verifiedAt = new Date().toISOString();
  payment.verifiedBy = "tokenized_card_gateway";
  payment.updatedAt = new Date().toISOString();

  const receipt = activateUserAccess(payment);

  res.json({
    status: true,
    message: "Card payment verified and authorized successfully.",
    receiptNumber: receipt.receiptNumber,
    receipt,
    payment
  });
});

// 2.8 User Payment History Endpoint
app.get("/api/payment/history/:userId", (req, res) => {
  const { userId } = req.params;
  const userPayments = PAYMENTS_STORE.filter(p => p.userId === userId || userId === "all");
  res.json(userPayments);
});

// 2.9 User Receipts List Endpoint
app.get("/api/payment/receipts/:userId", (req, res) => {
  const { userId } = req.params;
  const userReceipts = RECEIPTS_STORE.filter(r => r.userId === userId || userId === "all");
  res.json(userReceipts);
});

// 2.10 Single Receipt Query
app.get("/api/payment/receipt/:receiptNumber", (req, res) => {
  const { receiptNumber } = req.params;
  const receipt = RECEIPTS_STORE.find(r => r.receiptNumber === receiptNumber);
  if (!receipt) {
    res.status(404).json({ error: "Receipt not found." });
    return;
  }
  res.json(receipt);
});

// Disabled Paystack Endpoints (TutorHiveNG uses OPay, Bank Transfer, and Card Payments)
app.post("/api/paystack/initialize", (req, res) => {
  res.status(403).json({
    status: false,
    error: "Paystack payment gateway is disabled on TutorHiveNG. Please choose Pay with OPay, Pay with Bank Transfer, or Pay with Debit/Credit Card.",
    supportedMethods: ["opay", "bank_transfer", "card"]
  });
});

app.get("/api/paystack/verify/:reference", (req, res) => {
  res.status(403).json({
    status: false,
    error: "Paystack gateway verification is disabled on TutorHiveNG."
  });
});

// 2.11 User Subscriptions Endpoint
app.get("/api/subscriptions/:userId", (req, res) => {
  const { userId } = req.params;
  const userSubs = SUBSCRIPTIONS_STORE.filter(s => s.userId === userId || userId === "all");
  res.json(userSubs);
});

// 2.12 Cancel / Toggle Subscription Auto-Renew
app.post("/api/subscriptions/:id/cancel", (req, res) => {
  const { id } = req.params;
  const sub = SUBSCRIPTIONS_STORE.find(s => s.id === id);
  if (!sub) {
    res.status(404).json({ error: "Subscription not found." });
    return;
  }
  sub.autoRenew = false;
  sub.updatedAt = new Date().toISOString();
  res.json({ status: true, message: "Subscription auto-renewal cancelled successfully.", subscription: sub });
});

// 2.13 User Orders Endpoints
app.get("/api/orders/:userId", (req, res) => {
  const { userId } = req.params;
  const userPayments = PAYMENTS_STORE.filter(p => p.userId === userId || userId === "all");
  const orders = userPayments.map(p => ({
    id: p.orderId || `ord-${p.id}`,
    userId: p.userId,
    itemType: p.itemType,
    itemId: p.itemId,
    itemTitle: p.itemTitle,
    amount: p.amount,
    currency: p.currency,
    status: p.status === "verified" ? "completed" : p.status,
    paymentMethod: p.paymentMethod,
    transactionRef: p.transactionRef,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));
  res.json(orders);
});

app.get("/api/orders/order/:orderId", (req, res) => {
  const { orderId } = req.params;
  const payment = PAYMENTS_STORE.find(p => p.orderId === orderId || p.id === orderId);
  if (!payment) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json({
    id: payment.orderId || `ord-${payment.id}`,
    userId: payment.userId,
    itemType: payment.itemType,
    itemId: payment.itemId,
    itemTitle: payment.itemTitle,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status === "verified" ? "completed" : payment.status,
    paymentMethod: payment.paymentMethod,
    transactionRef: payment.transactionRef,
    billingName: payment.payerName,
    billingEmail: payment.payerEmail,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  });
});

// 2.14 All Transactions Audit Ledger (Admin & Reports)
app.get("/api/payment/transactions", (req, res) => {
  res.json(PAYMENTS_STORE);
});

// ==========================================
// 3. VIDEO LESSONS ACCESS CONTROL & STREAMING
// ==========================================
app.get("/api/lessons/:lessonId/access", (req, res) => {
  const { lessonId } = req.params;
  const userRole = req.headers["x-user-role"] as string || "student";
  const userPackages = (req.headers["x-user-packages"] as string || "").split(",").filter(Boolean);

  // Free preview lesson IDs accessible to anyone
  const FREE_PREVIEW_LESSONS = ["jm-1", "mth-pri-1", "chem-1"];

  const isFree = FREE_PREVIEW_LESSONS.includes(lessonId);
  const isSubscriber = userPackages.length > 0;
  const isAdminOrTutor = userRole === "admin" || userRole === "tutor";

  if (isFree || isSubscriber || isAdminOrTutor) {
    res.json({
      authorized: true,
      lessonId,
      streamUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
      storageBucket: "video-lessons",
      storagePath: `video-lessons/courses/${lessonId}.mp4`,
      lectureNotesUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      qualityOptions: ["1080p HD", "720p", "480p Data-Saver", "Audio-Only"],
      hasAttachments: true,
      message: "Access granted"
    });
  } else {
    res.status(403).json({
      authorized: false,
      lessonId,
      requiredPackage: "pkg-basic",
      message: "This lesson is locked. Subscribe to Basic, Standard, or Premium tuition packages to stream recorded videos.",
      upgradeUrl: "/payment?plan=pkg-basic"
    });
  }
});

// ==========================================
// 4. DIGITAL LIBRARY API (Books, Notes, Past Questions)
// ==========================================
app.get("/api/library", (req, res) => {
  const { category, level, search } = req.query;
  let items = [...DIGITAL_LIBRARY_STORE];

  if (category) {
    items = items.filter(b => b.category.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (level) {
    items = items.filter(b => b.level.toLowerCase().includes(String(level).toLowerCase()));
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }

  res.json(items);
});

app.post("/api/library/upload", (req, res) => {
  const { title, author, category, level, price = 0, coverImageUrl, previewUrl } = req.body;

  if (!title || !author) {
    res.status(400).json({ error: "Title and author are required." });
    return;
  }

  const newBook = {
    id: "lib-bk-" + Date.now(),
    title,
    author,
    category: category || "General Education",
    level: level || "All Levels",
    fileType: "pdf" as const,
    price: Number(price) || 0,
    downloadCount: 0,
    isPublished: true,
    coverImageUrl: coverImageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80",
    previewUrl: previewUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: new Date().toISOString()
  };

  DIGITAL_LIBRARY_STORE.unshift(newBook);

  addNotification({
    title: "New Digital Book Added",
    message: `"${title}" has been uploaded to the Digital Library.`,
    type: "lesson",
    linkTab: "library"
  });

  res.status(201).json(newBook);
});

app.delete("/api/library/:id", (req, res) => {
  const { id } = req.params;
  const idx = DIGITAL_LIBRARY_STORE.findIndex(b => b.id === id);
  if (idx !== -1) {
    DIGITAL_LIBRARY_STORE.splice(idx, 1);
    res.json({ success: true, message: "Book deleted" });
  } else {
    res.status(404).json({ error: "Book not found" });
  }
});

app.post("/api/library/:id/download", (req, res) => {
  const { id } = req.params;
  const item = DIGITAL_LIBRARY_STORE.find(b => b.id === id);
  if (item) {
    item.downloadCount += 1;
    res.json({ success: true, downloadCount: item.downloadCount, downloadUrl: item.previewUrl });
  } else {
    res.status(404).json({ error: "Resource not found" });
  }
});

// ==========================================
// 5. TUTOR MARKETPLACE & EARNINGS
// ==========================================
app.get("/api/tutors", (req, res) => {
  const { subject, level, search } = req.query;
  let tutors = [...TUTORS_DIRECTORY];

  if (subject) {
    tutors = tutors.filter(t => t.subjects.some(s => s.toLowerCase().includes(String(subject).toLowerCase())));
  }
  if (level) {
    tutors = tutors.filter(t => t.levels.some(l => l.toLowerCase().includes(String(level).toLowerCase())));
  }
  if (search) {
    const q = String(search).toLowerCase();
    tutors = tutors.filter(t => t.name.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q));
  }

  res.json(tutors);
});

app.post("/api/tutors/apply", (req, res) => {
  const { name, email, phone, specialization, qualifications, subjects, proposedHourlyRate, statementOfIntent } = req.body;

  if (!name || !email || !specialization) {
    res.status(400).json({ error: "Name, email, and specialization are required for tutor onboarding." });
    return;
  }

  const application = {
    id: "app-" + Date.now(),
    userId: "usr-" + Date.now(),
    name,
    email,
    phone: phone || "",
    specialization,
    qualifications: qualifications || "",
    subjects: Array.isArray(subjects) ? subjects : [subjects || "General Studies"],
    experienceYears: 3,
    proposedHourlyRate: Number(proposedHourlyRate) || 6000,
    statementOfIntent: statementOfIntent || "",
    status: "approved" as const, // Auto-approve demo applications
    submittedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString()
  };

  TUTOR_APPLICATIONS.unshift(application);

  // Add tutor to directory
  TUTORS_DIRECTORY.unshift({
    id: "tut-" + Date.now(),
    name,
    email,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: statementOfIntent || `Verified tutor specializing in ${specialization}.`,
    specialization,
    qualifications: qualifications || "University Degree",
    subjects: application.subjects,
    levels: ["Secondary (SS1-SS3)", "JAMB Prep"],
    hourlyRate: application.proposedHourlyRate,
    rating: 5.0,
    reviewCount: 1,
    totalStudentsTaught: 0,
    totalHoursTaught: 0,
    isVerified: true,
    availableDays: ["Monday", "Wednesday", "Friday"],
    location: "Online (Zoom / Google Meet)"
  });

  addNotification({
    title: "Tutor Application Approved",
    message: `Welcome aboard, ${name}! Your profile is now live in the Tutor Marketplace.`,
    type: "tutor",
    linkTab: "marketplace"
  });

  res.status(201).json({ success: true, application });
});

// Book 1-on-1 tutoring session
app.post("/api/tutors/book", (req, res) => {
  const { tutorId, studentName, studentEmail, subject, scheduledDate, timeSlot, durationMinutes = 60 } = req.body;

  const tutor = TUTORS_DIRECTORY.find(t => t.id === tutorId);
  if (!tutor) {
    res.status(404).json({ error: "Tutor not found" });
    return;
  }

  const hourlyRate = tutor.hourlyRate;
  const totalAmount = Math.round((hourlyRate * Number(durationMinutes)) / 60);
  const tutorEarnings = Math.round(totalAmount * 0.85); // 85% to tutor
  const platformCommission = totalAmount - tutorEarnings; // 15% platform fee

  const booking = {
    id: "book-" + Date.now(),
    tutorId,
    tutorName: tutor.name,
    tutorEmail: tutor.email,
    studentId: "std-" + Date.now(),
    studentName: studentName || "Student",
    studentEmail: studentEmail || "student@example.com",
    subject: subject || tutor.subjects[0] || "General Tutorial",
    scheduledDate: scheduledDate || "Tomorrow",
    timeSlot: timeSlot || "4:00 PM - 5:00 PM",
    durationMinutes: Number(durationMinutes),
    totalAmount,
    tutorEarnings,
    platformCommission,
    status: "confirmed" as const,
    meetingLink: `https://meet.google.com/hve-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
    paymentReference: "TTR-BOOK-" + Date.now(),
    createdAt: new Date().toISOString()
  };

  TUTOR_BOOKINGS.unshift(booking);

  addNotification({
    title: "1-on-1 Session Confirmed",
    message: `Class booked with ${tutor.name} for ${booking.scheduledDate} at ${booking.timeSlot}.`,
    type: "tutor",
    linkTab: "marketplace"
  });

  recordTelemetryEvent({
    user: booking.studentName,
    action: `Booked session with ${tutor.name} (₦${totalAmount.toLocaleString()})`,
    type: "tutor"
  });

  res.status(201).json({ success: true, booking });
});

app.get("/api/tutors/bookings", (req, res) => {
  res.json(TUTOR_BOOKINGS);
});

// ==========================================
// 6. NOTIFICATIONS API
// ==========================================
app.get("/api/notifications", (req, res) => {
  res.json(IN_APP_NOTIFICATIONS);
});

app.post("/api/notifications/send", (req, res) => {
  const { title, message, type = "announcement", linkTab, linkSubTab } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: "Title and message are required." });
    return;
  }
  const notif = addNotification({ title, message, type, linkTab, linkSubTab });
  res.status(201).json(notif);
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = IN_APP_NOTIFICATIONS.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    res.json({ success: true, notification: notif });
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

app.post("/api/notifications/read-all", (req, res) => {
  IN_APP_NOTIFICATIONS.forEach(n => { n.read = true; });
  res.json({ success: true, count: IN_APP_NOTIFICATIONS.length });
});

// ==========================================
// 7. PLUGINS & INTEGRATIONS REGISTRY & WEBHOOKS
// ==========================================
app.get("/api/plugins", (req, res) => {
  res.json(ACTIVE_PLUGINS);
});

app.post("/api/plugins/:id/configure", (req, res) => {
  const { id } = req.params;
  const { status, configValues } = req.body;
  const plugin = ACTIVE_PLUGINS.find(p => p.id === id);

  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  if (status) plugin.status = status;
  if (configValues && typeof configValues === "object") {
    plugin.configFields.forEach(cf => {
      if (configValues[cf.key] !== undefined) {
        cf.maskedValue = cf.type === "secret" ? "••••••••" : String(configValues[cf.key]);
      }
    });
  }

  res.json({ success: true, plugin });
});

app.get("/api/webhooks/logs", (req, res) => {
  res.json(WEBHOOK_LOGS);
});

app.post("/api/webhooks/test", (req, res) => {
  const { provider = "paystack", event = "charge.success" } = req.body;

  const newLog = {
    id: "wh-" + Date.now(),
    provider: provider as any,
    event,
    status: "success" as const,
    statusCode: 200,
    payloadSummary: `Diagnostic webhook event ping triggered for ${provider}::${event}`,
    timestamp: new Date().toISOString()
  };

  WEBHOOK_LOGS.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// ==========================================
// 8. TELEMETRY & ANALYTICS API
// ==========================================
app.get("/api/analytics/overview", (req, res) => {
  res.json(PLATFORM_ANALYTICS);
});

app.post("/api/analytics/track", (req, res) => {
  const { user, action, type } = req.body;
  if (action) {
    recordTelemetryEvent({ user: user || "Student", action, type: type || "event" });
  }
  res.json({ tracked: true });
});

// Legacy Admin endpoint for compatibility
app.get("/api/admin/stats", (req, res) => {
  res.json({
    totalUsers: PLATFORM_ANALYTICS.totalStudents,
    activeSubscribers: PLATFORM_ANALYTICS.activeSubscribers,
    totalCourses: 48,
    pendingVerifications: 3,
    revenueNGN: PLATFORM_ANALYTICS.totalRevenueNGN,
  });
});

// Supabase backend proxy and health check endpoint
app.get("/api/supabase/status", async (req, res) => {
  const rawUrl = process.env.SUPABASE_URL || "https://nbasiawyntilkdfekfqo.supabase.co";
  const supabaseUrl = rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/rest\/?$/i, "")
    .replace(/\/auth\/v1\/?$/i, "")
    .replace(/\/+$/, "") || "https://nbasiawyntilkdfekfqo.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXNpYXd5bnRpbGtkZmVrZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzI1NzcsImV4cCI6MjEwNTI0ODU3N30.MakIa5Wz8tt1hmLaHeG8UcphK1zlbTp5xrF7sICA-3c";

  try {
    const pingStart = Date.now();
    const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
    });
    const latency = Date.now() - pingStart;

    res.json({
      connected: authRes.ok,
      projectId: "nbasiawyntilkdfekfqo",
      url: supabaseUrl,
      authStatus: authRes.ok ? "healthy" : "unhealthy",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      projectId: "nbasiawyntilkdfekfqo",
      error: err.message || "Failed to reach Supabase project",
    });
  }
});

// Download/Inspect production Supabase SQL schema
app.get("/api/supabase/schema", (req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, "utf-8");
      res.setHeader("Content-Type", "text/plain");
      res.send(sqlContent);
      return;
    }
    res.status(404).json({ error: "schema.sql not found on disk" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read schema file" });
  }
});

// ==============================================================================
// 9. INTELLIGENT AUTO-FILL ENGINE (ENTER ONCE, AUTO-POPULATE EVERYWHERE)
// ==============================================================================
app.get("/api/autofill/student/:userId", (req, res) => {
  const { userId } = req.params;
  const emailHint = String(req.query.email || "");
  const data = getStudentAutoFill(userId, emailHint);
  res.json({
    success: true,
    data,
    isEditable: true,
    message: "Retrieved student profile. Form auto-filled and remains editable."
  });
});

app.get("/api/autofill/tutor/:tutorId", (req, res) => {
  const { tutorId } = req.params;
  const data = getTutorAutoFill(tutorId);
  res.json({
    success: true,
    data,
    isEditable: true,
    message: "Retrieved tutor profile. Form auto-filled and remains editable."
  });
});

app.get("/api/autofill/course/:courseId", (req, res) => {
  const { courseId } = req.params;
  const data = getCourseAutoFill(courseId);
  if (!data) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json({
    success: true,
    data,
    isEditable: true,
    message: "Retrieved course curriculum data. Form auto-filled and remains editable."
  });
});

app.get("/api/autofill/library/:resourceId", (req, res) => {
  const { resourceId } = req.params;
  const data = getLibraryItemAutoFill(resourceId);
  if (!data) {
    res.status(404).json({ error: "Library item not found" });
    return;
  }
  res.json({
    success: true,
    data,
    isEditable: true,
    message: "Retrieved library resource metadata. Form auto-filled and remains editable."
  });
});

app.post("/api/autofill/suggest-lesson", async (req, res) => {
  try {
    const { topic, courseId, subject, level } = req.body;
    let baseCourseTitle = "";
    let baseSubject = subject;
    let baseLevel = level;

    if (courseId) {
      const course = getCourseAutoFill(courseId);
      if (course) {
        baseCourseTitle = course.title;
        baseSubject = baseSubject || course.subjectName;
        baseLevel = baseLevel || course.educationLevel;
      }
    }

    const suggestion = await generateLessonSuggestion({
      topic: topic || "Curriculum Fundamentals",
      courseTitle: baseCourseTitle,
      subject: baseSubject,
      level: baseLevel
    });

    res.json({
      success: true,
      data: suggestion,
      isEditable: true,
      message: "Lesson curriculum plan generated. All fields auto-filled and remain editable."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to auto-suggest lesson" });
  }
});

// ==============================================================================
// 10. TUTORHIVE STATISTICS ENGINE (SPSS-STYLE ACADEMIC DATA MODULE)
// ==============================================================================
app.post("/api/stats/inspect", (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "A valid array of dataset rows is required." });
      return;
    }
    const inspection = inspectDataset(rows);
    res.json({ success: true, data: inspection });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Dataset inspection failed" });
  }
});

app.post("/api/stats/recommend", (req, res) => {
  try {
    const { variables, researchGoal } = req.body;
    if (!variables || !Array.isArray(variables)) {
      res.status(400).json({ error: "Variables array is required." });
      return;
    }
    const recommendations = recommendStatisticalTests(variables, researchGoal);
    res.json({ success: true, data: recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Recommendation failed" });
  }
});

app.post("/api/stats/calculate", (req, res) => {
  try {
    const { testType, params } = req.body;

    let result: any = null;

    switch (testType) {
      case "descriptives":
        result = calculateDescriptives(params.values || []);
        break;
      case "one_sample_t_test":
        result = calculateOneSampleTTest(params.values || [], params.testValue || 0);
        break;
      case "independent_t_test":
        result = calculateIndependentTTest(
          params.group1 || [],
          params.group2 || [],
          params.group1Label || "Group 1",
          params.group2Label || "Group 2"
        );
        break;
      case "one_way_anova":
        result = calculateOneWayANOVA(params.groups || []);
        break;
      case "pearson_correlation":
        result = calculatePearsonCorrelation(params.x || [], params.y || []);
        break;
      case "linear_regression":
        result = calculateLinearRegression(params.y || [], params.x || []);
        break;
      case "cronbach_alpha":
        result = calculateCronbachAlpha(params.itemsMatrix || [], params.itemLabels || []);
        break;
      case "chi_square_independence":
        result = calculateChiSquare(params.contingencyTable || [], params.rowLabels || [], params.colLabels || []);
        break;
      default:
        res.status(400).json({ error: `Unsupported testType: ${testType}` });
        return;
    }

    recordTelemetryEvent({
      user: params?.userId || "Student Researcher",
      action: `Executed statistical test: ${result?.testType || testType}`,
      type: "event"
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Calculation failed" });
  }
});

app.post("/api/stats/interpret", async (req, res) => {
  try {
    const { testType, empiricalResults, researchQuestion } = req.body;
    if (!testType || !empiricalResults) {
      res.status(400).json({ error: "testType and empiricalResults are required." });
      return;
    }

    const interpretation = await interpretStatisticalResults({
      testType,
      empiricalResults,
      researchQuestion
    });

    res.json({ success: true, data: interpretation });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Statistical interpretation failed" });
  }
});

// ==============================================================================
// 11. AI VIDEO GENERATOR ENGINE
// ==============================================================================
app.get("/api/video-generator/projects", (req, res) => {
  res.json({ success: true, data: AI_VIDEO_PROJECTS });
});

app.post("/api/video-generator/projects", async (req, res) => {
  try {
    const { topic, courseId, courseTitle, subject, educationLevel, tutorId, tutorName, voiceStyle, createdBy } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required for video generation." });
      return;
    }

    // Auto-fill course details if courseId is passed
    let resolvedCourseTitle = courseTitle;
    let resolvedSubject = subject;
    let resolvedLevel = educationLevel;
    let resolvedTutor = tutorName;

    if (courseId) {
      const course = getCourseAutoFill(courseId);
      if (course) {
        resolvedCourseTitle = resolvedCourseTitle || course.title;
        resolvedSubject = resolvedSubject || course.subjectName;
        resolvedLevel = resolvedLevel || course.educationLevel;
        resolvedTutor = resolvedTutor || course.tutorName;
      }
    }

    const project = await createAIVideoProject({
      topic,
      courseId,
      courseTitle: resolvedCourseTitle,
      subject: resolvedSubject,
      educationLevel: resolvedLevel,
      tutorId,
      tutorName: resolvedTutor,
      voiceStyle,
      createdBy: createdBy || "tutor"
    });

    addNotification({
      title: "AI Video Project Created",
      message: `"${project.title}" storyboard and narration generated by Tutor Bee.`,
      type: "lesson",
      linkTab: "courses"
    });

    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create video project" });
  }
});

app.patch("/api/video-generator/projects/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, videoRenderUrl, rejectionReason, publishedLessonId } = req.body;

  const project = updateVideoProjectStatus(id, status, { videoRenderUrl, rejectionReason, publishedLessonId });
  if (!project) {
    res.status(404).json({ error: "Video project not found" });
    return;
  }

  // If published, optionally append to recorded lessons store
  if (status === "published") {
    LESSONS_STORE.unshift({
      id: "vid-lesson-" + Date.now(),
      courseId: project.courseId || "mth-sec-1",
      moduleNumber: 1,
      lessonOrder: LESSONS_STORE.length + 1,
      title: project.title,
      description: project.scriptPayload?.summaryTakeaway || project.topic,
      videoUrl: project.videoRenderUrl || "https://www.youtube.com/embed/grnpHCg7m0Y",
      storageBucket: "ai-generated-videos",
      durationSeconds: project.durationSeconds,
      notesMarkdown: `# ${project.title}\n\n${project.scriptPayload?.learningHook || ""}`,
      isPreview: true,
    });

    addNotification({
      title: "AI Micro-Lesson Published",
      message: `"${project.title}" has been reviewed, approved, and published to course videos.`,
      type: "lesson",
      linkTab: "courses"
    });
  }

  res.json({ success: true, data: project });
});

// ==============================================================================
// 12. COURSES, CBT QUIZZES & ASSIGNMENTS API
// ==============================================================================
app.get("/api/courses", (req, res) => {
  res.json({ success: true, data: COURSES_REGISTRY });
});

app.post("/api/courses", (req, res) => {
  const { code, title, subjectName, educationLevel, category, tutorId, tutorName, department, description, learningObjectives } = req.body;
  if (!title || !code) {
    res.status(400).json({ error: "Course code and title are required." });
    return;
  }
  const newCourse = {
    id: "crs-" + Date.now(),
    code,
    title,
    subjectId: "subj-" + (code.toLowerCase().slice(0, 3)),
    subjectName: subjectName || "General Academic",
    educationLevel: educationLevel || "Secondary (SSS 1-3)",
    category: category || "Curriculum",
    tutorId: tutorId || "tut-okafor",
    tutorName: tutorName || "Engr. Chinedu Okafor",
    department: department || "Science",
    estimatedWeeks: 12,
    totalLessons: 0,
    description: description || `Course module covering ${title}.`,
    learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : ["Master core examination curriculum"]
  };
  COURSES_REGISTRY.push(newCourse);
  res.status(201).json({ success: true, data: newCourse });
});

app.get("/api/courses/:courseId/lessons", (req, res) => {
  const { courseId } = req.params;
  const lessons = LESSONS_STORE.filter((l) => l.courseId === courseId);
  res.json({ success: true, data: lessons });
});

app.post("/api/courses/:courseId/lessons", (req, res) => {
  const { courseId } = req.params;
  const { title, description, videoUrl, durationSeconds = 1200, notesMarkdown, isPreview = false } = req.body;

  if (!title) {
    res.status(400).json({ error: "Lesson title is required." });
    return;
  }

  const newLesson: LessonRecord = {
    id: "lsn-" + Date.now(),
    courseId,
    moduleNumber: 1,
    lessonOrder: LESSONS_STORE.filter((l) => l.courseId === courseId).length + 1,
    title,
    description: description || "",
    videoUrl: videoUrl || "https://www.youtube.com/embed/grnpHCg7m0Y",
    storageBucket: "video-lessons",
    durationSeconds: Number(durationSeconds),
    notesMarkdown: notesMarkdown || "",
    isPreview: Boolean(isPreview)
  };

  LESSONS_STORE.push(newLesson);
  res.status(201).json({ success: true, data: newLesson });
});

app.get("/api/quizzes", (req, res) => {
  const { courseId } = req.query;
  let quizzes = [...QUIZZES_STORE];
  if (courseId) {
    quizzes = quizzes.filter((q) => q.courseId === courseId);
  }
  res.json({ success: true, data: quizzes });
});

app.post("/api/ai/quiz/generate", async (req, res) => {
  try {
    const { topic, subject, level, questionCount, difficulty } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Topic is required for quiz generation." });
      return;
    }
    const generated = await generateQuizQuestions({ topic, subject, level, questionCount, difficulty });
    res.json({ success: true, data: generated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate quiz questions" });
  }
});

app.post("/api/quizzes/:id/submit", (req, res) => {
  const { id } = req.params;
  const { userId, userName, userAnswers } = req.body;

  const quiz = QUIZZES_STORE.find((q) => q.id === id);
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  let correctCount = 0;
  quiz.questions.forEach((q, idx) => {
    if (userAnswers && userAnswers[q.id] === q.correctOptionIndex) {
      correctCount++;
    }
  });

  const percentage = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = percentage >= quiz.passPercentage;

  const attempt: QuizAttemptRecord = {
    id: "att-" + Date.now(),
    quizId: quiz.id,
    quizTitle: quiz.title,
    userId: userId || "std-current",
    userName: userName || "Student",
    score: correctCount,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    submittedAt: new Date().toISOString()
  };

  QUIZ_ATTEMPTS.unshift(attempt);

  recordTelemetryEvent({
    user: attempt.userName,
    action: `Submitted CBT quiz "${quiz.title}" (Score: ${percentage}%)`,
    type: "event"
  });

  res.json({ success: true, data: attempt });
});

app.get("/api/assignments", (req, res) => {
  res.json({ success: true, data: ASSIGNMENTS_STORE });
});

app.post("/api/assignments/:id/submit", (req, res) => {
  const { id } = req.params;
  const { userId, userName, submissionText, fileUrl } = req.body;

  const asg = ASSIGNMENTS_STORE.find((a) => a.id === id);
  if (!asg) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const submission: AssignmentSubmissionRecord = {
    id: "sub-" + Date.now(),
    assignmentId: asg.id,
    assignmentTitle: asg.title,
    userId: userId || "std-current",
    userName: userName || "Student",
    submissionText: submissionText || "Submitted answers",
    fileUrl,
    submittedAt: new Date().toISOString(),
    status: "submitted"
  };

  ASSIGNMENT_SUBMISSIONS.unshift(submission);

  addNotification({
    title: "Homework Submitted",
    message: `Your submission for "${asg.title}" is queued for tutor review.`,
    type: "lesson",
    linkTab: "dashboard"
  });

  res.status(201).json({ success: true, data: submission });
});

app.patch("/api/assignments/submissions/:id/grade", (req, res) => {
  const { id } = req.params;
  const { score, feedback, gradedBy } = req.body;

  const sub = ASSIGNMENT_SUBMISSIONS.find((s) => s.id === id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  sub.status = "graded";
  sub.score = Number(score);
  sub.feedback = feedback || "Good work!";
  sub.gradedBy = gradedBy || "Tutor";

  addNotification({
    userId: sub.userId,
    title: "Assignment Graded",
    message: `Your submission for "${sub.assignmentTitle}" was graded: ${score}/100.`,
    type: "lesson",
    linkTab: "dashboard"
  });

  res.json({ success: true, data: sub });
});

// ==========================================
// 15. PROGRAM TRACKER & MASTERY PROGRESSION SYSTEM
// ==========================================

// Get all programs with high-level stats
app.get("/api/programs", (req, res) => {
  const programsSummary = PROGRAMS_DATABASE.map((p) => {
    let totalLessons = 0;
    p.modules.forEach((m) => {
      totalLessons += m.lessons.length;
    });

    const enrollmentsCount = PROGRAM_ENROLLMENTS.filter((e) => e.programId === p.id).length;

    return {
      id: p.id,
      title: p.title,
      code: p.code,
      description: p.description,
      educationLevel: p.educationLevel,
      category: p.category,
      durationWeeks: p.durationWeeks,
      estimatedHours: p.estimatedHours,
      allowSkipping: p.allowSkipping,
      passingThreshold: p.passingThreshold,
      certificateEligible: p.certificateEligible,
      badgeIcon: p.badgeIcon,
      thumbnailUrl: p.thumbnailUrl,
      modulesCount: p.modules.length,
      totalLessons,
      enrollmentsCount,
    };
  });

  res.json({ success: true, data: programsSummary });
});

// Get full program detail including syllabus modules and lessons
app.get("/api/programs/:id", (req, res) => {
  const { id } = req.params;
  const program = getProgramById(id);
  if (!program) {
    res.status(404).json({ error: "Educational program not found." });
    return;
  }
  res.json({ success: true, data: program });
});

// Enroll a student in a program
app.post("/api/programs/:id/enroll", (req, res) => {
  const { id } = req.params;
  const { userId, userName, userEmail } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId is required for enrollment." });
    return;
  }

  const program = getProgramById(id);
  if (!program) {
    res.status(404).json({ error: "Program not found." });
    return;
  }

  let enrollment = PROGRAM_ENROLLMENTS.find((e) => e.programId === id && e.userId === userId);
  if (!enrollment) {
    const firstLessonId = program.modules[0]?.lessons[0]?.id || "";
    const firstModuleId = program.modules[0]?.id || "";

    enrollment = {
      id: "enr-" + Math.random().toString(36).substring(2, 9),
      programId: id,
      programTitle: program.title,
      userId,
      userName: userName || "Student",
      userEmail: userEmail || `${userId}@tutorhive.ng`,
      enrolledAt: new Date().toISOString(),
      status: "active",
      progressPercent: 0,
      completedLessonIds: [],
      completedModuleIds: [],
      unlockedLessonIds: [firstLessonId].filter(Boolean),
      unlockedModuleIds: [firstModuleId].filter(Boolean),
      currentLessonId: firstLessonId,
      currentModuleId: firstModuleId,
      allowSkippingOverride: false,
      certificateIssued: false,
    };
    PROGRAM_ENROLLMENTS.push(enrollment);

    addNotification({
      userId,
      title: "Program Enrollment Activated",
      message: `You are enrolled in "${program.title}". Lesson 1 is unlocked to begin your mastery journey!`,
      type: "lesson",
      linkTab: "programs",
    });
  }

  res.json({ success: true, data: enrollment });
});

// Get student progress & lock map for a program
app.get("/api/programs/:id/progress/:userId", (req, res) => {
  const { id: programId, userId } = req.params;
  const userRole = (req.headers["x-user-role"] as string) || "student";

  const program = getProgramById(programId);
  if (!program) {
    res.status(404).json({ error: "Program not found." });
    return;
  }

  const enrollment = updateEnrollmentProgress(userId, programId);
  const stats = calculateProgramProgress(userId, programId);

  // Build unlock state map for all lessons & modules
  const moduleStatusMap = program.modules.map((mod) => {
    const lessonsWithStatus = mod.lessons.map((les) => {
      const access = checkLessonAccess(userId, programId, les.id, userRole);
      const progress = STUDENT_LESSON_PROGRESS.find((p) => p.userId === userId && p.lessonId === les.id);

      return {
        lessonId: les.id,
        title: les.title,
        order: les.order,
        durationMinutes: les.durationMinutes,
        isUnlocked: access.isUnlocked,
        isMastered: progress?.isMastered || false,
        status: access.status,
        lockReason: access.reason,
        prerequisiteInfo: access.prerequisiteInfo,
        quizHighestScore: progress?.quizHighestScore || 0,
        quizPassed: progress?.quizPassed || false,
        videoCompleted: progress?.videoCompleted || false,
        readingCompleted: progress?.readingCompleted || false,
        assignmentSubmitted: progress?.assignmentSubmitted || false,
      };
    });

    const allMastered = lessonsWithStatus.every((l) => l.isMastered);
    const isModuleUnlocked = lessonsWithStatus.some((l) => l.isUnlocked);

    return {
      moduleId: mod.id,
      title: mod.title,
      moduleNumber: mod.moduleNumber,
      order: mod.order,
      isUnlocked: isModuleUnlocked,
      isCompleted: allMastered,
      lessons: lessonsWithStatus,
    };
  });

  const cert = CERTIFICATES_STORE.find((c) => c.programId === programId && c.userId === userId);

  res.json({
    success: true,
    data: {
      programId,
      programTitle: program.title,
      allowSkipping: program.allowSkipping,
      passingThreshold: program.passingThreshold,
      stats,
      enrollment,
      modules: moduleStatusMap,
      certificate: cert || null,
    },
  });
});

// Evaluate lesson access in real-time
app.get("/api/programs/lesson/:lessonId/access", (req, res) => {
  const { lessonId } = req.params;
  const userId = (req.query.userId as string) || "guest";
  const userRole = (req.headers["x-user-role"] as string) || "student";

  const lessonData = findLessonById(lessonId);
  if (!lessonData) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  const access = checkLessonAccess(userId, lessonData.program.id, lessonId, userRole);
  res.json({
    success: true,
    data: {
      lessonId,
      programId: lessonData.program.id,
      moduleId: lessonData.module.id,
      title: lessonData.lesson.title,
      authorized: access.authorized,
      isUnlocked: access.isUnlocked,
      status: access.status,
      reason: access.reason,
      prerequisiteInfo: access.prerequisiteInfo,
      canBypass: access.canBypass,
    },
  });
});

// Log activity (video watching, reading, assignment submission)
app.post("/api/programs/lesson/:lessonId/activity", (req, res) => {
  const { lessonId } = req.params;
  const { userId, programId, activityType, watchedSeconds, assignmentText } = req.body;

  if (!userId || !lessonId || !activityType) {
    res.status(400).json({ error: "userId, lessonId, and activityType are required." });
    return;
  }

  const lessonData = findLessonById(lessonId);
  const progId = programId || lessonData?.program.id;

  if (!progId) {
    res.status(404).json({ error: "Associated program not found." });
    return;
  }

  const progress = recordStudentActivity(userId, progId, lessonId, activityType, {
    watchedSeconds: Number(watchedSeconds) || 0,
    assignmentText,
  });

  updateEnrollmentProgress(userId, progId);

  res.json({ success: true, data: progress });
});

// Submit Mastery Quiz (validates score vs threshold, unlocks next sequential lesson if passed, provides TutorBee AI remediation if failed)
app.post("/api/programs/lesson/:lessonId/mastery-quiz/submit", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { userId, userEmail, programId, answers } = req.body;

    if (!userId || !answers || !Array.isArray(answers)) {
      res.status(400).json({ error: "userId and answers array are required." });
      return;
    }

    const lessonData = findLessonById(lessonId);
    if (!lessonData) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }

    const progId = programId || lessonData.program.id;

    // Run core engine evaluation
    const result = evaluateMasteryQuizSubmission(
      userId,
      userEmail || `${userId}@tutorhive.ng`,
      progId,
      lessonId,
      answers
    );

    // If student failed and Gemini AI is initialized, provide additional deep contextual remediation
    if (!result.passed && ai) {
      try {
        const aiPrompt = `A student scored ${result.percentage}% on the mastery quiz for "${lessonData.lesson.title}" in course "${lessonData.program.title}". Passing threshold is ${result.passingThreshold}%.
The student missed these questions:
${result.attempt.incorrectAnswers.map((inc) => `- Question: "${inc.question}" | Student chose: "${inc.selectedOption}" | Correct answer: "${inc.correctOption}" | Principle: "${inc.explanation}"`).join("\n")}

Act as TutorBee, TutorHive's empathetic, top-tier African EdTech AI Tutor.
Provide:
1. A concise, encouraging message.
2. A direct conceptual correction for why their chosen answers were incorrect.
3. A memorable memory hook or shortcut rule for the correct principle.
4. An invitation to review and retry the checkpoint.
Keep under 180 words, warm, rigorous, and direct.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTIONS,
            temperature: 0.7,
          },
        });

        if (response.text) {
          result.remediationAdvice = response.text;
          result.attempt.tutorBeeRemediation = response.text;
        }
      } catch (aiErr) {
        console.warn("AI dynamic remediation generation skipped, used engine fallback:", aiErr);
      }
    }

    // Add notification
    addNotification({
      userId,
      title: result.passed ? "Mastery Gate Passed! Lecture Unlocked" : "Checkpoint Attempt - Remediation Ready",
      message: result.passed
        ? `Congratulations! You scored ${result.percentage}% on "${lessonData.lesson.title}". The next module lecture is now unlocked.`
        : `You scored ${result.percentage}% on "${lessonData.lesson.title}". Review the TutorBee diagnostic notes and retry to unlock.`,
      type: "lesson",
      linkTab: "programs",
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Mastery quiz evaluation error:", err);
    res.status(500).json({ error: err.message || "Failed to evaluate mastery quiz" });
  }
});

// Admin/Tutor Manual Override: Grant waiver to unlock lesson
app.post("/api/programs/lesson/:lessonId/override", (req, res) => {
  const { lessonId } = req.params;
  const { grantedBy, grantedByRole, studentId, studentName, programId, reason } = req.body;

  if (!grantedBy || !studentId) {
    res.status(400).json({ error: "grantedBy and studentId are required." });
    return;
  }

  const lessonData = findLessonById(lessonId);
  const progId = programId || lessonData?.program.id;
  if (!progId) {
    res.status(404).json({ error: "Program not found." });
    return;
  }

  const override = grantMasteryWaiver(
    grantedBy,
    grantedByRole || "admin",
    studentId,
    studentName || "Student",
    progId,
    lessonId,
    reason || "Administrative waiver approved."
  );

  addNotification({
    userId: studentId,
    title: "Lesson Unlocked by Educator",
    message: `Educator ${grantedBy} unlocked "${lessonData?.lesson.title || lessonId}" for your account.`,
    type: "lesson",
    linkTab: "programs",
  });

  res.json({ success: true, data: override });
});

// Program Configuration: Toggle allowSkipping or passingThreshold (Admin control)
app.patch("/api/programs/:id/settings", (req, res) => {
  const { id } = req.params;
  const { allowSkipping, passingThreshold } = req.body;

  const program = getProgramById(id);
  if (!program) {
    res.status(404).json({ error: "Program not found." });
    return;
  }

  if (typeof allowSkipping === "boolean") {
    toggleProgramSkipping(id, allowSkipping);
  }

  if (typeof passingThreshold === "number" && passingThreshold >= 50 && passingThreshold <= 100) {
    program.passingThreshold = passingThreshold;
  }

  res.json({ success: true, data: program });
});

// Generate Certificate of Mastery
app.post("/api/programs/:id/certificate/generate", (req, res) => {
  try {
    const { id: programId } = req.params;
    const { userId, userName, userEmail } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required." });
      return;
    }

    const cert = issueMasteryCertificate(
      userId,
      userName || "Student",
      userEmail || `${userId}@tutorhive.ng`,
      programId
    );

    addNotification({
      userId,
      title: "Certificate of Mastery Issued!",
      message: `You completed all requirements for "${cert.programTitle}". Certificate #${cert.certificateNumber} is now available!`,
      type: "announcement",
      linkTab: "programs",
    });

    res.json({ success: true, data: cert });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Verify Certificate Public Route
app.get("/api/programs/certificates/:certNumber/verify", (req, res) => {
  const { certNumber } = req.params;
  const cert = CERTIFICATES_STORE.find(
    (c) => c.certificateNumber === certNumber || c.id === certNumber || c.verificationCode === certNumber
  );

  if (!cert) {
    res.status(404).json({ verified: false, message: "Certificate record not found in registry." });
    return;
  }

  res.json({
    verified: true,
    certificate: {
      number: cert.certificateNumber,
      recipient: cert.userName,
      program: cert.programTitle,
      issueDate: cert.issueDate,
      gradeAverage: `${cert.finalGradeAverage}%`,
      verificationCode: cert.verificationCode,
      status: "Officially Validated & Recorded by TutorHiveNG Academic Registry",
    },
  });
});

// Tutor & Admin Cohort Analytics
app.get("/api/programs/analytics/cohort", (req, res) => {
  const analytics = getCohortMasteryAnalytics();
  res.json({ success: true, data: analytics });
});



// Configure Vite or Static delivery depending on environment
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Serving development assets via Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled static assets from dist folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TutorHive Server online at http://localhost:${PORT}`);
  });
}

setupViteOrStatic();

export interface PaymentRecord {
  id: string;
  orderId?: string;
  userId: string;
  transactionRef: string;
  paymentMethod: "opay" | "bank_transfer" | "card";
  amount: number;
  currency: string;
  status: "pending" | "verified" | "failed" | "reversed";
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  itemType: "subscription" | "course" | "book" | "project" | "tutor_booking" | "academic_service";
  itemId: string;
  itemTitle: string;
  gatewayReference?: string;
  bankSenderName?: string;
  bankSenderBank?: string;
  paymentProofUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ElectronicReceipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  orderId?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  itemDescription: string;
  paymentMethod: string;
  amount: number;
  vatAmount: number;
  totalPaid: number;
  currency: string;
  verificationCode: string;
  issuedAt: string;
}

export interface BankTransferVerificationRequest {
  id: string;
  paymentId: string;
  transactionRef: string;
  amount: number;
  senderName: string;
  senderBank: string;
  proofUrl?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  tier: string;
  status: "active" | "past_due" | "cancelled" | "expired";
  autoRenew: boolean;
  billingInterval: "monthly" | "quarterly" | "annual";
  price: number;
  currency: string;
  lastPaymentId?: string;
  startedAt: string;
  currentPeriodEnd: string;
  expiresAt: string;
  updatedAt: string;
}

// In-Memory Storage for Payments, Receipts, Subscriptions, and Bank Verifications
export let SUBSCRIPTIONS_STORE: SubscriptionRecord[] = [
  {
    id: "sub-101",
    userId: "usr_student_demo",
    planId: "pkg-premium",
    planName: "Premium UTME & Tertiary Master Subscription",
    tier: "premium",
    status: "active",
    autoRenew: true,
    billingInterval: "monthly",
    price: 15000,
    currency: "NGN",
    lastPaymentId: "pay-101",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
export let PAYMENTS_STORE: PaymentRecord[] = [
  {
    id: "pay-101",
    orderId: "ord-101",
    userId: "usr_student_demo",
    transactionRef: "TTR-OPAY-1789672001",
    paymentMethod: "opay",
    amount: 15000,
    currency: "NGN",
    status: "verified",
    payerName: "Hauwau Usman",
    payerEmail: "hauwauusmankandarawa@gmail.com",
    payerPhone: "+234 810 123 4567",
    itemType: "subscription",
    itemId: "pkg-premium",
    itemTitle: "Premium UTME & Tertiary Master Subscription (30 Days)",
    gatewayReference: "OPAY_TXN_948201",
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    verifiedBy: "system_opay_webhook",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    id: "pay-102",
    orderId: "ord-102",
    userId: "usr_student_demo",
    transactionRef: "TTR-BANK-1789672002",
    paymentMethod: "bank_transfer",
    amount: 7500,
    currency: "NGN",
    status: "verified",
    payerName: "Hauwau Usman",
    payerEmail: "hauwauusmankandarawa@gmail.com",
    payerPhone: "+234 810 123 4567",
    itemType: "subscription",
    itemId: "pkg-standard",
    itemTitle: "Standard Scholar Subscription Plan",
    bankSenderName: "Hauwau Usman",
    bankSenderBank: "Guaranty Trust Bank (GTB)",
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    verifiedBy: "admin_audit_console",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: "pay-103",
    orderId: "ord-103",
    userId: "usr_student_2",
    transactionRef: "TTR-BANK-1789672003",
    paymentMethod: "bank_transfer",
    amount: 3500,
    currency: "NGN",
    status: "pending",
    payerName: "Babajide Adeleke",
    payerEmail: "b.adeleke@example.com",
    payerPhone: "+234 802 998 8776",
    itemType: "book",
    itemId: "lib-bk-101",
    itemTitle: "Essential Organic Chemistry for West African Tertiary Students",
    bankSenderName: "Babajide Adeleke",
    bankSenderBank: "Zenith Bank Plc",
    paymentProofUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  }
];

export let RECEIPTS_STORE: ElectronicReceipt[] = [
  {
    id: "rec-101",
    receiptNumber: "TTR-REC-20260918-948201",
    paymentId: "pay-101",
    orderId: "ord-101",
    userId: "usr_student_demo",
    customerName: "Hauwau Usman",
    customerEmail: "hauwauusmankandarawa@gmail.com",
    itemDescription: "Premium UTME & Tertiary Master Subscription (30 Days)",
    paymentMethod: "Pay with OPay",
    amount: 15000,
    vatAmount: 0,
    totalPaid: 15000,
    currency: "NGN",
    verificationCode: "0e9df7c050aa1b948",
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    id: "rec-102",
    receiptNumber: "TTR-REC-20260917-817293",
    paymentId: "pay-102",
    orderId: "ord-102",
    userId: "usr_student_demo",
    customerName: "Hauwau Usman",
    customerEmail: "hauwauusmankandarawa@gmail.com",
    itemDescription: "Standard Scholar Subscription Plan",
    paymentMethod: "Pay with Bank Transfer (GTB)",
    amount: 7500,
    vatAmount: 0,
    totalPaid: 7500,
    currency: "NGN",
    verificationCode: "5f8ab92e11ac9918",
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

export let BANK_VERIFICATION_QUEUE: BankTransferVerificationRequest[] = [
  {
    id: "vrf-103",
    paymentId: "pay-103",
    transactionRef: "TTR-BANK-1789672003",
    amount: 3500,
    senderName: "Babajide Adeleke",
    senderBank: "Zenith Bank Plc",
    proofUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    submittedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: "pending",
    notes: "Awaiting administrator manual transaction check against GTB account 0123456789 statement."
  }
];

// Helper: Issue Electronic Receipt
export function generateReceipt(payment: PaymentRecord): ElectronicReceipt {
  const receiptNumber = `TTR-REC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`;
  const receipt: ElectronicReceipt = {
    id: "rec-" + Date.now(),
    receiptNumber,
    paymentId: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    customerName: payment.payerName,
    customerEmail: payment.payerEmail,
    itemDescription: payment.itemTitle,
    paymentMethod: payment.paymentMethod === "opay" ? "Pay with OPay" : payment.paymentMethod === "bank_transfer" ? "Pay with Bank Transfer" : "Pay with Debit / Credit Card",
    amount: payment.amount,
    vatAmount: 0,
    totalPaid: payment.amount,
    currency: payment.currency,
    verificationCode: Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8),
    issuedAt: new Date().toISOString()
  };

  RECEIPTS_STORE.unshift(receipt);
  return receipt;
}

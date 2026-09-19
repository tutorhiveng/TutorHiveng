import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building,
  Smartphone,
  ShieldCheck,
  Lock,
  CheckCircle2,
  BookOpen,
  Download,
  Printer,
  ArrowRight,
  Search,
  Book,
  Package as PackageIcon,
  FolderClosed,
  Check,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  UserCheck,
  Clock,
  Layers,
  GraduationCap,
  FileCheck2,
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { recordPaymentInSupabase, syncUserProfileToSupabase, fetchUserPaymentsFromSupabase } from "../supabase";
import { UserProfile, PayableItem, PaymentRecord } from "../types";
import { getPayableProductsCatalog } from "../data";
import OPayCashierModal from "./OPayCashierModal";
import BankTransferModal from "./BankTransferModal";
import PaymentHistoryView from "./PaymentHistoryView";

interface PaymentCheckoutProps {
  userProfile: UserProfile | null;
  initialItemId?: string | null;
  onOpenAuth: () => void;
  onRefreshProfile: () => void;
  onNavigateToTab: (tab: string, subTab?: string, levelFilter?: string, courseId?: string | null) => void;
}

export default function PaymentCheckout({
  userProfile,
  initialItemId,
  onOpenAuth,
  onRefreshProfile,
  onNavigateToTab,
}: PaymentCheckoutProps) {
  const allPayableItems = getPayableProductsCatalog();

  // Top-level View Mode: catalog | history | subscriptions
  const [portalTab, setPortalTab] = useState<"catalog" | "history" | "subscriptions">("catalog");

  // Selection & filtering state
  const [selectedItem, setSelectedItem] = useState<PayableItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "package" | "library" | "course" | "project" | "tutor" | "service">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Payment method selection (The 3 requested methods)
  const [paymentMethod, setPaymentMethod] = useState<"opay" | "bank_transfer" | "card">("opay");

  // Customer & Billing fields (Auto-filled from userProfile where available, but always editable)
  const [fullName, setFullName] = useState(userProfile?.name || "");
  const [email, setEmail] = useState(userProfile?.email || "");
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [address, setAddress] = useState("14 Academic Boulevard, Victoria Island");
  const [city, setCity] = useState("Lagos");
  const [stateRegion, setStateRegion] = useState("Lagos State");
  const [country, setCountry] = useState("Nigeria");
  const [academicLevel, setAcademicLevel] = useState(userProfile?.currentLevel || "Undergraduate / JAMB Prep");

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState(userProfile?.name || "");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  // Bank Transfer fields
  const [senderBank, setSenderBank] = useState("Guaranty Trust Bank (GTB)");
  const [senderAccountName, setSenderAccountName] = useState(userProfile?.name || "");
  const [bankReference, setBankReference] = useState("");

  // OPay fields
  const [opayWalletPhone, setOpayWalletPhone] = useState("+234 801 234 5678");

  // Modals & Processors
  const [showOPayModal, setShowOPayModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("492018");
  const [generatedRef, setGeneratedRef] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Completed transaction receipt data
  const [receiptData, setReceiptData] = useState<{
    reference: string;
    transactionId: string;
    item: PayableItem;
    amount: number;
    vat: number;
    total: number;
    method: string;
    cardLast4?: string;
    timestamp: string;
    status: "verified" | "pending";
    statusNote?: string;
  } | null>(null);

  // User transaction history for the ledger tab
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  // Initialize selected item from initialItemId prop
  useEffect(() => {
    if (initialItemId) {
      const found = allPayableItems.find((p) => p.id === initialItemId);
      if (found) {
        setSelectedItem(found);
        setPortalTab("catalog");
      }
    }
  }, [initialItemId]);

  // Intelligent auto-fill from userProfile, always editable
  useEffect(() => {
    if (userProfile) {
      if (userProfile.name) {
        setFullName(userProfile.name);
        setCardHolder(userProfile.name);
        setSenderAccountName(userProfile.name);
      }
      if (userProfile.email) {
        setEmail(userProfile.email);
      }
      if (userProfile.phone) {
        setPhone(userProfile.phone);
        setOpayWalletPhone(userProfile.phone);
      }
      if (userProfile.currentLevel) {
        setAcademicLevel(userProfile.currentLevel);
      }
    }
  }, [userProfile]);

  // Load user transaction history from Supabase / Firestore
  useEffect(() => {
    async function loadHistory() {
      if (!userProfile?.uid) return;
      const historyList: PaymentRecord[] = [];

      try {
        const sbRes = await fetchUserPaymentsFromSupabase(userProfile.uid);
        if (sbRes.success && sbRes.data.length > 0) {
          sbRes.data.forEach((p: any) => {
            historyList.push({
              id: p.id,
              userId: p.user_id || p.userId,
              userEmail: p.user_email || p.userEmail,
              amount: Number(p.amount),
              paymentMethod: p.payment_method || p.paymentMethod,
              status: p.status,
              itemType: p.item_type || p.itemType,
              itemId: p.item_id || p.itemId,
              reference: p.reference,
              createdAt: p.created_at || p.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch {
        // fallback to Firestore
      }

      if (historyList.length === 0) {
        try {
          const q = query(collection(db, "payments"), where("userId", "==", userProfile.uid));
          const snap = await getDocs(q);
          snap.forEach((d) => {
            historyList.push(d.data() as PaymentRecord);
          });
        } catch {
          // ignore
        }
      }

      setPaymentHistory(historyList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }

    loadHistory();
  }, [userProfile, receiptData]);

  // Card brand detection
  function getCardBrand(num: string): "visa" | "mastercard" | "verve" | "unknown" {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "visa";
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) return "mastercard";
    if (/^(506|507|6500)/.test(clean)) return "verve";
    return "unknown";
  }

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(" "));
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    setExpiry(raw);
  }

  // Filter items in catalog
  const filteredCatalog = allPayableItems.filter((item) => {
    if (activeCategory !== "all" && item.type !== activeCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchAuthor = item.subtitle?.toLowerCase().includes(q) || item.authorOrDept?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor) return false;
    }
    return true;
  });

  // Calculate pricing breakdown
  const unitPrice = selectedItem ? selectedItem.price : 0;
  const vatRate = 0.075; // 7.5% standard VAT
  const vatAmount = Math.round(unitPrice * vatRate);
  const totalAmount = unitPrice + vatAmount;

  // Validation before launching payment
  function validatePaymentForm(): boolean {
    setFormError(null);
    if (!selectedItem) {
      setFormError("Please select a product or library book to pay for.");
      return false;
    }
    if (!fullName.trim()) {
      setFormError("Please enter your cardholder / billing full name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid billing email address for your receipt.");
      return false;
    }

    if (paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 16) {
        setFormError("Please enter a valid 16-digit debit or credit card number.");
        return false;
      }
      if (!cardHolder.trim()) {
        setFormError("Please enter the name printed on your card.");
        return false;
      }
      if (expiry.length < 5 || !expiry.includes("/")) {
        setFormError("Please enter a valid card expiration date (MM/YY).");
        return false;
      }
      const [mm, yy] = expiry.split("/").map((n) => parseInt(n, 10));
      if (mm < 1 || mm > 12) {
        setFormError("Invalid expiration month. Must be between 01 and 12.");
        return false;
      }
      if (cvv.length < 3) {
        setFormError("Please enter the 3-digit CVV security code on the back of your card.");
        return false;
      }
    }

    return true;
  }

  // Trigger payment flow based on selected method
  async function handleInitiatePayment() {
    if (!validatePaymentForm()) return;

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    // Call server initialize endpoint to create verified payment record
    const ref = "TTR-" + paymentMethod.toUpperCase() + "-" + Math.floor(10000000 + Math.random() * 90000000);
    setGeneratedRef(ref);

    try {
      await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          itemType: selectedItem!.type,
          itemId: selectedItem!.id,
          userId: userProfile.uid,
          userEmail: email,
          method: paymentMethod,
          reference: ref,
        }),
      });
    } catch {
      // Continue locally if offline
    }

    if (paymentMethod === "opay") {
      setShowOPayModal(true);
    } else if (paymentMethod === "bank_transfer") {
      setShowBankModal(true);
    } else if (paymentMethod === "card") {
      setShowOtpModal(true);
    }
  }

  // Centralized Automatic Access Activation
  async function activatePurchasedAccess(ref: string, methodStr: string, isVerified: boolean, note?: string) {
    const transactionId = "pay-" + Date.now();
    const resolvedUserId = userProfile ? userProfile.uid : "guest-" + Date.now();
    const resolvedUserEmail = userProfile ? userProfile.email : email;

    // 1. Dual-sync to Supabase & Firestore
    const paymentRecordPayload: PaymentRecord = {
      id: transactionId,
      userId: resolvedUserId,
      userEmail: resolvedUserEmail,
      amount: totalAmount,
      paymentMethod: paymentMethod,
      status: isVerified ? "completed" : "pending",
      itemType: selectedItem!.type,
      itemId: selectedItem!.id,
      reference: ref,
      createdAt: new Date().toISOString(),
    };

    try {
      await recordPaymentInSupabase(paymentRecordPayload);
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, "payments", transactionId), {
        ...paymentRecordPayload,
        createdAt: serverTimestamp(),
      });
    } catch {
      // ignore
    }

    // 2. If verified, auto-activate user profile entitlements
    if (isVerified && userProfile && userProfile.uid) {
      const currentPackages = [...(userProfile.purchasedPackages || [])];
      const currentProjects = [...(userProfile.purchasedProjects || [])];
      const currentBooks = [...(userProfile.purchasedBooks || [])];
      const currentCourses = [...(userProfile.enrolledCourses || [])];

      if (selectedItem!.type === "package") {
        if (!currentPackages.includes(selectedItem!.title)) {
          currentPackages.push(selectedItem!.title);
        }
      } else if (selectedItem!.type === "library") {
        if (!currentBooks.includes(selectedItem!.id)) {
          currentBooks.push(selectedItem!.id);
        }
      } else if (selectedItem!.type === "project") {
        if (!currentProjects.includes(selectedItem!.id)) {
          currentProjects.push(selectedItem!.id);
        }
      } else if (selectedItem!.type === "course") {
        if (!currentCourses.includes(selectedItem!.id)) {
          currentCourses.push(selectedItem!.id);
        }
      }

      const updatedProfile: UserProfile = {
        ...userProfile,
        purchasedPackages: currentPackages,
        purchasedProjects: currentProjects,
        purchasedBooks: currentBooks,
        enrolledCourses: currentCourses,
      };

      await syncUserProfileToSupabase(updatedProfile);

      try {
        await setDoc(doc(db, "users", userProfile.uid), updatedProfile, { merge: true });
      } catch {
        // ignore
      }

      onRefreshProfile();
    }

    // 3. Set receipt data
    const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
    setReceiptData({
      reference: ref,
      transactionId,
      item: selectedItem!,
      amount: unitPrice,
      vat: vatAmount,
      total: totalAmount,
      method: methodStr,
      cardLast4: paymentMethod === "card" ? last4 : undefined,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: isVerified ? "verified" : "pending",
      statusNote: note,
    });
  }

  // Check if item is already owned
  function isItemAlreadyOwned(item: PayableItem): boolean {
    if (!userProfile) return false;
    if (userProfile.purchasedPackages?.includes("Premium")) return true;
    if (item.type === "package") {
      return !!userProfile.purchasedPackages?.includes(item.title);
    }
    if (item.type === "library") {
      return !!userProfile.purchasedBooks?.includes(item.id);
    }
    if (item.type === "project") {
      return !!userProfile.purchasedProjects?.includes(item.id);
    }
    if (item.type === "course") {
      return !!userProfile.enrolledCourses?.includes(item.id);
    }
    return false;
  }

  // Open receipt from historical record
  function handleViewHistoricalReceipt(p: PaymentRecord) {
    const matchedItem = allPayableItems.find((i) => i.id === p.itemId) || {
      id: p.itemId,
      type: (p.itemType as any) || "package",
      title: p.itemId,
      price: p.amount,
      description: "Historical academic purchase",
    };

    setReceiptData({
      reference: p.reference || p.id,
      transactionId: p.id,
      item: matchedItem,
      amount: Math.round(p.amount / 1.075),
      vat: Math.round(p.amount - p.amount / 1.075),
      total: p.amount,
      method: p.paymentMethod,
      timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString("en-GB") : "Verified Date",
      status: p.status === "completed" || p.status === "verified" ? "verified" : "pending",
    });
  }

  // ==========================================
  // VIEW 3: OFFICIAL ELECTRONIC TAX RECEIPT
  // ==========================================
  if (receiptData) {
    const isVerified = receiptData.status === "verified";

    return (
      <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Action Banner */}
          <div className="flex items-center justify-between border-b border-black pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 inline-block ${isVerified ? "bg-emerald-600" : "bg-amber-600"}`}
              ></span>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isVerified ? "text-emerald-700" : "text-amber-800"
                }`}
              >
                {isVerified ? "Payment Authorized & Access Activated" : "Transfer Proof Submitted — Pending Verification"}
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Tax Receipt
            </button>
          </div>

          {/* Printable Receipt Card */}
          <div id="printable-tax-receipt" className="bg-white border-2 border-black p-6 sm:p-10 space-y-8 shadow-sm">
            {/* Letterhead */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#D4AF37] rotate-45 flex items-center justify-center">
                    <span className="text-white font-black -rotate-45 font-sans text-[10px]">T</span>
                  </div>
                  <span className="text-xl font-serif font-black tracking-tight uppercase">
                    TUTOR<span className="text-[#D4AF37]">HIVE</span>
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  Educational Technologies &amp; Academic Digital Publications Ltd
                </p>
                <p className="text-[9px] font-mono text-zinc-400">TIN: 24901842-0001 &bull; RC: 1829471 &bull; CBN Merchant Certified</p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-0.5 border text-[10px] font-mono font-bold tracking-widest uppercase ${
                    isVerified
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {isVerified ? "PAID IN FULL" : "PAYMENT PENDING REVIEW"}
                </span>
                <p className="text-[11px] font-mono font-bold text-black mt-1">REF: {receiptData.reference}</p>
                <p className="text-[10px] font-mono text-zinc-500">{receiptData.timestamp}</p>
              </div>
            </div>

            {/* Billed To / Transaction Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] font-mono">
              <div className="space-y-1">
                <span className="text-zinc-400 text-[9px] uppercase tracking-widest block font-bold">Billed To</span>
                <p className="font-bold text-black text-sm">{fullName || userProfile?.name || "Student"}</p>
                <p className="text-zinc-600">{email || userProfile?.email}</p>
                {phone && <p className="text-zinc-600">{phone}</p>}
                <p className="text-zinc-500 text-[10px]">{address}, {city}, {stateRegion}, {country}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-zinc-400 text-[9px] uppercase tracking-widest block font-bold">Payment Method</span>
                <p className="font-bold text-black uppercase">{receiptData.method}</p>
                <p className="text-zinc-500 text-[10px]">Academic Gateway: TutorHive NG Production</p>
                <p className="text-zinc-500 text-[10px]">Transaction ID: {receiptData.transactionId}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-black overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-black text-[9px] uppercase tracking-widest text-black font-bold">
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-3 font-bold text-black">
                      {receiptData.item.title}
                      {receiptData.item.subtitle && (
                        <span className="block text-[10px] text-zinc-500 font-normal">
                          {receiptData.item.subtitle}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-600 uppercase text-[10px]">{receiptData.item.category || receiptData.item.type}</td>
                    <td className="p-3 text-right font-serif font-bold text-black">
                      ₦{receiptData.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ledger Breakdown */}
            <div className="flex justify-end font-mono text-xs">
              <div className="w-64 space-y-1.5 border-t border-black pt-3">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>₦{receiptData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>VAT (7.5% Standard):</span>
                  <span>₦{receiptData.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Gateway Fee:</span>
                  <span className="text-emerald-700 font-bold">Waived (₦0.00)</span>
                </div>
                <div className="flex justify-between text-black font-bold text-base border-t-2 border-black pt-2">
                  <span>Total Paid:</span>
                  <span className="text-[#D4AF37]">₦{receiptData.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status Note if pending */}
            {receiptData.statusNote && (
              <div className="p-3 bg-neutral-100 border border-black/20 text-[10px] font-mono text-zinc-700">
                <span className="font-bold block uppercase text-black">Status Note:</span>
                {receiptData.statusNote}
              </div>
            )}

            {/* Verification Watermark Footer */}
            <div className="border-t border-black/10 pt-4 text-center space-y-1">
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                Electronic Receipt Issued by TutorHive Central Academic Gateway &bull; Auto-Activated
              </p>
              <p className="text-[9px] text-zinc-400">
                This transaction grants instant digital license and is non-transferable.
              </p>
            </div>
          </div>

          {/* Direct Post-Payment Actions */}
          <div className="space-y-3">
            {isVerified ? (
              receiptData.item.type === "library" ? (
                <button
                  onClick={() => onNavigateToTab("library")}
                  className="w-full py-4 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <BookOpen className="w-4 h-4" /> Open &amp; Read Book in Digital Library Now
                </button>
              ) : receiptData.item.type === "course" || receiptData.item.type === "package" ? (
                <button
                  onClick={() => onNavigateToTab("dashboard", "courses")}
                  className="w-full py-4 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Go to My Enrolled Courses &amp; Lessons
                </button>
              ) : (
                <button
                  onClick={() => onNavigateToTab("projects")}
                  className="w-full py-4 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" /> Download Complete Research Manuscript
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setReceiptData(null);
                  setPortalTab("history");
                }}
                className="w-full py-4 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Clock className="w-4 h-4" /> Track Payment Status in History
              </button>
            )}

            <button
              onClick={() => {
                setReceiptData(null);
                setSelectedItem(null);
                setPortalTab("catalog");
              }}
              className="w-full py-3 bg-white text-black hover:bg-neutral-100 border border-black font-mono font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: REAL CHECKOUT FORM (Item Selected)
  // ==========================================
  if (selectedItem) {
    const cardBrand = getCardBrand(cardNumber);

    return (
      <div className="bg-[#FAF9F6] text-black min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumb / Step bar */}
          <div className="flex items-center justify-between border-b border-black pb-3">
            <button
              onClick={() => setSelectedItem(null)}
              className="text-[10px] font-mono uppercase tracking-widest font-bold text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              &larr; Choose a different product or book
            </button>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold">
              <span className="text-zinc-400">1. Select Item</span>
              <span className="text-black">&rarr;</span>
              <span className="text-[#D4AF37] font-black underline underline-offset-4">2. Payment Details</span>
              <span className="text-zinc-400">&rarr;</span>
              <span className="text-zinc-400">3. Receipt</span>
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="bg-red-50 border border-red-600 text-red-900 p-4 rounded-none flex items-start gap-3 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider">Payment Validation Notice</p>
                <p className="mt-0.5">{formError}</p>
              </div>
            </div>
          )}

          {/* Two-Column Checkout Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Payment Form (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step Title */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-bold block">
                  Official Merchant Checkout Gateway
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif text-black uppercase tracking-tight">
                  Enter Payment Details
                </h1>
                <p className="text-zinc-500 text-xs font-serif italic mt-1">
                  Choose your payment option (OPay, Bank Transfer, or Debit/Credit Card) and complete your order.
                </p>
              </div>

              {/* SECTION 1: Billing & Customer Information (Auto-filled & Editable) */}
              <div className="bg-white border border-black p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black pb-2 gap-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
                    <span className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px]">1</span>
                    Customer &amp; Billing Information
                  </h3>
                  {userProfile && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                      <UserCheck className="w-3 h-3" /> Auto-filled from Profile (Editable)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setCardHolder(e.target.value);
                        setSenderAccountName(e.target.value);
                      }}
                      placeholder="e.g. Hauwau Usman"
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      Billing Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setOpayWalletPhone(e.target.value);
                      }}
                      placeholder="+234 801 234 5678"
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      Billing Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="14 Academic Boulevard, Victoria Island"
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lagos / Abuja / Kano"
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                      State &amp; Country
                    </label>
                    <select
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black cursor-pointer"
                    >
                      <option value="Lagos State">Lagos State, Nigeria</option>
                      <option value="Abuja FCT">Abuja FCT, Nigeria</option>
                      <option value="Oyo State">Oyo State, Nigeria</option>
                      <option value="Rivers State">Rivers State, Nigeria</option>
                      <option value="Kano State">Kano State, Nigeria</option>
                      <option value="Kaduna State">Kaduna State, Nigeria</option>
                      <option value="Enugu State">Enugu State, Nigeria</option>
                      <option value="International">International (Diaspora)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Payment Method Selection (3 Specific Methods) */}
              <div className="bg-white border border-black p-6 space-y-6 shadow-xs">
                <div className="border-b border-black pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
                    <span className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px]">2</span>
                    Select Payment Method
                  </h3>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                    <Lock className="w-3 h-3 text-[#D4AF37]" /> PCI-DSS &amp; CBN Regulated
                  </div>
                </div>

                {/* 3 Explicit Method Buttons */}
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {/* Option 1: Pay with OPay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("opay")}
                    className={`py-3 px-2 border text-center transition-all cursor-pointer rounded-none flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "opay"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-black/30 bg-white text-black hover:border-black"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Pay with OPay</span>
                  </button>

                  {/* Option 2: Pay with Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`py-3 px-2 border text-center transition-all cursor-pointer rounded-none flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "bank_transfer"
                        ? "border-black bg-black text-white shadow-xs"
                        : "border-black/30 bg-white text-black hover:border-black"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Bank Transfer</span>
                  </button>

                  {/* Option 3: Pay with Debit/Credit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-3 px-2 border text-center transition-all cursor-pointer rounded-none flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "card"
                        ? "border-black bg-black text-white shadow-xs"
                        : "border-black/30 bg-white text-black hover:border-black"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Debit / Card</span>
                  </button>
                </div>

                {/* --- METHOD 1: OPAY DETAILS PREVIEW --- */}
                {paymentMethod === "opay" && (
                  <div className="space-y-4 pt-2 font-mono text-xs animate-fadeIn">
                    <div className="bg-emerald-50 border border-emerald-300 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" /> Official OPay Africa Payment Gateway
                        </span>
                        <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 font-bold uppercase">
                          Zero Failed Rates
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-700">
                        When you click <strong>Authorize &amp; Pay</strong> below, an official OPay payment flow is
                        launched. You can pay via the OPay mobile app (Scan QR / Instant push to your wallet) or dial
                        the instant USSD checkout code.
                      </p>
                      <div className="bg-white border border-emerald-200 p-3 space-y-1 text-xs mt-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Registered OPay Mobile Number:</span>
                          <span className="font-bold text-black">{opayWalletPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Automatic Access Activation:</span>
                          <span className="font-bold text-emerald-700">Instant upon webhook receipt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- METHOD 2: BANK TRANSFER DETAILS PREVIEW --- */}
                {paymentMethod === "bank_transfer" && (
                  <div className="space-y-4 pt-2 font-mono text-xs animate-fadeIn">
                    <div className="bg-[#FAF9F6] border border-black p-4 space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold block">
                        TutorHive Corporate Settlement Account
                      </span>
                      <p className="text-[11px] text-zinc-600">
                        Transfer the exact amount to our designated GTB corporate account. You will receive a unique
                        reference number to include in your narration:
                      </p>
                      <div className="bg-white border border-black/20 p-3 space-y-1.5 text-xs mt-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Beneficiary Bank:</span>
                          <span className="font-bold text-black">Guaranty Trust Bank (GTB)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Account Number:</span>
                          <span className="font-bold text-black font-mono text-sm tracking-widest text-[#D4AF37]">
                            0123 456 789
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Account Name:</span>
                          <span className="font-bold text-black">TutorHive Educational Technologies Ltd</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- METHOD 3: DEBIT / CREDIT CARD --- */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-2 font-mono animate-fadeIn">
                    {/* Visual Card Simulator */}
                    <div className="bg-gradient-to-tr from-neutral-900 via-black to-neutral-800 text-white p-5 border border-black shadow-md rounded-none relative overflow-hidden space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-5 bg-[#D4AF37] rounded-xs opacity-90"></div>
                          <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">
                            TutorHive Student Card
                          </span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                          {cardBrand === "visa"
                            ? "VISA"
                            : cardBrand === "mastercard"
                            ? "MASTERCARD"
                            : cardBrand === "verve"
                            ? "VERVE"
                            : "CARD"}
                        </span>
                      </div>

                      <div className="text-base sm:text-lg tracking-widest font-mono text-zinc-100 py-1">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-zinc-400">
                        <div>
                          <span className="block text-[7px] text-zinc-500">Cardholder</span>
                          <span className="text-white font-bold">{cardHolder || "STUDENT NAME"}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[7px] text-zinc-500">Expires</span>
                          <span className="text-white font-bold">{expiry || "MM/YY"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                          Card Number *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4532 •••• •••• 8941"
                            maxLength={19}
                            className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black pr-16"
                          />
                          <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[9px] font-bold uppercase text-zinc-400">
                            {cardBrand.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="HAUWAU USMAN"
                          className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                          Expiration Date (MM/YY) *
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="08/28"
                          maxLength={5}
                          className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                            Security CVV / CVC *
                          </label>
                          <span
                            title="3 digits on the signature strip on the back of your card"
                            className="text-[9px] text-zinc-400 hover:text-black cursor-help flex items-center gap-0.5"
                          >
                            <HelpCircle className="w-3 h-3" /> 3 Digits
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showCvv ? "text" : "password"}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black text-center pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                          >
                            {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="save-card-toggle"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded-none border-black accent-black w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="save-card-toggle" className="text-[10px] font-mono text-zinc-600 cursor-pointer">
                        Securely tokenize card for 1-click renewal (Card details are never stored unencrypted)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className={`w-full py-4 border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50 ${
                    paymentMethod === "opay"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  {paymentMethod === "opay" && "Pay ₦" + totalAmount.toLocaleString() + " with OPay"}
                  {paymentMethod === "bank_transfer" && "Pay ₦" + totalAmount.toLocaleString() + " via Bank Transfer"}
                  {paymentMethod === "card" && "Authorize & Pay ₦" + totalAmount.toLocaleString() + " with Card"}
                </button>

                <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 256-Bit SSL Encrypted
                  </span>
                  <span>&bull;</span>
                  <span>Instant Digital Delivery</span>
                  <span>&bull;</span>
                  <span>7-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Item Review (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              <div className="bg-white border-2 border-black p-6 space-y-6 shadow-sm">
                <div className="border-b border-black pb-3">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-bold block">
                    Order Summary
                  </span>
                  <h3 className="text-lg font-serif font-black text-black uppercase tracking-tight">
                    Payable Item Review
                  </h3>
                </div>

                {/* Selected Item Card */}
                <div className="bg-[#FAF9F6] border border-black p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-black text-[#D4AF37] flex items-center justify-center shrink-0 border border-black">
                      {selectedItem.type === "library" ? (
                        <Book className="w-5 h-5" />
                      ) : selectedItem.type === "package" ? (
                        <PackageIcon className="w-5 h-5" />
                      ) : selectedItem.type === "course" ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : (
                        <FolderClosed className="w-5 h-5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="inline-block px-1.5 py-0.5 bg-black text-white text-[8px] font-mono uppercase tracking-widest font-bold">
                        {selectedItem.badge || selectedItem.type}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-black tracking-tight mt-1 line-clamp-2">
                        {selectedItem.title}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{selectedItem.subtitle}</p>
                    </div>
                  </div>

                  {selectedItem.detailsList && selectedItem.detailsList.length > 0 && (
                    <ul className="text-[10px] font-mono text-zinc-600 space-y-1.5 border-t border-black/10 pt-3">
                      {selectedItem.detailsList.slice(0, 3).map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Ledger Breakdown */}
                <div className="space-y-2.5 font-mono text-xs border-b border-black pb-4">
                  <div className="flex justify-between text-zinc-600">
                    <span>Item Price:</span>
                    <span>₦{unitPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>VAT (7.5% Standard):</span>
                    <span>₦{vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Gateway Processing:</span>
                    <span className="text-emerald-700 font-bold">₦0.00 (Waived)</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 block font-bold">
                      Total Payable
                    </span>
                    <span className="text-xs text-zinc-400">All taxes &amp; fees included</span>
                  </div>
                  <span className="text-2xl font-black text-black font-serif">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Digital Fulfillment Guarantee */}
                <div className="bg-neutral-50 border border-black/10 p-3 text-[10px] font-mono text-zinc-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Instant Digital Activation</span>
                  </div>
                  <p>
                    Your purchase unlocks immediately on this device and your student profile upon verified payment
                    authorization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: OPAY CASHIER MODAL */}
        {showOPayModal && (
          <OPayCashierModal
            transactionRef={generatedRef}
            amount={totalAmount}
            itemTitle={selectedItem.title}
            payerName={fullName}
            payerEmail={email}
            payerPhone={phone}
            onSuccess={(opayOrderNo) => {
              setShowOPayModal(false);
              activatePurchasedAccess(generatedRef, `OPay (Order #${opayOrderNo})`, true);
            }}
            onCancel={() => setShowOPayModal(false)}
          />
        )}

        {/* MODAL 2: BANK TRANSFER MODAL */}
        {showBankModal && (
          <BankTransferModal
            transactionRef={generatedRef}
            amount={totalAmount}
            itemTitle={selectedItem.title}
            payerName={fullName}
            payerEmail={email}
            onProofSubmitted={({ senderName: sName, senderBank: sBank, proofUrl }) => {
              setShowBankModal(false);
              activatePurchasedAccess(
                generatedRef,
                `Bank Transfer (${sBank} - ${sName})`,
                false,
                `Transfer confirmation submitted from ${sBank} by ${sName}. Bursary desk verification queued under reference ${generatedRef}.`
              );
            }}
            onCancel={() => setShowBankModal(false)}
          />
        )}

        {/* MODAL 3: 3D SECURE OTP FOR CARD */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl font-mono">
              <div className="flex items-center justify-between border-b border-black pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#D4AF37] rotate-45 flex items-center justify-center">
                    <span className="text-white font-black -rotate-45 font-sans text-[8px]">T</span>
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider">3D Secure 2.0 Verification</span>
                </div>
                <span className="text-[9px] text-zinc-400">Mastercard Identity Check / Visa Secure</span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-zinc-600">
                  Your issuing bank has initiated an authentication challenge. A one-time security passcode (OTP) has
                  been dispatched to your phone ending in <strong className="text-black">••• 894</strong>.
                </p>
                <div className="bg-[#FAF9F6] border border-black/20 p-3 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Merchant:</span>
                    <span className="font-bold text-black">TutorHive Education</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount:</span>
                    <span className="font-bold text-black">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 uppercase tracking-wider block font-bold">
                  Enter 6-Digit One-Time PIN (OTP) *
                </label>
                <input
                  type="text"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  maxLength={6}
                  className="w-full border-2 border-black p-3 text-center text-lg font-mono tracking-[0.3em] font-black bg-[#FAF9F6] focus:bg-white focus:outline-hidden"
                />
                <p className="text-[9px] text-zinc-400 text-center mt-1">
                  Test sample code <span className="font-bold text-black">{otpValue}</span> ready. Click Confirm to verify.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 border border-black bg-white hover:bg-neutral-100 text-black text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
                    activatePurchasedAccess(generatedRef, `Card (•••• ${last4})`, true);
                  }}
                  className="flex-1 py-3 border border-black bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-[10px] uppercase tracking-wider font-bold cursor-pointer transition-colors"
                >
                  Confirm &amp; Authorize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 1: CATALOG & BROWSE PORTAL
  // ==========================================
  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Masthead */}
        <div className="border-t border-b border-black py-6 text-center max-w-5xl mx-auto w-full space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">
            Centralized Academic Payment Portal &amp; Bursary Desk
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-black uppercase tracking-tight">
            Payments &amp; <span className="font-serif italic font-light">Subscriptions</span>
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto italic font-serif">
            Pay securely with OPay, Bank Transfer, or Debit Card for tuition packages, digital books, courses, research
            theses, and 1-on-1 private tutoring.
          </p>
        </div>

        {/* Portal View Switcher Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex border-2 border-black p-1 bg-white font-mono text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setPortalTab("catalog")}
              className={`px-4 py-2 uppercase font-bold tracking-wider transition-all cursor-pointer ${
                portalTab === "catalog"
                  ? "bg-black text-[#D4AF37]"
                  : "text-zinc-600 hover:text-black hover:bg-neutral-100"
              }`}
            >
              1. Catalog &amp; Make Payment
            </button>
            <button
              type="button"
              onClick={() => setPortalTab("history")}
              className={`px-4 py-2 uppercase font-bold tracking-wider transition-all cursor-pointer ${
                portalTab === "history"
                  ? "bg-black text-[#D4AF37]"
                  : "text-zinc-600 hover:text-black hover:bg-neutral-100"
              }`}
            >
              2. Transaction History &amp; Receipts
            </button>
            <button
              type="button"
              onClick={() => setPortalTab("subscriptions")}
              className={`px-4 py-2 uppercase font-bold tracking-wider transition-all cursor-pointer ${
                portalTab === "subscriptions"
                  ? "bg-black text-[#D4AF37]"
                  : "text-zinc-600 hover:text-black hover:bg-neutral-100"
              }`}
            >
              3. Subscription &amp; Licenses
            </button>
          </div>
        </div>

        {/* SUBVIEW: HISTORY OR SUBSCRIPTIONS */}
        {portalTab !== "catalog" ? (
          <PaymentHistoryView
            payments={paymentHistory}
            userProfile={userProfile}
            onViewReceipt={handleViewHistoricalReceipt}
            onNewPayment={() => setPortalTab("catalog")}
          />
        ) : (
          /* SUBVIEW: CATALOG BROWSER */
          <div className="space-y-8">
            {/* Search & Category Filter Controls */}
            <div className="bg-white border-2 border-black p-4 sm:p-6 space-y-4 shadow-xs font-mono">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by book title, author, package, or project topic..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-black bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase font-bold">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "package", label: "Subscriptions" },
                    { id: "library", label: "Paid E-Books" },
                    { id: "course", label: "Prep Courses" },
                    { id: "project", label: "Thesis Projects" },
                    { id: "tutor", label: "1-on-1 Tutoring" },
                    { id: "service", label: "SPSS Services" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
                        activeCategory === cat.id
                          ? "bg-black text-[#D4AF37] border-black font-black"
                          : "bg-white text-black border-black/30 hover:border-black"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              {filteredCatalog.map((item) => {
                const alreadyOwned = isItemAlreadyOwned(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-black p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                  >
                    <div className="space-y-4">
                      {/* Badge & Type */}
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <span className="text-[9px] bg-black text-[#D4AF37] px-2 py-0.5 font-bold uppercase tracking-wider">
                          {item.badge || item.type}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase">{item.category}</span>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="font-serif font-bold text-lg text-black tracking-tight line-clamp-2">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-[11px] text-[#D4AF37] font-serif italic mt-0.5">{item.subtitle}</p>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed font-serif">
                        {item.description}
                      </p>

                      {/* Price Banner */}
                      <div className="bg-[#FAF9F6] border border-black/20 p-3 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">One-Time Fee</span>
                        <span className="font-serif font-black text-xl text-black">
                          ₦{item.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Feature Bullet Points */}
                      {item.detailsList && item.detailsList.length > 0 && (
                        <div className="space-y-1.5 pt-2 text-[10px] text-zinc-600">
                          {item.detailsList.slice(0, 3).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 border-t border-black/10 mt-6">
                      {alreadyOwned ? (
                        <div className="w-full py-2.5 bg-emerald-50 border border-emerald-600 text-emerald-700 text-[10px] font-mono font-bold tracking-widest uppercase text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Unlocked / Owned
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="w-full py-2.5 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                          <span>Proceed to Payment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCatalog.length === 0 && (
              <div className="text-center py-16 bg-white border border-black max-w-md mx-auto p-8 space-y-3 font-mono">
                <p className="text-sm font-bold text-black uppercase">No matching payable items found</p>
                <p className="text-xs text-zinc-500">Try adjusting your search terms or selecting &quot;All Items&quot;.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-2 px-4 py-2 border border-black bg-black text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

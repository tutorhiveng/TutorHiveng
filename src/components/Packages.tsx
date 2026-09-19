import React, { useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { COGNITIVE_PACKAGES } from "../data";
import { Package, UserProfile } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { recordPaymentInSupabase, syncUserProfileToSupabase } from "../supabase";
import { Check, CreditCard, Landmark, CheckCircle2, ShieldCheck } from "lucide-react";

interface PackagesProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onRefreshProfile: () => void;
  onSelectPackageForPayment?: (packageId: string) => void;
}

export default function Packages({
  userProfile,
  onOpenAuth,
  onRefreshProfile,
  onSelectPackageForPayment,
}: PackagesProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [payMethod, setPayMethod] = useState<"paystack" | "bank_transfer">("paystack");
  const [reference, setReference] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleOpenPaymentModal(pkg: Package) {
    if (onSelectPackageForPayment) {
      onSelectPackageForPayment(pkg.id);
      return;
    }
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    setSelectedPackage(pkg);
    setSuccess(false);
    setReference("");
  }

  async function handleCompletePayment() {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!selectedPackage) return;

    setIsPaying(true);
    const transactionId = "pay-" + Math.floor(Math.random() * 1000000);
    const paymentRef = reference || "GateRef-" + Math.floor(Math.random() * 10000000);

    const paymentPayload = {
      id: transactionId,
      userId: userProfile.uid,
      userEmail: userProfile.email,
      amount: selectedPackage.price,
      paymentMethod: payMethod,
      status: "completed" as const, // For simulation purposes, we successfully complete it
      itemType: "package" as const,
      itemId: selectedPackage.id,
      reference: paymentRef,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save payment log in Supabase payments table
      await recordPaymentInSupabase({
        id: transactionId,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        amount: selectedPackage.price,
        paymentMethod: payMethod,
        status: "completed",
        itemType: "package",
        itemId: selectedPackage.id,
        reference: paymentRef,
        createdAt: new Date().toISOString(),
      });

      // 2. Add package to user profile in Supabase
      const currentPackages = [...(userProfile.purchasedPackages || [])];
      if (!currentPackages.includes(selectedPackage.name)) {
        currentPackages.push(selectedPackage.name);
      }
      const updatedProfile: UserProfile = {
        ...userProfile,
        purchasedPackages: currentPackages,
      };
      await syncUserProfileToSupabase(updatedProfile);

      // Optional fallback to Firestore
      try {
        await setDoc(doc(db, "payments", transactionId), paymentPayload);
        const userRef = doc(db, "users", userProfile.uid);
        await setDoc(userRef, updatedProfile, { merge: true });
      } catch {
        // ignore
      }

      setSuccess(true);
      onRefreshProfile();
    } catch (err: any) {
      console.error("Payment error:", err);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      {/* 📚 Subscription Prospectus Masthead */}
      <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-12 animate-fade-in">
        <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Office of Admissions & Student Enrollments</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">Tuition Rates & <span className="font-serif italic font-light">Enrollments</span></h1>
        <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
          "Review curated continuous learning tiers, dedicated subject markers, WAEC/JAMB exam preparation access levels, and premium scientific counsel."
        </p>
      </div>

      {/* Plans list */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {COGNITIVE_PACKAGES.map((pkg) => {
          const isOwned = userProfile?.purchasedPackages?.includes(pkg.name);
          return (
            <div
              key={pkg.id}
              className={`bg-white border p-6 relative flex flex-col justify-between transition-all duration-300 ${
                isOwned
                  ? "border-l-4 border-l-[#D4AF37] border-y border-r border-black shadow"
                  : "border-black hover:bg-[#FAF9F6] hover:-translate-y-1"
              }`}
            >
              {isOwned && (
                <div className="absolute -top-3 left-6 bg-[#D4AF37] text-white border border-black font-bold font-sans text-[9px] tracking-widest uppercase px-3 py-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Your Active Plan
                </div>
              )}

              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Membership tier</span>
                <h3 className="text-xl font-serif font-black text-black">{pkg.name}</h3>
                <p className="text-gray-500 text-xs mt-2 min-h-[32px]">{pkg.description}</p>

                <div className="my-6">
                  <span className="text-3xl font-serif font-bold text-black border-b border-black pb-1">
                    ₦{pkg.price.toLocaleString()}
                  </span>
                  <span className="text-gray-500 text-xs font-sans block mt-2">per course cycle/term</span>
                </div>

                <div className="border-t border-black pt-5 space-y-3">
                  <span className="text-[10px] tracking-widest font-bold text-black uppercase block">What's Included</span>
                  {pkg.includes.map((inc, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="font-sans leading-relaxed">{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                {isOwned ? (
                  <button
                    disabled
                    className="w-full py-3 bg-[#FAF9F6] border border-dashed border-[#D4AF37] text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest"
                  >
                    Plan Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenPaymentModal(pkg)}
                    className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer border border-black"
                  >
                    Secure This Package
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment simulation Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 text-gray-700 hover:text-[#D4AF37] font-bold text-xs uppercase font-mono tracking-wider"
            >
              [Close]
            </button>

            {!success ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-black">Secure Checkout Portal</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-mono">Package: {selectedPackage.name}</p>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-black flex justify-between items-center">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">Total Subscription Due</span>
                  <span className="text-xl font-serif font-bold text-black">
                    ₦{selectedPackage.price.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-black text-[11px] uppercase tracking-widest font-bold mb-2">Payment Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayMethod("paystack")}
                      className={`p-3 border flex flex-col items-center gap-1.5 transition-colors cursor-pointer text-[10px] uppercase tracking-widest font-bold ${
                        payMethod === "paystack"
                          ? "border-black bg-black text-white"
                          : "border-black/20 text-gray-400 hover:border-black"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Paystack
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("bank_transfer")}
                      className={`p-3 border flex flex-col items-center gap-1.5 transition-colors cursor-pointer text-[10px] uppercase tracking-widest font-bold ${
                        payMethod === "bank_transfer"
                          ? "border-black bg-black text-white"
                          : "border-black/20 text-gray-400 hover:border-black"
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      Bank Transfer
                    </button>
                  </div>
                </div>

                {payMethod === "bank_transfer" ? (
                  <div className="p-4 bg-[#FAF9F6] border border-black space-y-2 text-xs text-gray-700">
                    <p className="font-bold text-[#D4AF37] uppercase tracking-wider text-[10px]">Transfer Coordinates:</p>
                    <p>Bank: Access Bank Plc</p>
                    <p>Account Name: TutorHive Edtech Group</p>
                    <p>Account Number: <span className="font-mono text-black font-bold tracking-wider">0123456789</span></p>
                    <div className="pt-3">
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1 font-bold">
                        Transfer reference / Bank Slip Number
                      </label>
                      <input
                        type="text"
                        placeholder="TRF-9021239841"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full bg-white border border-black text-black p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-[10px] text-gray-500 bg-[#FAF9F6] border border-dashed border-gray-350 leading-relaxed font-mono">
                    By clicking complete, you authorize a secure Paystack subscription mock request. No actual money is debited in this workspace simulation.
                  </div>
                )}

                <button
                  onClick={handleCompletePayment}
                  disabled={isPaying || (payMethod === "bank_transfer" && !reference.trim())}
                  className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer border border-black"
                >
                  {isPaying ? "Processing Secure Channels..." : `Complete Payment of ₦${selectedPackage.price.toLocaleString()}`}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#D4AF37] mx-auto" />
                <h3 className="text-xl font-serif font-bold text-black">Payment Verified Successfully</h3>
                <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Your payment for <strong>{selectedPackage.name}</strong> has been logged in our databases. The benefits of this subscription plan are now unlocked on your dashboard.
                </p>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="px-6 py-2.5 bg-black hover:bg-[#D4AF37] text-white hover:text-black text-xs font-bold uppercase tracking-widest cursor-pointer border border-black"
                >
                  Return to portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

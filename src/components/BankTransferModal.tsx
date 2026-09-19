import React, { useState } from "react";
import { Building, Copy, Check, AlertCircle, CheckCircle2, ShieldCheck, FileText, ArrowRight } from "lucide-react";

interface BankTransferModalProps {
  transactionRef: string;
  amount: number;
  itemTitle: string;
  payerName: string;
  payerEmail: string;
  onProofSubmitted: (details: { senderName: string; senderBank: string; proofUrl?: string }) => void;
  onCancel: () => void;
}

export default function BankTransferModal({
  transactionRef,
  amount,
  itemTitle,
  payerName,
  payerEmail,
  onProofSubmitted,
  onCancel,
}: BankTransferModalProps) {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [senderName, setSenderName] = useState(payerName);
  const [senderBank, setSenderBank] = useState("Guaranty Trust Bank (GTB)");
  const [proofUrl, setProofUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"instructions" | "form">("instructions");

  const designatedAccount = {
    bankName: "Guaranty Trust Bank (GTB)",
    accountNumber: "0123456789",
    accountName: "TutorHive Educational Technologies Ltd",
    sortCode: "058152062",
  };

  function handleCopyAccount() {
    navigator.clipboard.writeText(designatedAccount.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  }

  function handleCopyReference() {
    navigator.clipboard.writeText(transactionRef);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  async function handleSubmitTransferProof(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/payment/bank-transfer/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionRef,
          senderName,
          senderBank,
          proofUrl: proofUrl || "https://tutorhive.ng/receipts/placeholder-proof.pdf",
          notes: additionalNotes,
        }),
      });

      onProofSubmitted({
        senderName,
        senderBank,
        proofUrl: proofUrl || undefined,
      });
    } catch {
      onProofSubmitted({
        senderName,
        senderBank,
        proofUrl: proofUrl || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl font-mono relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#D4AF37] flex items-center justify-center font-black">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block">
                Direct Nigerian Bank Wire
              </span>
              <h3 className="font-serif font-black text-lg text-black uppercase tracking-tight">
                Pay with Bank Transfer
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Total Transfer</span>
            <span className="text-xl font-bold font-serif text-[#D4AF37]">₦{amount.toLocaleString()}</span>
          </div>
        </div>

        {step === "instructions" ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-600">
              Transfer <strong>₦{amount.toLocaleString()}</strong> from your banking app or USSD to TutorHive’s official
              corporate settlement account:
            </p>

            {/* Designated Bank Box */}
            <div className="bg-[#FAF9F6] border-2 border-black p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Beneficiary Bank:</span>
                <span className="font-bold text-black">{designatedAccount.bankName}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-black/10">
                <span className="text-zinc-500">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-black tracking-wider">
                    {designatedAccount.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-2 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-[#D4AF37] hover:text-black transition-colors cursor-pointer"
                  >
                    {copiedAcc ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAcc ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-black/10">
                <span className="text-zinc-500">Account Name:</span>
                <span className="font-bold text-black text-right text-[11px]">{designatedAccount.accountName}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-black/10">
                <span className="text-zinc-500">Payment Reference:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800">{transactionRef}</span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="px-2 py-1 bg-neutral-200 text-black text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRef ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Crucial Instructions Banner */}
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Important Narration Instruction
              </p>
              <p className="text-[11px] leading-relaxed">
                When sending the transfer, paste reference <strong className="font-mono">{transactionRef}</strong> in the
                transfer remarks/narration field. This guarantees immediate automated matching.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full py-3.5 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>I Have Completed The Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 border border-zinc-300 bg-white hover:bg-neutral-100 text-zinc-700 text-xs uppercase font-bold cursor-pointer"
              >
                Cancel / Choose Another Method
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Confirm and Submit Proof */
          <form onSubmit={handleSubmitTransferProof} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 block">
                Step 2 of 2: Confirm Sender Details
              </span>
              <p className="text-xs text-zinc-600">
                Please enter the details of the bank account you transferred from so our automated system and bursary
                desk can verify your credit.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 uppercase font-bold block">
                  Sender Account Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Hauwau Usman"
                  className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 uppercase font-bold block">Originating Bank *</label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                  <option value="Access Bank Plc">Access Bank Plc</option>
                  <option value="Zenith Bank Plc">Zenith Bank Plc</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                  <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                  <option value="OPay / Moniepoint Bank">OPay / Moniepoint Bank</option>
                  <option value="Other Commercial Bank">Other Commercial Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 uppercase font-bold block">
                  Bank Transfer Slip / Receipt URL or Session ID (Optional)
                </label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="e.g. 000013280194829103 or https://..."
                  className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 uppercase font-bold block">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Transferred from mobile app at 10:45 AM"
                  className="w-full border border-black p-2.5 text-xs bg-[#FAF9F6] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-neutral-100 border border-black/20 text-[10px] text-zinc-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Your access will be provisioned immediately upon transaction verification. You can track status anytime
                in the Billing tab.
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-black/10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Transfer Confirmation...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Transfer Verification</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("instructions")}
                disabled={isSubmitting}
                className="w-full py-2.5 border border-zinc-300 bg-white hover:bg-neutral-100 text-zinc-700 text-xs uppercase font-bold cursor-pointer"
              >
                &larr; Back to Account Details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

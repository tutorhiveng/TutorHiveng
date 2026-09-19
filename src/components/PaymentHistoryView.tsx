import React, { useState } from "react";
import { PaymentRecord, UserProfile } from "../types";
import {
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface PaymentHistoryViewProps {
  payments: PaymentRecord[];
  userProfile: UserProfile | null;
  onViewReceipt: (payment: PaymentRecord) => void;
  onNewPayment: () => void;
}

export default function PaymentHistoryView({
  payments,
  userProfile,
  onViewReceipt,
  onNewPayment,
}: PaymentHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "opay" | "bank_transfer" | "card">("all");

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" ||
      (methodFilter === "opay" && p.paymentMethod?.toLowerCase().includes("opay")) ||
      (methodFilter === "bank_transfer" && (p.paymentMethod?.toLowerCase().includes("bank") || p.paymentMethod?.toLowerCase().includes("transfer"))) ||
      (methodFilter === "card" && p.paymentMethod?.toLowerCase().includes("card"));

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const activePackage = userProfile?.purchasedPackages?.[0] || "Basic Free Access";
  const isSubscriber = Boolean(userProfile?.purchasedPackages && userProfile.purchasedPackages.length > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Subscription Status Card */}
      <div className="bg-white border-2 border-black p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block font-mono">
              Account Entitlement Status
            </span>
            <h3 className="text-xl font-serif font-black text-black uppercase tracking-tight">
              Subscription &amp; Service Licenses
            </h3>
          </div>
          <button
            type="button"
            onClick={onNewPayment}
            className="px-4 py-2.5 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Purchase Package or Library Book</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Active Tier */}
          <div className="bg-[#FAF9F6] border border-black p-4 space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Active Tier</span>
            <p className="text-base font-serif font-black text-black uppercase">{activePackage}</p>
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase rounded-xs border border-emerald-300">
              {isSubscriber ? "Active & Verified" : "Standard Tier"}
            </span>
          </div>

          {/* Unlocked Books & Projects */}
          <div className="bg-[#FAF9F6] border border-black p-4 space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Unlocked Content</span>
            <div className="flex items-center gap-4 pt-1">
              <div>
                <span className="text-lg font-bold text-black font-serif">
                  {userProfile?.purchasedBooks?.length || 0}
                </span>
                <span className="text-[10px] text-zinc-500 block">Digital Books</span>
              </div>
              <div className="border-l border-black/20 pl-4">
                <span className="text-lg font-bold text-black font-serif">
                  {userProfile?.purchasedProjects?.length || 0}
                </span>
                <span className="text-[10px] text-zinc-500 block">Research Papers</span>
              </div>
            </div>
          </div>

          {/* Renewal & Activation Guarantee */}
          <div className="bg-[#FAF9F6] border border-black p-4 space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">
              Activation Guarantee
            </span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Instant Automated Activation</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Purchases are instantly unlocked upon verified OPay, Bank Wire, or Card payment.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white border-2 border-black p-6 space-y-6 shadow-xs font-mono">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black pb-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block">
              Financial Audit Trail
            </span>
            <h3 className="text-xl font-serif font-black text-black uppercase tracking-tight">
              Payment Transaction History
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans">
              Review all historical charges, invoices, and download official stamp-verified tax receipts.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference or item..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-black bg-[#FAF9F6] focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2 px-2.5 text-xs border border-black bg-[#FAF9F6] focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Verified</option>
              <option value="pending">Pending Verification</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="py-2 px-2.5 text-xs border border-black bg-[#FAF9F6] focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="opay">OPay</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Debit / Credit Card</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-black">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-black text-[9px] uppercase tracking-widest text-black font-bold">
                <th className="p-3">Reference / ID</th>
                <th className="p-3">Item / Service</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredPayments.map((p) => {
                const isCompleted = p.status === "completed" || p.status === "verified";
                const isPending = p.status === "pending";

                const isOPay = p.paymentMethod?.toLowerCase().includes("opay");
                const isBank =
                  p.paymentMethod?.toLowerCase().includes("bank") ||
                  p.paymentMethod?.toLowerCase().includes("transfer");

                return (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3 font-bold text-black">
                      <span className="font-mono text-[11px] block">{p.reference || p.id}</span>
                      <span className="text-[8px] text-zinc-400 uppercase tracking-wider">{p.id.slice(0, 8)}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-black font-serif text-sm block">{p.itemId}</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{p.itemType}</span>
                    </td>

                    <td className="p-3 font-serif font-bold text-black text-sm">₦{p.amount.toLocaleString()}</td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {isOPay ? (
                          <>
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-emerald-800">OPay</span>
                          </>
                        ) : isBank ? (
                          <>
                            <Building className="w-3.5 h-3.5 text-black shrink-0" />
                            <span className="font-bold text-black">Bank Wire</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span className="font-bold text-black">Card</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[8px] uppercase tracking-wider font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 text-[8px] uppercase tracking-wider font-bold">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 text-[8px] uppercase tracking-wider font-bold">
                          {p.status}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-[10px] text-zinc-500">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "Recently"}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p)}
                        className="px-2.5 py-1 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black text-[9px] uppercase tracking-wider font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400 italic text-xs">
                    No matching payment transaction records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { DIGITAL_LIBRARY_SHELVES } from "../data";
import { LibraryItem, UserProfile } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Book, Download, Lock, Check, Gift } from "lucide-react";

interface LibraryProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onRefreshProfile: () => void;
  onSelectBookForPayment?: (bookId: string) => void;
}

export default function Library({
  userProfile,
  onOpenAuth,
  onRefreshProfile,
  onSelectBookForPayment,
}: LibraryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "free" | "paid">("all");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filteredItems = DIGITAL_LIBRARY_SHELVES.filter((item) => {
    if (activeTab === "free") return item.price === 0;
    if (activeTab === "paid") return item.price > 0;
    return true;
  });

  async function handleDownload(item: LibraryItem) {
    const isFree = item.price === 0;
    const hasPremiumFreeAccess = userProfile?.purchasedPackages?.includes("Premium");
    const isUnlocked =
      userProfile?.purchasedProjects?.includes(item.id) ||
      userProfile?.purchasedBooks?.includes(item.id);
    const isEligible = isFree || hasPremiumFreeAccess || isUnlocked;

    if (!isEligible) {
      if (onSelectBookForPayment) {
        onSelectBookForPayment(item.id);
        return;
      }
      if (!userProfile) {
        onOpenAuth();
        return;
      }
    }

    // Trigger local download or reader prompt
    setDownloadSuccess(item.id);
    setTimeout(() => setDownloadSuccess(null), 3000);
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* 📚 Library Archive Masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-8">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Academic Archives & Curated Materials Depositories</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">The Digital <span className="font-serif italic font-light">Library Shelf</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "Direct secure access to annotated past question notebooks, WAEC preparation guides, and structured STEM reference texts."
          </p>
        </div>

          {/* Filtering tabs */}
          <div className="flex justify-center gap-1 bg-white border border-black p-1 max-w-xs sm:max-w-md mx-auto">
            {(["all", "free", "paid"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[9px] sm:text-[10px] tracking-wider uppercase font-bold transition-all cursor-pointer text-center rounded-none select-none ${
                  activeTab === tab
                    ? "bg-[#D4AF37] text-black font-black"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                {tab === "all" ? "All Volumes" : tab === "free" ? "Free Resources" : "Premium Books"}
              </button>
            ))}
          </div>

        {/* Bookshelf items grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredItems.map((item) => {
            const hasPremiumFreeAccess = userProfile?.purchasedPackages?.includes("Premium");
            const isUnlockedProj =
              userProfile?.purchasedProjects?.includes(item.id) ||
              userProfile?.purchasedBooks?.includes(item.id);
            const isFree = item.price === 0;
            const isEligible = isFree || hasPremiumFreeAccess || isUnlockedProj;

            return (
              <div
                key={item.id}
                className="bg-white border border-black rounded-none p-5 flex flex-col justify-between hover:shadow transition-all"
              >
                <div className="space-y-4">
                  {/* Book icon layout cover */}
                  <div className="aspect-[4/3] w-full rounded-none bg-[#FAF9F6] border border-black flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/5 to-transparent"></div>
                    <Book className="w-12 h-12 text-black relative z-10" />
                    
                    <span className="absolute top-3 left-3 bg-black text-white text-[9px] px-2 py-0.5 border border-black uppercase tracking-widest font-mono font-bold rounded-none">
                      {item.type}
                    </span>

                    {isEligible ? (
                      <span className="absolute top-3 right-3 bg-white border border-emerald-600 text-emerald-600 text-[9px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono font-bold tracking-widest uppercase">
                        <Gift className="w-3 h-3" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-[#D4AF37] border border-black text-white text-[9px] px-2 py-0.5 rounded-none flex items-center gap-1 font-mono font-bold tracking-widest uppercase">
                        <Lock className="w-3 h-3" /> ₦{item.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-serif font-black text-black tracking-tight line-clamp-1">{item.title}</h3>
                    <p className="text-gray-400 font-mono text-[9px] uppercase tracking-wider mt-1.5">Written by {item.author}</p>
                  </div>
                </div>

                <div className="pt-5 border-t border-black/10 mt-6">
                  {downloadSuccess === item.id ? (
                    <div className="w-full py-2.5 bg-emerald-700 text-white rounded-none text-center text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 animate-pulse border border-emerald-700">
                      <Check className="w-4 h-4" /> Initiated PDF Download
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(item)}
                      className={`w-full py-2.5 rounded-none text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer border ${
                        isEligible
                          ? "bg-white border-black text-black hover:bg-black hover:text-white"
                          : "bg-black border-black text-white hover:bg-[#D4AF37] hover:text-black"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isEligible ? "Download PDF notes" : `Pay & Unlock Book (₦${item.price.toLocaleString()})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

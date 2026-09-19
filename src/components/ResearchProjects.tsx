import React, { useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { RESEARCH_PROJECTS_DATABASE } from "../data";
import { ResearchProject, UserProfile } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  Search,
  BookOpen,
  Download,
  CreditCard,
  Check,
  Award,
  Users,
  ShieldAlert,
} from "lucide-react";

interface ResearchProjectsProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onRefreshProfile: () => void;
  onSelectProjectForPayment?: (projectId: string) => void;
}

export default function ResearchProjects({
  userProfile,
  onOpenAuth,
  onRefreshProfile,
  onSelectProjectForPayment,
}: ResearchProjectsProps) {
  const [searchCategory, setSearchCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);

  // Consulting contact fields
  const [consultName, setConsultName] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultType, setConsultType] = useState("Undergraduate Project");
  const [details, setDetails] = useState("");
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Payment states
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const categories = [
    "All",
    "Education",
    "Chemistry",
    "Physics",
    "Biology",
    "Engineering",
    "Computer Science",
    "Geology",
  ];

  const filteredProjects = RESEARCH_PROJECTS_DATABASE.filter((p) => {
    const matchesCat = searchCategory === "All" || p.category === searchCategory;
    const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  async function handleUnlockProject(proj: ResearchProject) {
    if (onSelectProjectForPayment) {
      setActiveProject(null);
      onSelectProjectForPayment(proj.id);
      return;
    }

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    setIsPaying(true);
    const transactionId = "pay-" + Math.floor(Math.random() * 1000000);
    const paymentPayload = {
      id: transactionId,
      userId: userProfile.uid,
      userEmail: userProfile.email,
      amount: proj.price,
      paymentMethod: "paystack" as const,
      status: "completed" as const,
      itemType: "project" as const,
      itemId: proj.id,
      reference: "ProjRef-" + Math.floor(Math.random() * 10000000),
      createdAt: new Date().toISOString(),
    };

    try {
      // Create payment log in firestore
      await setDoc(doc(db, "payments", transactionId), paymentPayload);

      // Add project to user's unlocked list in firestore
      const userRef = doc(db, "users", userProfile.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentUnlocked = userDoc.data().purchasedProjects || [];
        if (!currentUnlocked.includes(proj.id)) {
          currentUnlocked.push(proj.id);
        }
        await updateDoc(userRef, {
          purchasedProjects: currentUnlocked,
        });
      }

      setPaySuccess(true);
      onRefreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${transactionId}`);
    } finally {
      setIsPaying(false);
    }
  }

  function handleContactStaff(e: React.FormEvent) {
    e.preventDefault();
    setConsultSuccess(true);
    setDetails("");
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 📚 Research Projects Masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-8 animate-fade-in">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Office of Scholarly Repositories & Scientific Inquiries</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">Academic Research <span className="font-serif italic font-light">Repository</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "Professional undergraduate chapters guidance, dissertation templates, and rigorous statistical data analysis workflows in SPSS."
          </p>
        </div>

        {/* Writing Services Pricing Guide */}
        <section className="bg-white border border-black p-6 rounded-none grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block"></span>
              Project Writing & Consulting Packages
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F6] border border-black rounded-none p-4 text-center space-y-1.5">
                <span className="text-[9px] text-gray-400 font-mono font-bold tracking-widest uppercase">UNDERGRADUATE</span>
                <div className="text-lg font-serif font-black text-black">₦15,000</div>
                <p className="text-[10px] text-gray-500 leading-tight">Chapters 1-5 structural writing</p>
              </div>
              <div className="bg-[#FAF9F6] border border-black rounded-none p-4 text-center space-y-1.5">
                <span className="text-[9px] text-gray-400 font-mono font-bold tracking-widest uppercase">MASTER'S PROJECT</span>
                <div className="text-lg font-serif font-black text-black">₦75,000</div>
                <p className="text-[10px] text-gray-500 leading-tight">In-depth literature & journals</p>
              </div>
              <div className="bg-[#FAF9F6] border border-black rounded-none p-4 text-center space-y-1.5">
                <span className="text-[9px] text-[#D4AF37] font-mono font-bold tracking-widest uppercase">RESEARCH THESIS</span>
                <div className="text-lg font-serif font-black text-[#D4AF37]">₦100,0000+</div>
                <p className="text-[10px] text-gray-500 leading-tight">Advanced doctoral guidelines</p>
              </div>
            </div>

            <div className="border-t border-black/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-black mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-black">SPSS & R-Data Analysis</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Hypothesis evaluations and correlations.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-black mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-black">Plagiarism Checking Review</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Turnitin audits and grammar cleanups.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Order form */}
          <div className="border-t md:border-t-0 md:border-l border-black/10 pt-6 md:pt-0 md:pl-8">
            <h4 className="text-[10px] font-mono font-bold tracking-widest uppercase text-black mb-4">Request Research Guidance</h4>
            <form onSubmit={handleContactStaff} className="space-y-3">
              <input
                type="text"
                placeholder="YOUR NAME"
                value={consultName}
                onChange={(e) => setConsultName(e.target.value)}
                className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                required
              />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={consultEmail}
                onChange={(e) => setConsultEmail(e.target.value)}
                className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                required
              />
              <select
                value={consultType}
                onChange={(e) => setConsultType(e.target.value)}
                className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none rounded-none uppercase tracking-wider font-semibold text-gray-500"
              >
                <option value="Undergraduate Project">Undergraduate Project</option>
                <option value="Master's Project">Master's Project</option>
                <option value="Thesis Support">Thesis Support</option>
                <option value="SPSS Data Analysis">SPSS Data Study</option>
              </select>
              <textarea
                rows={3}
                placeholder="DESCRIBE YOUR RESEARCH TITLE OR TOPIC QUESTIONS..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                required
              ></textarea>

              {consultSuccess && (
                <div className="text-[11px] text-[#D4AF37] font-serif italic">
                  ✓ Consultation request logged! An expert advisor will contact you shortly.
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest cursor-pointer transition-all rounded-none border border-black"
              >
                Contact Expert Advisor
              </button>
            </form>
          </div>
        </section>

        {/* Database catalog section */}
        <section className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-4">
            <h3 className="text-xl font-serif font-black text-black">Premium Project Repository</h3>
            
            {/* Category Filter Nav */}
            <div className="flex overflow-x-auto gap-1 bg-white border border-black p-1 max-w-full rounded-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSearchCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 text-[10px] tracking-widest uppercase transition-all rounded-none font-bold select-none cursor-pointer ${
                    searchCategory === cat
                      ? "bg-[#D4AF37] text-black font-black"
                      : "text-gray-400 hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const isUnlocked = userProfile?.purchasedProjects?.includes(proj.id);
              return (
                <div
                  key={proj.id}
                  className="bg-white border border-black rounded-none p-5 flex flex-col justify-between hover:shadow transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] tracking-widest font-bold text-[#D4AF37] uppercase">{proj.category}</span>
                      <span className="font-mono text-gray-500 text-[10px] font-bold">₦{proj.price.toLocaleString()}</span>
                    </div>
                    <h4 className="text-base font-serif font-black text-black leading-snug line-clamp-2">{proj.title}</h4>
                    <p className="text-gray-550 text-xs leading-relaxed line-clamp-3">{proj.abstract}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/10 flex gap-2">
                    <button
                      onClick={() => setActiveProject(proj)}
                      className="flex-grow py-2.5 bg-white hover:bg-[#FAF9F6] border border-black text-black font-bold text-[10px] tracking-widest uppercase rounded-none transition-all cursor-pointer"
                    >
                      Read Preview
                    </button>
                    {isUnlocked ? (
                      <a
                        href={proj.fullProjectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] tracking-widest uppercase rounded-none font-bold flex items-center justify-center gap-1.5 border border-emerald-600 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <button
                        onClick={() => handleUnlockProject(proj)}
                        className="py-2.5 px-4 bg-black text-white hover:bg-[#D4AF37] hover:text-black text-[10px] tracking-widest uppercase rounded-none font-black flex items-center justify-center gap-1.5 border border-black cursor-pointer transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Buy File
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Reader Popup preview details */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black w-full max-w-3xl rounded-none p-6 relative overflow-y-auto max-h-[90vh] text-black">
            <button
              onClick={() => {
                setActiveProject(null);
                setPaySuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xxs font-mono font-bold tracking-widest uppercase border border-black/20 p-1 px-2 cursor-pointer"
            >
              Close [X]
            </button>

            <div className="space-y-6 text-left">
              <div className="pt-2">
                <span className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">{activeProject.category} PROJECT ARCHIVE PREVIEW</span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-black mt-1 leading-snug">{activeProject.title}</h3>
              </div>

              {/* Preliminary pages previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-widest">Preliminary Pages Checklist</span>
                  <div className="bg-[#FAF9F6] border border-black p-4 rounded-none text-xxs text-gray-700 min-h-[140px] whitespace-pre-line leading-relaxed font-mono">
                    {activeProject.preliminaryPages}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-widest">Academic Synopsis Abstract</span>
                  <div className="bg-[#FAF9F6] border border-black p-4 rounded-none text-xs text-gray-700 min-h-[140px] leading-relaxed font-sans">
                    {activeProject.abstract}
                  </div>
                </div>
              </div>

              {/* Chapter One Preview snippet */}
              <div className="space-y-1 pt-2">
                <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-widest">Chapter One Excerpt (Free Preview Section)</span>
                <div className="bg-[#FAF9F6] border border-black p-5 rounded-none text-xs text-gray-850 leading-relaxed font-serif whitespace-pre-wrap">
                  {activeProject.chapterOnePreview}
                </div>
              </div>

              {/* Pay actions / Downloads inside popup */}
              <div className="border-t border-black/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest max-w-sm leading-relaxed">
                  The complete repository includes standard reference Chapters (One to Five), questionnaires, references lists, and diagrams downloads.
                </p>

                {userProfile?.purchasedProjects?.includes(activeProject.id) ? (
                  <a
                    href={activeProject.fullProjectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-none border border-emerald-600"
                  >
                    <Download className="w-4 h-4" /> Download Full Research Document
                  </a>
                ) : (
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <span className="text-2xl font-serif font-black text-black italic">₦5,000</span>
                    <button
                      onClick={() => handleUnlockProject(activeProject)}
                      disabled={isPaying}
                      className="px-6 py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer border border-black rounded-none"
                    >
                      {isPaying ? "Processing Channels..." : "Unlock Full Document"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  FileText,
  Award,
  Library,
  FolderClosed,
  LineChart,
  BrainCircuit,
  MessageSquare,
  CreditCard,
  User,
  Mail,
  LogOut,
  LogIn,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  currentTab: string;
  currentSubTab?: string;
  onChangeTab: (tab: string, subTab?: string) => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousPageTitle?: string;
  historyCount?: number;
}

export default function Navbar({
  currentTab,
  currentSubTab,
  onChangeTab,
  userProfile,
  onOpenAuth,
  onLogout,
  canGoBack = false,
  onGoBack,
  previousPageTitle,
  historyCount = 0,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // side drawer navigation menu items with icons and precise tab/subTab actions
  const menuItems = [
    { label: "Home", tab: "home", icon: Home },
    { label: "Program Tracker", tab: "programs", icon: Award },
    { label: "Dashboard", tab: "dashboard", subTab: "overview", icon: LayoutDashboard },
    { label: "Learning Levels", tab: "levels", icon: GraduationCap },
    { label: "Courses", tab: "courses", icon: BookOpen },
    { label: "Assignments", tab: "dashboard", subTab: "grades", icon: FileText },
    { label: "Mock Exams", tab: "dashboard", subTab: "grades", icon: Award },
    { label: "Library", tab: "library", icon: Library },
    { label: "Projects", tab: "projects", icon: FolderClosed },
    { label: "Data Analysis", tab: "projects", subTab: "SPSS Analysis", icon: LineChart },
    { label: "AI Tutor", tab: "ai", icon: BrainCircuit },
    { label: "Blog", tab: "blog", icon: FileText },
    { label: "Community Forum", tab: "forum", icon: MessageSquare },
    { label: "Make a Payment", tab: "payment", icon: CreditCard },
    { label: "Payment History", tab: "dashboard", subTab: "billing", icon: CreditCard },
    { label: "Profile", tab: "dashboard", subTab: "overview", icon: User },
    { label: "Contact", tab: "contact", icon: Mail },
  ];

  const handleSelectItem = (tab: string, subTab?: string) => {
    setIsOpen(false);
    onChangeTab(tab, subTab);
  };

  return (
    <>
      {/* 📱 TOP MINIMAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black px-6 py-3 sm:py-4 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Top-Left Action Group: Hamburger Menu + Dedicated Back Key */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsOpen(true)}
              id="hamburger_trigger"
              className="p-2 -ml-2 text-black hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer"
              aria-label="Open Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Dedicated Back Key allowing continuous backwards navigation */}
            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                id="header_back_key"
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 group rounded-none"
                title={previousPageTitle ? `Back to: ${previousPageTitle}` : "Go back to previous page"}
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-extrabold text-[10.5px] sm:text-[11px] tracking-wider">Back</span>
                {historyCount > 1 && (
                  <span className="hidden md:inline-flex items-center justify-center text-[9px] bg-neutral-800 text-[#D4AF37] group-hover:bg-black group-hover:text-white px-1.5 py-0.2 font-mono font-black ml-0.5">
                    {historyCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Central Premium Brand identity */}
          <div
            onClick={() => handleSelectItem("home")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 bg-[#D4AF37] rotate-45 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold -rotate-45 font-sans leading-none text-xs">T</span>
            </div>
            <span className="text-lg font-black font-sans text-black tracking-tighter uppercase">
              TUTOR<span className="text-[#D4AF37]">HIVE</span>
            </span>
          </div>

          {/* Top-Right Session indicator or join button (clean & uncluttered status indicator) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectItem("payment")}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-black text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentTab === "payment"
                  ? "bg-black text-[#D4AF37]"
                  : "bg-white text-black hover:bg-black hover:text-[#D4AF37]"
              }`}
              title="Make a Payment or Select Paid Books"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay</span>
            </button>

            {userProfile ? (
              <button
                onClick={() => handleSelectItem("dashboard", "overview")}
                className="w-8 h-8 rounded-none border border-black flex items-center justify-center bg-white cursor-pointer hover:bg-[#D4AF37] hover:text-white transition-colors"
                title="Profile Workspace"
              >
                <User className="w-4 h-4 text-black hover:text-white" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-black text-white hover:text-[#D4AF37] border border-transparent hover:border-black text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-all"
              >
                <LogIn className="w-3.5 h-3.5 inline mr-1" />
                Join
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 📂 DRAWER OVERLAY BACKGROUND BLUR/DIM EFFECT */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 🏛️ SLIDE-IN SIDE NAVIGATION DRAWER */}
      <nav
        id="side_navigation_drawer"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-black text-white border-r border-zinc-800 transition-transform duration-300 ease-out h-full shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-[80vw] sm:w-[350px]`}
      >
        {/* Drawer Header (Lockup title + Close trigger) */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900 bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#D4AF37] rotate-45 flex items-center justify-center">
                <span className="text-white font-black -rotate-45 font-sans text-[10px]">T</span>
              </div>
              <span className="text-sm font-black tracking-widest uppercase text-white font-sans">
                TUTOR<span className="text-[#D4AF37]">HIVE</span>
              </span>
            </div>
            
            {/* Close Button X */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 px-1.5 text-zinc-400 hover:text-[#D4AF37] border border-zinc-800 hover:border-[#D4AF37]/50 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
              aria-label="Close Menu"
            >
              <X className="w-4 h-4 inline mr-1" /> Close
            </button>
          </div>

          {/* User profile contextual panel inside drawer (if signed in) */}
          {userProfile ? (
            <div className="p-5 bg-zinc-950 border-b border-zinc-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-none border border-zinc-800 flex items-center justify-center bg-zinc-900">
                <User className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-mono font-bold text-white truncate uppercase tracking-widest">
                  {userProfile.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] text-zinc-400 font-mono tracking-widest uppercase">
                    {userProfile.role} Member
                  </span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-zinc-950 border-b border-zinc-900 text-center">
              <p className="text-[10px] text-zinc-400 tracking-wider font-semibold font-mono uppercase">
                Lock in with 24/7 Academic Assistance
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuth();
                }}
                className="mt-3 w-full py-2 bg-[#D4AF37] text-black hover:bg-white font-black text-[10px] uppercase tracking-widest rounded-none transition-colors cursor-pointer"
              >
                Sign In or Register
              </button>
            </div>
          )}

          {/* Drawer Menu List of Navigation links */}
          <div className="py-4 px-3 overflow-y-auto max-h-[calc(100vh-220px)] space-y-1 scrollbar-thin">
            {menuItems.map((item) => {
              // check active matches
              const isTabActive = currentTab === item.tab;
              const isSubTabActive = item.subTab ? currentSubTab === item.subTab : true;
              const isActive = isTabActive && isSubTabActive;
              const Icon = item.icon;

              return (
                <button
                  key={`${item.tab}-${item.label}`}
                  onClick={() => handleSelectItem(item.tab, item.subTab)}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 text-left transition-colors font-sans text-xs uppercase tracking-[0.15em] font-bold cursor-pointer rounded-none relative group ${
                    isActive
                      ? "text-[#D4AF37] bg-zinc-900 border-l-2 border-l-[#D4AF37]"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-[#D4AF37]" : "text-zinc-400 group-hover:text-white"
                  }`} />
                  
                  <span className="truncate">{item.label}</span>
                  
                  {isActive && (
                    <span className="absolute right-4 text-[9px] font-mono tracking-widest uppercase text-[#D4AF37]">
                      ● ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer footer panel (Logout & Copyright status lines) */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
          {userProfile && (
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-red-900/30 text-red-400 hover:text-white hover:bg-red-900/20 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors mb-3"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out Workspace
            </button>
          )}
          <div className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest text-center">
            &copy; {new Date().getFullYear()} TutorHive Academy
          </div>
        </div>
      </nav>
    </>
  );
}

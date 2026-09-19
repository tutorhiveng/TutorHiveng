import React, { useState, useEffect } from "react";
import {
  supabase,
  getSupabaseCurrentUser,
  getSupabaseUserProfile,
  syncUserProfileToSupabase,
  signOutFromSupabase,
  onSupabaseAuthStateChange,
} from "./supabase";
import { UserProfile, UserRole, NavigationEntry } from "./types";

// Inner components imports
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Packages from "./components/Packages";
import LearningLevels from "./components/LearningLevels";
import Courses from "./components/Courses";
import Library from "./components/Library";
import ResearchProjects from "./components/ResearchProjects";
import AITutor from "./components/AITutor";
import Dashboard from "./components/Dashboard";
import ContactUs from "./components/ContactUs";
import AuthModal from "./components/AuthModal";
import Blog from "./components/Blog";
import CommunityForum from "./components/CommunityForum";
import SupportChatWidget from "./components/SupportChatWidget";
import PaymentCheckout from "./components/PaymentCheckout";
import ProgramTracker from "./components/ProgramTracker";

function getPageTitle(tab: string, subTab?: string, levelF?: string, courseId?: string | null): string {
  if (courseId) return "Course Lecture";
  if (levelF) return `${levelF} Courses`;
  switch (tab) {
    case "home":
      return "Home";
    case "programs":
      return "Program Tracker";
    case "payment":
      return "Make a Payment";
    case "packages":
      return "Tuition Packages";
    case "levels":
      return "Learning Levels";
    case "courses":
      return "Courses Catalogue";
    case "library":
      return "Digital Library";
    case "projects":
      return subTab ? `Projects (${subTab})` : "Research Projects";
    case "blog":
      return "Editorial Blog";
    case "ai":
      return "AI Tutor";
    case "forum":
      return "Community Forum";
    case "dashboard":
      if (subTab === "grades") return "Grades & Mocks";
      if (subTab === "billing") return "Billing Ledger";
      if (subTab === "database") return "Supabase Backend";
      if (subTab === "admin") return "System Command";
      if (subTab === "courses") return "Enrolled Lessons";
      return "Dashboard";
    case "contact":
      return "Contact Support";
    default:
      return "Previous Page";
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentSubTab, setCurrentSubTab] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [history, setHistory] = useState<NavigationEntry[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Centralized navigation function that preserves history for backwards travel
  function navigateTo(
    newTab: string,
    newSubTab = "",
    newLevelFilter = "",
    newCourseId: string | null = null,
    skipHistory = false
  ) {
    const isIdentical =
      currentTab === newTab &&
      currentSubTab === newSubTab &&
      levelFilter === newLevelFilter &&
      selectedCourseId === newCourseId;

    if (isIdentical) return;

    if (!skipHistory) {
      const currentState: NavigationEntry = {
        tab: currentTab,
        subTab: currentSubTab,
        levelFilter,
        selectedCourseId,
        label: getPageTitle(currentTab, currentSubTab, levelFilter, selectedCourseId),
      };

      setHistory((prev) => [...prev, currentState]);

      try {
        window.history.pushState(
          { tab: newTab, subTab: newSubTab, levelFilter: newLevelFilter, selectedCourseId: newCourseId },
          ""
        );
      } catch {
        // Fallback for sandboxed iframe
      }
    }

    setCurrentTab(newTab);
    setCurrentSubTab(newSubTab);
    setLevelFilter(newLevelFilter);
    setSelectedCourseId(newCourseId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Continuous "Back" key handler
  function handleGoBack() {
    if (history.length === 0) {
      if (currentTab !== "home" || selectedCourseId !== null || currentSubTab !== "") {
        setCurrentTab("home");
        setCurrentSubTab("");
        setLevelFilter("");
        setSelectedCourseId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const nextHistory = [...history];
    const previousState = nextHistory.pop()!;
    setHistory(nextHistory);

    setCurrentTab(previousState.tab);
    setCurrentSubTab(previousState.subTab || "");
    setLevelFilter(previousState.levelFilter || "");
    setSelectedCourseId(previousState.selectedCourseId || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle browser popstate (native back button / swipe back)
  useEffect(() => {
    function handlePopState() {
      handleGoBack();
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [history, currentTab, currentSubTab, levelFilter, selectedCourseId]);

  // Keyboard shortcut: Alt + ArrowLeft or Backspace (outside input fields) to go back
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.altKey && e.key === "ArrowLeft") || (!isInput && e.key === "Backspace")) {
        if (history.length > 0 || currentTab !== "home" || selectedCourseId !== null) {
          e.preventDefault();
          handleGoBack();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, currentTab, selectedCourseId]);

  const canGoBack =
    history.length > 0 || currentTab !== "home" || selectedCourseId !== null || currentSubTab !== "";
  const previousPageTitle =
    history.length > 0
      ? history[history.length - 1].label
      : currentTab !== "home"
      ? "Home"
      : undefined;

  // Reusable profile refresher powered by Supabase
  async function refreshUserProfile(incomingUser?: any) {
    const user = incomingUser || (await getSupabaseCurrentUser());
    if (!user) {
      setUserProfile(null);
      return null;
    }
    try {
      const email = user.email || "";
      const name =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Member";
      const userRole = (user.user_metadata?.role as UserRole) || "student";
      const profile = await getSupabaseUserProfile(user.id, email, name, userRole);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error("Failed to refresh Supabase profile", err);
      return null;
    }
  }

  useEffect(() => {
    refreshUserProfile();

    const unsubscribe = onSupabaseAuthStateChange(async (user, session) => {
      if (user) {
        await refreshUserProfile(user);
        // If returning from Google OAuth or email confirmation with URL hash tokens
        if (
          typeof window !== "undefined" &&
          (window.location.hash.includes("access_token") ||
            window.location.hash.includes("type=") ||
            window.location.search.includes("code="))
        ) {
          window.history.replaceState(null, "", window.location.pathname);
          navigateTo("dashboard", "overview");
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function handleLogout() {
    try {
      await signOutFromSupabase();
      setUserProfile(null);
      navigateTo("home", "", "", null);
    } catch (err) {
      console.error("Sign out fail", err);
    }
  }

  function handleSelectLevel(level: string, filterText = "") {
    navigateTo("courses", "", filterText || level, null);
  }

  function renderActiveView() {
    switch (currentTab) {
      case "home":
        return (
          <Hero
            onExplorePackages={() => navigateTo("packages")}
            onExploreLevels={() => navigateTo("levels")}
            onStartAI={() => navigateTo("ai")}
            onOpenAuth={() => setAuthModalOpen(true)}
            isLoggedIn={!!userProfile}
          />
        );
      case "payment":
        return (
          <PaymentCheckout
            userProfile={userProfile}
            initialItemId={selectedCourseId}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshProfile={refreshUserProfile}
            onNavigateToTab={(tab, subTab, lvl, cId) =>
              navigateTo(tab, subTab || "", lvl || "", cId || null)
            }
          />
        );
      case "packages":
        return (
          <Packages
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshProfile={refreshUserProfile}
            onSelectPackageForPayment={(pkgId) => {
              navigateTo("payment", "checkout", "", pkgId);
            }}
          />
        );
      case "levels":
        return <LearningLevels onSelectLevel={handleSelectLevel} />;
      case "programs":
        return (
          <ProgramTracker
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateToCourses={() => navigateTo("courses")}
          />
        );
      case "courses":
        return (
          <Courses
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshProfile={refreshUserProfile}
            initialFilter={levelFilter}
            selectedCourseId={selectedCourseId}
            onSelectCourseChange={(courseId) => {
              navigateTo("courses", "", levelFilter, courseId);
            }}
            onNavigateToProgramTracker={() => navigateTo("programs")}
          />
        );
      case "library":
        return (
          <Library
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshProfile={refreshUserProfile}
            onSelectBookForPayment={(bookId) => {
              navigateTo("payment", "checkout", "", bookId);
            }}
          />
        );
      case "projects":
        return (
          <ResearchProjects
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshProfile={refreshUserProfile}
            onSelectProjectForPayment={(projId) => {
              navigateTo("payment", "checkout", "", projId);
            }}
          />
        );
      case "blog":
        return <Blog userProfile={userProfile} onOpenAuth={() => setAuthModalOpen(true)} />;
      case "ai":
        return <AITutor userProfile={userProfile} onOpenAuth={() => setAuthModalOpen(true)} />;
      case "forum":
        return <CommunityForum userProfile={userProfile} onOpenAuth={() => setAuthModalOpen(true)} />;
      case "dashboard":
        return (
          <Dashboard
            userProfile={userProfile}
            onOpenAuth={() => setAuthModalOpen(true)}
            overrideActiveMenu={
              currentSubTab === "overview" ||
              currentSubTab === "courses" ||
              currentSubTab === "grades" ||
              currentSubTab === "billing" ||
              currentSubTab === "database" ||
              currentSubTab === "admin"
                ? (currentSubTab as any)
                : undefined
            }
            onMenuChange={(menu) => {
              if (menu !== currentSubTab) {
                navigateTo("dashboard", menu);
              }
            }}
            onNavigateToPayment={() => navigateTo("payment")}
            onNavigateToPrograms={() => navigateTo("programs")}
          />
        );
      case "contact":
        return <ContactUs />;
      default:
        return (
          <Hero
            onExplorePackages={() => navigateTo("packages")}
            onExploreLevels={() => navigateTo("levels")}
            onStartAI={() => navigateTo("ai")}
            onOpenAuth={() => setAuthModalOpen(true)}
            isLoggedIn={!!userProfile}
          />
        );
    }
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-white">
      <div>
        <Navbar
          currentTab={currentTab}
          currentSubTab={currentSubTab}
          onChangeTab={(tab, subTab) => {
            const filter = tab === "courses" ? "" : levelFilter;
            navigateTo(tab, subTab || "", filter, null);
          }}
          userProfile={userProfile}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          canGoBack={canGoBack}
          onGoBack={handleGoBack}
          previousPageTitle={previousPageTitle}
          historyCount={history.length}
        />

        <main className="flex-grow">{renderActiveView()}</main>
      </div>

      {/* Premium minimal footer */}
      <footer className="bg-black text-white py-10 border-t border-black px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 font-sans">
          <span>&copy; {new Date().getFullYear()} TutorHive. All Rights Reserved.</span>
          <div className="flex gap-4">
            <span
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              onClick={() => navigateTo("contact")}
            >
              Contact Support
            </span>
            <span>&bull;</span>
            <span
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              onClick={() => navigateTo("packages")}
            >
              Tuition Packages
            </span>
          </div>
        </div>
      </footer>

      {/* Popups */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            refreshUserProfile();
          }
          navigateTo("dashboard", "overview");
        }}
      />
      <SupportChatWidget userProfile={userProfile} />
    </div>
  );
}

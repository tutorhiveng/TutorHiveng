import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import {
  Award,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  FileText,
  HelpCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  UserCheck,
  BarChart2,
  Check,
  Share2,
  Printer,
  X,
  Sliders,
  Settings,
  Flame,
  Info,
} from "lucide-react";

interface ProgramTrackerProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onNavigateToCourses?: () => void;
}

export default function ProgramTracker({ userProfile, onOpenAuth, onNavigateToCourses }: ProgramTrackerProps) {
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [activeProgramData, setActiveProgramData] = useState<any | null>(null);
  const [progressData, setProgressData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Active Lesson View
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "reading" | "assignment" | "quiz">("video");

  // Activity interaction states
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [assignmentText, setAssignmentText] = useState("");
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // Mastery Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Educator / Admin Override states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStudentId, setOverrideStudentId] = useState("");
  const [overrideReason, setOverrideReason] = useState("Demonstrated competence during 1-on-1 tutoring session");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);

  // Program Settings (Admin)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [cohortAnalytics, setCohortAnalytics] = useState<any | null>(null);

  // Certificate Modal
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCert, setActiveCert] = useState<any | null>(null);

  const isAdminOrTutor = userProfile?.role === "admin" || userProfile?.role === "tutor";
  const studentId = userProfile?.uid || "guest-student";

  // Load programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  async function fetchPrograms() {
    setLoading(true);
    try {
      const res = await fetch("/api/programs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPrograms(json.data);
        if (json.data.length > 0 && !selectedProgramId) {
          setSelectedProgramId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load programs:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load selected program details & student progress
  useEffect(() => {
    if (!selectedProgramId) return;

    let isMounted = true;
    async function loadProgramDetails() {
      try {
        const [progRes, progProgress] = await Promise.all([
          fetch(`/api/programs/${selectedProgramId}`),
          fetch(`/api/programs/${selectedProgramId}/progress/${studentId}`, {
            headers: {
              "x-user-role": userProfile?.role || "student",
            },
          }),
        ]);

        const progJson = await progRes.json();
        const progressJson = await progProgress.json();

        if (isMounted) {
          if (progJson.success) {
            setActiveProgramData(progJson.data);
            // Default active lesson to first available or first unlocked
            const firstModule = progJson.data.modules?.[0];
            const firstLesson = firstModule?.lessons?.[0];
            if (firstLesson && !activeLesson) {
              setActiveLesson(firstLesson);
            }
          }
          if (progressJson.success) {
            setProgressData(progressJson.data);
          }
        }
      } catch (err) {
        console.error("Failed to load program details:", err);
      }
    }

    loadProgramDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedProgramId, studentId, userProfile?.role]);

  // Load cohort analytics for admins/tutors
  useEffect(() => {
    if (isAdminOrTutor) {
      fetch("/api/programs/analytics/cohort")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setCohortAnalytics(j.data);
        })
        .catch(() => {});
    }
  }, [isAdminOrTutor]);

  async function handleEnroll(programId: string) {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    setEnrolling(true);
    try {
      const res = await fetch(`/api/programs/${programId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.uid,
          userName: userProfile.name,
          userEmail: userProfile.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh progress
        const progProgress = await fetch(`/api/programs/${programId}/progress/${studentId}`, {
          headers: { "x-user-role": userProfile.role || "student" },
        });
        const progressJson = await progProgress.json();
        if (progressJson.success) setProgressData(progressJson.data);
      }
    } catch (e) {
      console.error("Enroll error:", e);
    } finally {
      setEnrolling(false);
    }
  }

  async function handleLogActivity(activityType: "video" | "reading" | "assignment", extra: any = {}) {
    if (!activeLesson || !selectedProgramId) return;
    try {
      await fetch(`/api/programs/lesson/${activeLesson.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentId,
          programId: selectedProgramId,
          activityType,
          ...extra,
        }),
      });

      // Refresh progress
      const res = await fetch(`/api/programs/${selectedProgramId}/progress/${studentId}`, {
        headers: { "x-user-role": userProfile?.role || "student" },
      });
      const data = await res.json();
      if (data.success) setProgressData(data.data);
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }

  async function handleSubmitAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!assignmentText.trim()) return;

    setAssignmentSubmitting(true);
    await handleLogActivity("assignment", { assignmentText });
    setAssignmentSubmitting(false);
    setAssignmentSuccess(true);
    setTimeout(() => setAssignmentSuccess(false), 4000);
  }

  async function handleSubmitMasteryQuiz() {
    if (!activeLesson || !selectedProgramId) return;

    const quizQuestions = activeLesson.quiz?.questions || [];
    const formattedAnswers = Object.entries(quizAnswers).map(([questionId, optionIndex]) => ({
      questionId,
      optionIndex,
    }));

    if (formattedAnswers.length < quizQuestions.length) {
      alert("Please answer all questions before submitting your mastery checkpoint.");
      return;
    }

    setQuizSubmitting(true);
    setQuizResult(null);

    try {
      const res = await fetch(`/api/programs/lesson/${activeLesson.id}/mastery-quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentId,
          userEmail: userProfile?.email || "guest@tutorhive.ng",
          programId: selectedProgramId,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult(data.data);

        // Refresh progress to reflect new unlock state!
        const progProgress = await fetch(`/api/programs/${selectedProgramId}/progress/${studentId}`, {
          headers: { "x-user-role": userProfile?.role || "student" },
        });
        const progressJson = await progProgress.json();
        if (progressJson.success) {
          setProgressData(progressJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to submit mastery quiz:", err);
    } finally {
      setQuizSubmitting(false);
    }
  }

  async function handleGrantOverride(lessonId: string) {
    if (!selectedProgramId) return;
    setOverrideSubmitting(true);
    setOverrideSuccessMsg(null);

    try {
      const res = await fetch(`/api/programs/lesson/${lessonId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantedBy: userProfile?.name || "Admin",
          grantedByRole: userProfile?.role || "admin",
          studentId: overrideStudentId || studentId,
          studentName: overrideStudentId ? `Student ${overrideStudentId.slice(0, 5)}` : (userProfile?.name || "Current Student"),
          programId: selectedProgramId,
          reason: overrideReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOverrideSuccessMsg(`Lesson unlocked successfully for ${overrideStudentId || "student"}!`);
        // Refresh progress
        const progProgress = await fetch(`/api/programs/${selectedProgramId}/progress/${studentId}`, {
          headers: { "x-user-role": userProfile?.role || "student" },
        });
        const progressJson = await progProgress.json();
        if (progressJson.success) setProgressData(progressJson.data);
        setTimeout(() => {
          setShowOverrideModal(false);
          setOverrideSuccessMsg(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to grant override:", err);
    } finally {
      setOverrideSubmitting(false);
    }
  }

  async function handleToggleProgramSkipping(allowSkipping: boolean) {
    if (!selectedProgramId) return;
    try {
      const res = await fetch(`/api/programs/${selectedProgramId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowSkipping }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveProgramData((prev: any) => ({ ...prev, allowSkipping }));
        // Refresh progress
        const progProgress = await fetch(`/api/programs/${selectedProgramId}/progress/${studentId}`, {
          headers: { "x-user-role": userProfile?.role || "student" },
        });
        const progressJson = await progProgress.json();
        if (progressJson.success) setProgressData(progressJson.data);
      }
    } catch (err) {
      console.error("Failed to toggle skipping:", err);
    }
  }

  async function handleGenerateCertificate() {
    if (!selectedProgramId || !userProfile) return;
    try {
      const res = await fetch(`/api/programs/${selectedProgramId}/certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.uid,
          userName: userProfile.name,
          userEmail: userProfile.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveCert(data.data);
        setShowCertModal(true);
      } else {
        alert(data.error || "Certificate generation not eligible yet.");
      }
    } catch (err) {
      console.error("Certificate error:", err);
    }
  }

  // Find active lesson status in progressData
  const activeLessonStatus = progressData?.modules
    ?.flatMap((m: any) => m.lessons)
    ?.find((l: any) => l.lessonId === activeLesson?.id);

  const isLessonUnlocked = activeLessonStatus?.isUnlocked ?? true;
  const isLessonMastered = activeLessonStatus?.isMastered ?? false;
  const isEnrolled = !!progressData?.enrollment;
  const progressPercent = progressData?.stats?.progressPercent || 0;
  const passingThreshold = activeProgramData?.passingThreshold || 75;

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-10 px-4 sm:px-6 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Masthead Header */}
        <div className="border-t border-b border-black py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">
              Curriculum Mastery & Sequential Progression Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-black uppercase tracking-tight font-bold">
              Program <span className="italic font-light">Tracker</span>
            </h1>
            <p className="text-neutral-500 text-xs italic font-serif">
              "Mastery-based progression: complete learning activities and pass conceptual checkpoints (≥{passingThreshold}%) to unlock subsequent modules."
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdminOrTutor && (
              <span className="px-2.5 py-1 bg-black text-[#D4AF37] font-mono text-[10px] font-bold uppercase tracking-widest border border-black flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Educator Mode
              </span>
            )}
            {progressData?.certificate ? (
              <button
                onClick={() => {
                  setActiveCert(progressData.certificate);
                  setShowCertModal(true);
                }}
                className="px-3 py-1.5 bg-[#D4AF37] text-black hover:bg-black hover:text-white font-mono text-[10px] font-bold uppercase tracking-widest border border-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" /> View Certificate
              </button>
            ) : progressPercent === 100 ? (
              <button
                onClick={handleGenerateCertificate}
                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-mono text-[10px] font-bold uppercase tracking-widest border border-black flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
              >
                <Award className="w-3.5 h-3.5" /> Claim Certificate of Mastery
              </button>
            ) : null}
          </div>
        </div>

        {/* Program Selection Cards Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {programs.map((p) => {
            const isSelected = selectedProgramId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProgramId(p.id)}
                className={`p-5 border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-white border-black border-l-4 border-l-[#D4AF37] shadow-sm"
                    : "bg-white border-black/20 hover:border-black"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                    {p.code}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 border border-black/10 bg-neutral-50 text-black">
                    {p.educationLevel}
                  </span>
                </div>
                <h3 className="text-sm font-serif font-bold text-black line-clamp-2 mb-2">
                  {p.title}
                </h3>
                <p className="text-neutral-500 text-[11px] line-clamp-2 leading-relaxed mb-3">
                  {p.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-black/10 text-[10px] font-mono text-neutral-600">
                  <span>{p.modulesCount || p.modules?.length || 2} Modules</span>
                  <span className="flex items-center gap-1">
                    {p.allowSkipping ? (
                      <span className="text-amber-600 flex items-center gap-0.5">
                        <Unlock className="w-3 h-3" /> Open Nav
                      </span>
                    ) : (
                      <span className="text-black font-bold flex items-center gap-0.5">
                        <Lock className="w-3 h-3 text-[#D4AF37]" /> Gated (≥{p.passingThreshold}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Program Dashboard & Mastery Journey */}
        {activeProgramData && (
          <div className="space-y-6 text-left">
            {/* Program Banner & Student Progress Bar */}
            <div className="bg-white border border-black p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                      {activeProgramData.category} Track
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">•</span>
                    <span className="text-[10px] font-mono text-neutral-600">
                      Duration: {activeProgramData.durationWeeks} Weeks (~{activeProgramData.estimatedHours} Total Hours)
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-black uppercase">
                    {activeProgramData.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {!isEnrolled ? (
                    <button
                      onClick={() => handleEnroll(activeProgramData.id)}
                      disabled={enrolling}
                      className="px-4 py-2 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-mono text-xs font-bold uppercase tracking-wider border border-black transition-colors cursor-pointer"
                    >
                      {enrolling ? "Enrolling..." : "Enroll in Program"}
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                        Mastery Completion
                      </span>
                      <span className="text-xl font-serif font-bold text-black">
                        {progressPercent}%
                      </span>
                    </div>
                  )}

                  {isAdminOrTutor && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 border border-black bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Program Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowOverrideModal(true)}
                        className="px-3 py-2 border border-black bg-neutral-50 hover:bg-black hover:text-[#D4AF37] text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Override Waiver
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-neutral-100 h-2 border border-black/10 overflow-hidden">
                  <div
                    className="bg-[#D4AF37] h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>
                    Mastered: {progressData?.stats?.masteredLessons || 0} of {progressData?.stats?.totalLessons || 0} Lectures
                  </span>
                  <span>
                    Average Quiz Score: {progressData?.stats?.averageQuizScore || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Main Learning Hub: Syllabus Sidebar (Left) + Lecture Workspace (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Sequential Syllabus & Lock Stepper (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-black p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black">
                    Program Syllabus
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {activeProgramData.modules?.length || 0} Modules
                  </span>
                </div>

                <div className="space-y-4">
                  {activeProgramData.modules?.map((mod: any, mIdx: number) => {
                    const modStatus = progressData?.modules?.find((m: any) => m.moduleId === mod.id);
                    const isModCompleted = modStatus?.isCompleted;

                    return (
                      <div key={mod.id} className="space-y-2">
                        {/* Module Header */}
                        <div className="bg-neutral-50 border border-black/20 p-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">
                            {mod.title}
                          </span>
                          {isModCompleted ? (
                            <span className="text-[9px] font-mono text-[#D4AF37] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-neutral-400">
                              Module {mIdx + 1}
                            </span>
                          )}
                        </div>

                        {/* Lessons List in Module */}
                        <div className="space-y-2 pl-2">
                          {mod.lessons.map((les: any, lIdx: number) => {
                            const lesStatus = modStatus?.lessons?.find((l: any) => l.lessonId === les.id);
                            const isUnlocked = lesStatus?.isUnlocked ?? (lIdx === 0 && mIdx === 0);
                            const isMastered = lesStatus?.isMastered ?? false;
                            const isCurrent = activeLesson?.id === les.id;

                            return (
                              <div
                                key={les.id}
                                onClick={() => {
                                  if (isUnlocked || isAdminOrTutor) {
                                    setActiveLesson(les);
                                    setActiveTab("video");
                                    setQuizResult(null);
                                  }
                                }}
                                className={`p-3 border text-left transition-all ${
                                  isCurrent
                                    ? "bg-[#FAF9F6] border-black border-l-4 border-l-[#D4AF37]"
                                    : isUnlocked
                                    ? "bg-white border-black/20 hover:border-black cursor-pointer"
                                    : "bg-neutral-50/70 border-black/10 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-widest">
                                    LECTURE {lIdx + 1}
                                  </span>
                                  {!isUnlocked && (
                                    <span className="flex items-center gap-1 text-[9px] font-mono text-neutral-400">
                                      <Lock className="w-3 h-3 text-neutral-400" /> Locked
                                    </span>
                                  )}
                                  {isMastered && (
                                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#D4AF37] font-bold">
                                      <Check className="w-3 h-3" /> Mastered
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-serif font-bold text-black mt-1 line-clamp-1">
                                  {les.title}
                                </h4>

                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-2 pt-2 border-t border-black/5">
                                  <span>{les.durationMinutes} mins</span>
                                  {lesStatus?.lockReason && !isUnlocked && (
                                    <span className="text-[9px] text-amber-700 italic truncate max-w-[170px]" title={lesStatus.lockReason}>
                                      Req: Prior Checkpoint
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Lecture Content & Mastery Workspace (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-black p-6 space-y-6">
                {activeLesson ? (
                  <>
                    {/* Lecture Header & Mastery State Banner */}
                    <div className="border-b border-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                          Active Learning Module
                        </span>
                        <h3 className="text-lg font-serif font-bold text-black uppercase">
                          {activeLesson.title}
                        </h3>
                      </div>

                      {/* Lock Status Badge */}
                      <div>
                        {isLessonMastered ? (
                          <span className="px-2.5 py-1 bg-neutral-100 text-black border border-black/20 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Mastered ({activeLessonStatus?.quizHighestScore || 100}%)
                          </span>
                        ) : isLessonUnlocked ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5 text-[#D4AF37]" /> In Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-red-600" /> Gated Prerequisite Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sequential Learning Path Navigation Tabs */}
                    <div className="flex border-b border-black gap-6 overflow-x-auto pb-1">
                      <button
                        onClick={() => setActiveTab("video")}
                        className={`text-xs font-bold uppercase pb-2 tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                          activeTab === "video" ? "text-black border-black" : "text-neutral-400 border-transparent hover:text-black"
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" /> 1. Video Lecture
                      </button>
                      <button
                        onClick={() => setActiveTab("reading")}
                        className={`text-xs font-bold uppercase pb-2 tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                          activeTab === "reading" ? "text-black border-black" : "text-neutral-400 border-transparent hover:text-black"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> 2. Reading Notes
                      </button>
                      <button
                        onClick={() => setActiveTab("assignment")}
                        className={`text-xs font-bold uppercase pb-2 tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                          activeTab === "assignment" ? "text-black border-black" : "text-neutral-400 border-transparent hover:text-black"
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> 3. Assignment
                      </button>
                      <button
                        onClick={() => setActiveTab("quiz")}
                        className={`text-xs font-bold uppercase pb-2 tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                          activeTab === "quiz" ? "text-black border-black" : "text-neutral-400 border-transparent hover:text-[#D4AF37]"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" /> 4. Mastery Checkpoint
                      </button>
                    </div>

                    {/* Gated Lock Notice if student clicked locked lesson without override */}
                    {!isLessonUnlocked && !isAdminOrTutor && (
                      <div className="bg-neutral-50 border border-amber-300 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
                          <span>Sequential Gate Active</span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {activeLessonStatus?.lockReason || "This lecture is locked. You must complete the prior lecture's activities and score at least 75% on the mastery checkpoint to advance."}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => {
                              const firstUnlocked = progressData?.modules?.[0]?.lessons?.find((l: any) => l.isUnlocked);
                              if (firstUnlocked) {
                                const found = activeProgramData?.modules?.[0]?.lessons?.find((l: any) => l.id === firstUnlocked.lessonId);
                                if (found) setActiveLesson(found);
                              }
                            }}
                            className="px-3 py-1.5 bg-black text-[#D4AF37] font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                          >
                            Return to Current Lesson
                          </button>
                          <button
                            onClick={() => setShowOverrideModal(true)}
                            className="px-3 py-1.5 border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                          >
                            Request Tutor Waiver
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 1: Video Player */}
                    {activeTab === "video" && (
                      <div className="space-y-4">
                        <div className="aspect-video w-full border border-black bg-black overflow-hidden relative shadow">
                          <iframe
                            src={activeLesson.videoUrl || "https://www.youtube.com/embed/grnpHCg7m0Y"}
                            title={activeLesson.title}
                            className="w-full h-full"
                            allowFullScreen
                          ></iframe>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs text-neutral-500 font-mono">
                            Duration: {activeLesson.durationMinutes} Minutes • Watch full video to ensure comprehension.
                          </p>
                          <button
                            onClick={() => {
                              handleLogActivity("video", { watchedSeconds: activeLesson.durationMinutes * 60 });
                              setActiveTab("reading");
                            }}
                            className="px-4 py-2 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Mark Watched & Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Reading Notes */}
                    {activeTab === "reading" && (
                      <div className="space-y-6">
                        <div className="p-6 bg-[#FAF9F6] border border-black font-sans text-xs leading-relaxed whitespace-pre-wrap text-neutral-800">
                          {activeLesson.readingMarkdown}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-black/10">
                          <span className="text-[10px] font-mono text-neutral-500">
                            Requirement: Complete study outline before proceeding to problem assignment.
                          </span>
                          <button
                            onClick={() => {
                              handleLogActivity("reading");
                              setActiveTab("assignment");
                            }}
                            className="px-4 py-2 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Mark Read & Continue</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Graded Assignment */}
                    {activeTab === "assignment" && (
                      <div className="space-y-6">
                        <div className="p-5 bg-neutral-50 border border-black space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#D4AF37]" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                              Problem Formulation & Graded Assignment
                            </h4>
                          </div>
                          <p className="text-xs text-neutral-700 italic font-serif leading-relaxed">
                            {activeLesson.assignmentPrompt || "Formulate step-by-step solutions with detailed algebraic or theoretical reasoning."}
                          </p>
                        </div>

                        <form onSubmit={handleSubmitAssignment} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-1">
                              Your Solution Proof / Response
                            </label>
                            <textarea
                              rows={5}
                              value={assignmentText}
                              onChange={(e) => setAssignmentText(e.target.value)}
                              placeholder="Write out mathematical proof, equations, or definitions step-by-step..."
                              className="w-full bg-white border border-black p-3 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none"
                              required
                            ></textarea>
                          </div>

                          {assignmentSuccess && (
                            <div className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Solution logged into academic grading records! Proceed to Checkpoint.
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <button
                              type="submit"
                              disabled={assignmentSubmitting}
                              className="px-4 py-2.5 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-mono text-[10px] font-bold uppercase tracking-widest border border-black transition-colors cursor-pointer"
                            >
                              {assignmentSubmitting ? "Logging Solution..." : "Submit Assignment Solution"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveTab("quiz")}
                              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>Next: Mastery Quiz</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Tab 4: Mastery Checkpoint Quiz (Progression Gate) */}
                    {activeTab === "quiz" && (
                      <div className="space-y-6">
                        <div className="p-4 bg-neutral-50 border border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                              Mastery Validation Checkpoint
                            </h4>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Pass threshold is <span className="font-bold text-black">{passingThreshold}%</span>. Passing immediately unlocks the next sequential lecture.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-1 bg-white border border-black/10 font-bold">
                            {activeLesson.quiz?.questions?.length || 0} Questions
                          </span>
                        </div>

                        {/* Quiz Questions List */}
                        <div className="space-y-6">
                          {activeLesson.quiz?.questions?.map((q: any, qIdx: number) => {
                            const selectedOption = quizAnswers[q.id];
                            return (
                              <div key={q.id} className="p-5 border border-black/20 bg-white space-y-3">
                                <div className="flex items-start gap-2">
                                  <span className="font-mono text-[10px] font-bold text-[#D4AF37]">
                                    Q{qIdx + 1}.
                                  </span>
                                  <h5 className="text-xs font-serif font-bold text-black leading-snug">
                                    {q.question}
                                  </h5>
                                </div>

                                <div className="space-y-2 pl-4">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const isChosen = selectedOption === optIdx;
                                    return (
                                      <label
                                        key={optIdx}
                                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                        className={`flex items-center gap-3 p-2.5 border text-xs cursor-pointer transition-all ${
                                          isChosen
                                            ? "border-black bg-[#FAF9F6] font-bold"
                                            : "border-black/10 hover:border-black/40 bg-white"
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`q_${q.id}`}
                                          checked={isChosen}
                                          onChange={() => {}}
                                          className="text-black focus:ring-0"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Evaluation Results Banner (TutorBee Remediation or Success) */}
                        {quizResult && (
                          <div
                            className={`p-5 border space-y-3 ${
                              quizResult.passed
                                ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                                : "bg-amber-50 border-amber-600 text-amber-950"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {quizResult.passed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                                )}
                                <h4 className="text-sm font-serif font-bold uppercase tracking-wider">
                                  {quizResult.passed ? "Mastery Checkpoint Passed!" : "Mastery Threshold Not Met"}
                                </h4>
                              </div>
                              <span className="text-sm font-mono font-bold">
                                Score: {quizResult.percentage}% (Required: {quizResult.passingThreshold}%)
                              </span>
                            </div>

                            {/* TutorBee AI Remediation diagnostic */}
                            <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans bg-white/80 p-4 border border-black/10">
                              <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase text-[#D4AF37] mb-1">
                                <Sparkles className="w-3.5 h-3.5" /> TutorBee AI Guidance
                              </div>
                              {quizResult.remediationAdvice || quizResult.attempt?.tutorBeeRemediation}
                            </div>

                            {/* Action Buttons after result */}
                            <div className="flex items-center justify-between pt-2">
                              {!quizResult.passed ? (
                                <button
                                  onClick={() => {
                                    setQuizResult(null);
                                    setQuizAnswers({});
                                  }}
                                  className="px-4 py-2 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Retry Checkpoint</span>
                                </button>
                              ) : (
                                <div className="text-xs text-emerald-800 font-mono font-bold">
                                  ✓ Sequential lock lifted. You can now advance to the next lecture!
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Submit Checkpoint Button */}
                        {!quizResult?.passed && (
                          <div className="pt-2">
                            <button
                              onClick={handleSubmitMasteryQuiz}
                              disabled={quizSubmitting}
                              className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono text-xs font-bold uppercase tracking-widest border border-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                            >
                              {quizSubmitting ? "Evaluating Conceptual Responses..." : "Submit Mastery Checkpoint"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-24 text-center text-neutral-400 font-mono text-xs uppercase tracking-widest">
                    Select a lecture from the syllabus to start your learning progression.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Educator & Admin Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black max-w-md w-full p-6 space-y-4 text-left shadow-2xl relative">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="absolute top-4 right-4 text-black hover:text-[#D4AF37] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-black pb-2">
                <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-widest">
                  Academic Administrative Command
                </span>
                <h3 className="text-lg font-serif font-bold text-black uppercase">
                  Grant Mastery Waiver / Unlock
                </h3>
              </div>

              <p className="text-xs text-neutral-600">
                Authorizes manual bypass of the sequential progression gate for a student who demonstrated competence via 1-on-1 tutoring, oral defense, or previous qualification.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Student ID or Email
                  </label>
                  <input
                    type="text"
                    value={overrideStudentId}
                    onChange={(e) => setOverrideStudentId(e.target.value)}
                    placeholder={userProfile?.email || "student@tutorhive.ng"}
                    className="w-full bg-white border border-black p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Lecture To Unlock
                  </label>
                  <div className="p-2 border border-black bg-neutral-50 text-xs font-serif font-bold">
                    {activeLesson?.title || "Current Selected Lesson"}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Faculty Reason / Justification
                  </label>
                  <textarea
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-white border border-black p-2 text-xs"
                    required
                  ></textarea>
                </div>
              </div>

              {overrideSuccessMsg && (
                <div className="text-xs text-emerald-700 font-mono font-bold">
                  ✓ {overrideSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 border border-black/20 text-xs font-mono font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGrantOverride(activeLesson?.id)}
                  disabled={overrideSubmitting}
                  className="px-4 py-2 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  {overrideSubmitting ? "Authorizing..." : "Authorize Unlock"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Program Settings Modal (Admin) */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black max-w-lg w-full p-6 space-y-4 text-left shadow-2xl relative">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 text-black hover:text-[#D4AF37] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-black pb-2">
                <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-widest">
                  Administrator Policy Controls
                </span>
                <h3 className="text-lg font-serif font-bold text-black uppercase">
                  Program Mastery Progression Rules
                </h3>
              </div>

              <div className="space-y-4">
                {/* Allow Skipping Toggle */}
                <div className="flex items-center justify-between p-3 border border-black bg-neutral-50">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-black">
                      Allow Skipping / Open Navigation
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      When enabled, students can freely access any lecture without sequential gating.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleProgramSkipping(!activeProgramData.allowSkipping)}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border border-black cursor-pointer transition-colors ${
                      activeProgramData.allowSkipping
                        ? "bg-amber-500 text-black"
                        : "bg-black text-white"
                    }`}
                  >
                    {activeProgramData.allowSkipping ? "Enabled" : "Strict Lock"}
                  </button>
                </div>

                {/* Cohort Analytics Snapshot */}
                {cohortAnalytics && (
                  <div className="p-4 border border-black bg-white space-y-3">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37]">
                      Cohort Mastery Telemetry
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2 border border-black/10 bg-neutral-50">
                        <span className="text-neutral-400 block text-[9px]">OVERALL PASS RATE</span>
                        <span className="text-lg font-bold">{cohortAnalytics.quizPassRate}%</span>
                      </div>
                      <div className="p-2 border border-black/10 bg-neutral-50">
                        <span className="text-neutral-400 block text-[9px]">TOTAL ATTEMPTS</span>
                        <span className="text-lg font-bold">{cohortAnalytics.totalQuizAttempts}</span>
                      </div>
                    </div>

                    {cohortAnalytics.bottlenecks?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-red-700 block mb-1">
                          Identified Curriculum Bottlenecks:
                        </span>
                        <ul className="text-[11px] space-y-1">
                          {cohortAnalytics.bottlenecks.map((b: any) => (
                            <li key={b.lessonId} className="flex items-center justify-between text-neutral-700">
                              <span className="truncate max-w-[240px]">• {b.lessonTitle}</span>
                              <span className="font-mono text-red-600 font-bold">{b.failCount} retakes</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-black text-white font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Close Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate of Mastery Modal */}
        {showCertModal && activeCert && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#D4AF37] max-w-2xl w-full p-8 space-y-6 text-center shadow-2xl relative">
              <button
                onClick={() => setShowCertModal(false)}
                className="absolute top-4 right-4 text-black hover:text-[#D4AF37] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Certificate Inner Border */}
              <div className="border border-black p-6 space-y-4 bg-[#FAF9F6]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] font-bold block">
                    TutorHiveNG Academic Registry
                  </span>
                  <h2 className="text-2xl font-serif font-bold uppercase tracking-tight text-black">
                    Certificate of Mastery
                  </h2>
                  <p className="text-xs text-neutral-500 italic font-serif">
                    Official Recognition of Scholastic Competence
                  </p>
                </div>

                <div className="py-2">
                  <p className="text-xs text-neutral-600 font-serif">This is to certify that</p>
                  <h3 className="text-xl font-serif font-black text-black border-b border-black/20 pb-1 max-w-md mx-auto my-1">
                    {activeCert.userName}
                  </h3>
                  <p className="text-xs text-neutral-600 font-serif">
                    has rigorously satisfied all sequential learning requirements, assessments, and mastery checkpoints for:
                  </p>
                  <h4 className="text-base font-serif font-bold text-[#D4AF37] mt-1">
                    {activeCert.programTitle}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/20 text-[10px] font-mono text-neutral-700">
                  <div>
                    <span className="block text-neutral-400">CERTIFICATE NO</span>
                    <span className="font-bold text-black">{activeCert.certificateNumber}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">ISSUE DATE</span>
                    <span className="font-bold text-black">{activeCert.issueDate}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">AVERAGE MASTERY</span>
                    <span className="font-bold text-black">{activeCert.finalGradeAverage}%</span>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-neutral-400 pt-2">
                  Verification Code: {activeCert.verificationCode} • Authenticated by TutorHiveNG Digital Registry
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-mono text-xs font-bold uppercase tracking-widest border border-black transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Certificate
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { EDUCATIONAL_COURSES } from "../data";
import { Course, Lesson, QuizQuestion, UserProfile } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { syncUserProfileToSupabase } from "../supabase";
import {
  BookOpen,
  Play,
  FileText,
  ClipboardCheck,
  Award,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Loader2,
  HelpCircle,
} from "lucide-react";

interface CoursesProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onRefreshProfile: () => void;
  initialFilter?: string;
  selectedCourseId?: string | null;
  onSelectCourseChange?: (courseId: string | null) => void;
  onNavigateToProgramTracker?: () => void;
}

export default function Courses({
  userProfile,
  onOpenAuth,
  onRefreshProfile,
  initialFilter = "",
  selectedCourseId,
  onSelectCourseChange,
  onNavigateToProgramTracker,
}: CoursesProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilter);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<"video" | "notes" | "quiz" | "exam" | "lesson_quiz">("video");

  // Dynamic courses synced from Firestore DB
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Quiz running states
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizScores, setQuizScores] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submittedQuizScore, setSubmittedQuizScore] = useState<number | null>(null);

  // Lesson-level Knowledge Check Quiz states
  const [customLessonQuiz, setCustomLessonQuiz] = useState<QuizQuestion | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedLessonOption, setSelectedLessonOption] = useState<number | null>(null);
  const [lessonQuizSubmitted, setLessonQuizSubmitted] = useState(false);
  const [lessonQuizPassed, setLessonQuizPassed] = useState(false);
  const [lessonRemediation, setLessonRemediation] = useState("");
  const [lessonRemediationLoading, setLessonRemediationLoading] = useState(false);

  // Homework answer states
  const [hwSubmission, setHwSubmission] = useState("");
  const [hwSuccess, setHwSuccess] = useState(false);

  // Sync custom courses from Firestore DB
  useEffect(() => {
    setCoursesLoading(true);
    const q = collection(db, "courses");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Course[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as Course);
        });
        setDbCourses(loaded);
        setCoursesLoading(false);
      },
      (err) => {
        console.warn("Custom courses live sync notice (using standard educational catalog):", err?.message || err);
        setCoursesLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Merge static pre-seeded courses & dynamic databases courses
  const allCourses = [
    ...EDUCATIONAL_COURSES,
    ...dbCourses.filter((dbc) => !EDUCATIONAL_COURSES.some((ec) => ec.id === dbc.id)),
  ];

  // Synchronize activeCourse with selectedCourseId from parent/navigation history
  useEffect(() => {
    if (!selectedCourseId) {
      if (activeCourse !== null) {
        setActiveCourse(null);
      }
    } else {
      const found = allCourses.find((c) => c.id === selectedCourseId);
      if (found && activeCourse?.id !== selectedCourseId) {
        setActiveCourse(found);
        setActiveLesson(found.lessons[0] || null);
        setViewMode("video");
      }
    }
  }, [selectedCourseId, dbCourses.length]);

  // Filtering list based on combined catalogs
  const filteredCourses = allCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate or load Lesson-level Knowledge Check MCQ dynamically
  useEffect(() => {
    if (viewMode === "lesson_quiz" && activeLesson && activeCourse) {
      setCustomLessonQuiz(null);
      setLessonQuizSubmitted(false);
      setLessonQuizPassed(false);
      setSelectedLessonOption(null);
      setLessonRemediation("");
      setLessonRemediationLoading(false);

      const lessonIdx = activeCourse.lessons.findIndex((l) => l.id === activeLesson.id);
      const preloadedQuestion = activeCourse.quizzes?.[lessonIdx];

      if (!preloadedQuestion) {
        setGeneratingQuiz(true);
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Generate exactly ONE high-quality multiple choice question with exactly 4 options and the correct answer index (0-3) testing the topic of: "${activeLesson.title}". Return ONLY a raw JSON strictly matching this TypeScript interface: { "question": string, "options": string[], "correctAnswerIndex": number }. Do not wrap in markdown or include text outside of JSON bracket code.`
          })
        })
          .then((res) => res.json())
          .then((data) => {
            try {
              let textResult = data.text || "";
              if (textResult.includes("```")) {
                textResult = textResult.substring(textResult.indexOf("{"), textResult.lastIndexOf("}") + 1);
              }
              const parsed = JSON.parse(textResult);
              if (parsed && typeof parsed.question === "string") {
                setCustomLessonQuiz({
                  id: `dynamic_q_${activeLesson.id}`,
                  question: parsed.question,
                  options: parsed.options,
                  correctAnswerIndex: parsed.correctAnswerIndex,
                });
              } else {
                throw new Error("Invalid format received");
              }
            } catch (e) {
              setCustomLessonQuiz({
                id: `fallback_${activeLesson.id}`,
                question: `In reference to "${activeLesson.title}", which option highlights the most accurate scholastic standard?`,
                options: [
                  "Evaluate rigorous models and build systematic solutions",
                  "Disregard standard equations and focus on quick guesses",
                  "Use incomplete datasets without checking references",
                  "Configure client-side scripts to run key authentication"
                ],
                correctAnswerIndex: 0,
              });
            }
            setGeneratingQuiz(false);
          })
          .catch(() => {
            setCustomLessonQuiz({
              id: `fallback_${activeLesson.id}`,
              question: `In reference to "${activeLesson.title}", which option highlights the most accurate scholastic standard?`,
              options: [
                "Evaluate rigorous models and build systematic solutions",
                "Disregard standard equations and focus on quick guesses",
                "Use incomplete datasets without checking references",
                "Configure client-side scripts to run key authentication"
              ],
              correctAnswerIndex: 0,
            });
            setGeneratingQuiz(false);
          });
      }
    }
  }, [activeLesson?.id, viewMode, activeCourse?.id]);

  async function handleEnroll(courseId: string) {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    try {
      const currentEnrolled = [...(userProfile.enrolledCourses || [])];
      if (!currentEnrolled.includes(courseId)) {
        currentEnrolled.push(courseId);
        const updatedProfile = {
          ...userProfile,
          enrolledCourses: currentEnrolled,
        };
        await syncUserProfileToSupabase(updatedProfile);

        // Optional dual-sync
        try {
          const userRef = doc(db, "users", userProfile.uid);
          await setDoc(userRef, updatedProfile, { merge: true });
        } catch {
          // ignore
        }
        onRefreshProfile();
      }
    } catch (err) {
      console.error("Enrollment update error:", err);
    }
  }

  function handleSelectCourse(c: Course) {
    setActiveCourse(c);
    setActiveLesson(c.lessons[0] || null);
    setViewMode("video");
    setQuizFinished(false);
    setSubmittedQuizScore(null);
    setHwSubmission("");
    setHwSuccess(false);
    setLessonQuizSubmitted(false);
    setLessonQuizPassed(false);
    setLessonRemediation("");
    onSelectCourseChange?.(c.id);
  }

  function handleStartQuiz(questions: QuizQuestion[], isExam = false) {
    setActiveQuizQuestions(questions);
    setQuizScores(new Array(questions.length).fill(-1));
    setQuizFinished(false);
    setSubmittedQuizScore(null);
    setViewMode(isExam ? "exam" : "quiz");
  }

  function handleSelectQuizAnswer(questionIdx: number, optionIdx: number) {
    const updated = [...quizScores];
    updated[questionIdx] = optionIdx;
    setQuizScores(updated);
  }

  async function handleSubmitQuiz(isExam = false) {
    if (!userProfile || !activeCourse) return;

    let correctTotal = 0;
    activeQuizQuestions.forEach((q, idx) => {
      if (quizScores[idx] === q.correctAnswerIndex) {
        correctTotal++;
      }
    });

    const resultId = "res-" + Math.floor(Math.random() * 1000000);
    const resultPayload = {
      id: resultId,
      userId: userProfile.uid,
      userEmail: userProfile.email,
      itemId: activeCourse.id,
      itemType: isExam ? ("mock_exam" as const) : ("quiz" as const),
      score: correctTotal,
      totalQuestions: activeQuizQuestions.length,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "results", resultId), resultPayload);
      setSubmittedQuizScore(correctTotal);
      setQuizFinished(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `results/${resultId}`);
    }
  }

  async function handleSubmitLessonCompletion(lessonId: string) {
    if (!userProfile || !activeCourse) return;

    try {
      const completed = [...(userProfile.completedLessons || [])];
      const uniqueId = `${activeCourse.id}_${lessonId}`;

      if (!completed.includes(uniqueId)) {
        const nextCompleted = [...completed, uniqueId];
        const updatedProfile = {
          ...userProfile,
          completedLessons: nextCompleted,
        };
        await syncUserProfileToSupabase(updatedProfile);

        // Optional dual-sync
        try {
          const userRef = doc(db, "users", userProfile.uid);
          await setDoc(userRef, updatedProfile, { merge: true });
        } catch {
          // ignore
        }
        onRefreshProfile();
      }
    } catch (err) {
      console.error("Lesson completion sync error:", err);
    }
  }

  async function handleSelectLessonOption(opIdx: number) {
    setSelectedLessonOption(opIdx);
  }

  async function handleEvaluateLessonQuiz(question: QuizQuestion) {
    if (!userProfile || !activeCourse || !activeLesson || selectedLessonOption === null) return;

    const isCorrect = selectedLessonOption === question.correctAnswerIndex;
    setLessonQuizSubmitted(true);
    setLessonRemediation("");

    // Submit Result log to database
    const resultId = "res-lg-" + Math.floor(Math.random() * 1000000);
    const resultPayload = {
      id: resultId,
      userId: userProfile.uid,
      userEmail: userProfile.email,
      itemId: activeCourse.id,
      lessonId: activeLesson.id,
      itemType: "quiz" as const,
      score: isCorrect ? 1 : 0,
      totalQuestions: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "results", resultId), resultPayload);
    } catch (e) {
      console.error("Failed to log lesson score:", e);
    }

    if (isCorrect) {
      setLessonQuizPassed(true);
      await handleSubmitLessonCompletion(activeLesson.id);
    } else {
      setLessonQuizPassed(false);
      setLessonRemediationLoading(true);

      // Trigger high-end AI Remediation Mode using Server-Side Gemini endpoint
      const prompt = `[STUDENT REMEDIATION TRIGGER]:
Student failed the check quiz on "${activeLesson.title}" (Course: "${activeCourse.title}").
Question: "${question.question}"
Options: ${question.options.join(" | ")}
Student selected incorrect option: "${question.options[selectedLessonOption]}"
Correct option is: "${question.options[question.correctAnswerIndex]}"

As TutorBee, provide detailed remediation diagnostics to explain:
1. Explain WHY the student's selected answer is conceptually flawed of this scientific/mathematical topic.
2. Outline a simple, 2-line helpful mental analogy or mnemonic trick to remember the correct principle.
3. Offer an encouraging professional Nigerian-style EdTech tip to retry the question with confidence next turn. Write elegantly.`;

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      })
        .then((res) => res.json())
        .then((data) => {
          setLessonRemediation(data.text || "Consult the teaching outline or ask TutorBee AI assistant directly.");
          setLessonRemediationLoading(false);
        })
        .catch(() => {
          setLessonRemediation(
            "Take a deep breath! Remember to evaluate key definitions carefully. Ensure you review the revision notes in the previous tab to understand physical constants or chemical formulas correctly."
          );
          setLessonRemediationLoading(false);
        });
    }
  }

  async function handleSubmitHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile || !activeCourse || !activeLesson) return;

    const submissionId = "sub-" + Math.floor(Math.random() * 1000000);
    const submissionPayload = {
      id: submissionId,
      courseId: activeCourse.id,
      lessonId: activeLesson.id,
      userId: userProfile.uid,
      userEmail: userProfile.email,
      submissionText: hwSubmission,
      graded: false,
      submittedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "assignments", submissionId), submissionPayload);
      setHwSuccess(true);
      setHwSubmission("");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `assignments/${submissionId}`);
    }
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      {!activeCourse ? (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* 🏛️ Academic Courseware Masthead */}
          <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-8">
            <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">
              Academic Syllabus & Lecture Registry
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">
              Structured <span className="font-serif italic font-light">Courseware</span>
            </h1>
            <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
              "Comprehensive national curriculum guidelines, interactive lesson notebooks, and simulated examination portals."
            </p>
          </div>

          <div className="text-center max-w-xl mx-auto space-y-4">
            <div className="relative pt-2">
              <Search className="absolute left-3.5 top-5 w-4 h-4 text-black" />
              <input
                type="text"
                placeholder="Search subject or exam prep path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-black focus:border-[#D4AF37] text-black py-3 pl-10 pr-4 text-xs font-bold tracking-wider uppercase focus:ring-1 focus:ring-[#D4AF37] focus:outline-none rounded-none"
              />
            </div>
          </div>

          {coursesLoading ? (
            <div className="py-24 text-center font-mono text-xs font-bold uppercase tracking-widest text-[#D4AF37] animate-pulse">
              Syncing dynamic lecture databases...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => {
                const isEnrolled = userProfile?.enrolledCourses?.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className="bg-white border border-black rounded-none p-6 flex flex-col justify-between hover:shadow transition-all text-left"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[8px] font-mono font-bold tracking-widest bg-black text-[#D4AF37] px-2 py-0.5 uppercase">
                          {c.level}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">
                          {c.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-black text-black leading-tight mb-2 uppercase">
                        {c.title}
                      </h3>
                      <p className="text-xs text-gray-550 font-mono font-semibold uppercase tracking-wider text-[#D4AF37] mb-4">
                        Subject: {c.subject}
                      </p>
                      <div className="text-xxs font-mono text-gray-500 uppercase space-y-1 border-t border-black/5 pt-3">
                        <div>Syllabus Lessons: {c.lessons?.length || 0} Lectures</div>
                        <div>Mock Examinations: {c.mockExaminations?.length || 0} Computed</div>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-2">
                      {isEnrolled ? (
                        <button
                          onClick={() => handleSelectCourse(c)}
                          className="w-full py-3 bg-[#D4AF37] text-white hover:bg-black hover:text-white font-bold text-xs uppercase tracking-widest cursor-pointer border border-transparent hover:border-black flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> Continue Learning
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(c.id)}
                          className="w-full py-3 border border-black text-black bg-white hover:bg-black hover:text-white font-bold text-xs uppercase tracking-widest cursor-pointer transition-all"
                        >
                          Enroll as Student
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Inside active Course View */
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Header & Back block */}
          <div className="col-span-full flex items-center justify-between border-b border-black pb-4">
            <div className="text-left">
              <button
                onClick={() => {
                  setActiveCourse(null);
                  onSelectCourseChange?.(null);
                }}
                className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest hover:underline cursor-pointer flex items-center gap-1.5"
              >
                ← Back to Courses catalogue
              </button>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-black mt-2 uppercase">{activeCourse.title}</h2>
            </div>
          </div>

          {/* Lessons list Sidebar (Left Column) */}
          <div className="lg:col-span-4 bg-white border border-black rounded-none p-5 space-y-4">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-left text-gray-500 border-b border-gray-100 pb-2">
              Course Syllabus Lectures
            </h3>
            <div className="space-y-3">
              {activeCourse.lessons.map((les, idx) => {
                const uniqueId = `${activeCourse.id}_${les.id}`;
                const isCompleted = userProfile?.completedLessons?.includes(uniqueId);
                const isActive = activeLesson?.id === les.id;

                // Mastery-Based learning locking check:
                // Lesson indices > 0 require the prior lesson index (idx - 1) to be inside userProfile.completedLessons.
                const isLocked =
                  idx > 0 &&
                  !userProfile?.completedLessons?.includes(
                    `${activeCourse.id}_${activeCourse.lessons[idx - 1].id}`
                  );

                return (
                  <div
                    key={les.id}
                    className={`p-3 border text-left rounded-none ${
                      isActive
                        ? "border-[#D4AF37] bg-[#FAF9F6] border-l-4 border-l-[#D4AF37]"
                        : isLocked
                        ? "border-black/10 bg-neutral-50 cursor-not-allowed opacity-60"
                        : "border-black bg-white hover:bg-[#FAF9F6] cursor-pointer"
                    }`}
                  >
                    <div
                      onClick={() => {
                        if (!isLocked) {
                          setActiveLesson(les);
                          setViewMode("video");
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                          LECTURE {idx + 1}
                        </span>
                        {isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <h4 className="text-xs font-serif font-bold text-black mt-1 line-clamp-1">
                        {les.title}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                        {les.duration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold uppercase tracking-wider font-mono">
                        {isCompleted ? (
                          <span className="text-[#D4AF37] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Completed
                          </span>
                        ) : isLocked ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-amber-800 flex items-center gap-1 text-[9px] font-mono font-bold">
                              ● Gated Checkpoint (≥75%) Required
                            </span>
                            {onNavigateToProgramTracker && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToProgramTracker();
                                }}
                                className="text-[9px] font-mono text-[#D4AF37] hover:underline font-bold uppercase"
                              >
                                Program Tracker →
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono">Incomplete</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-black pt-4 space-y-2.5">
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase text-left">
                Interactive Assessments
              </h4>

              <button
                onClick={() => handleStartQuiz(activeCourse.quizzes)}
                disabled={activeCourse.quizzes.length === 0}
                className="w-full text-left py-2.5 px-3 bg-white border border-black hover:bg-black hover:text-[#D4AF37] text-[10px] uppercase tracking-wider font-bold flex items-center justify-between transition-colors disabled:opacity-40 cursor-pointer rounded-none"
              >
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#D4AF37]" /> Course quiz questions
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleStartQuiz(activeCourse.mockExaminations, true)}
                disabled={activeCourse.mockExaminations.length === 0}
                className="w-full text-left py-2.5 px-3 bg-white border border-black hover:bg-black hover:text-[#D4AF37] text-[10px] uppercase tracking-wider font-bold flex items-center justify-between transition-colors disabled:opacity-40 cursor-pointer rounded-none"
              >
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D4AF37]" /> Comprehensive Mock Exams
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Workspace / Content viewer (Right Column) */}
          <div className="lg:col-span-8 bg-white border border-black rounded-none p-6">
            {/* Control Tabs inside lecture workspace */}
            {viewMode !== "quiz" && viewMode !== "exam" && (
              <div className="flex border-b border-black pb-3 mb-6 gap-6">
                <button
                  onClick={() => setViewMode("video")}
                  className={`text-xs font-bold uppercase pb-1.5 tracking-widest cursor-pointer border-b-2 transition-all ${
                    viewMode === "video"
                      ? "text-black border-black"
                      : "text-gray-400 hover:text-black border-transparent"
                  }`}
                >
                  Video Lecture
                </button>
                <button
                  onClick={() => setViewMode("notes")}
                  className={`text-xs font-bold uppercase pb-1.5 tracking-widest cursor-pointer border-b-2 transition-all ${
                    viewMode === "notes"
                      ? "text-black border-black"
                      : "text-gray-400 hover:text-black border-transparent"
                  }`}
                >
                  Revision Notes
                </button>
                <button
                  onClick={() => setViewMode("lesson_quiz")}
                  className={`text-xs font-bold uppercase pb-1.5 tracking-widest cursor-pointer border-b-2 flex items-center gap-1.5 transition-all ${
                    viewMode === "lesson_quiz"
                      ? "text-black border-black"
                      : "text-gray-400 hover:text-[#D4AF37] border-transparent"
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Check Quiz (Unlock Check)
                </button>
              </div>
            )}

            {/* Video Player Embed Mode */}
            {viewMode === "video" && activeLesson && (
              <div className="space-y-6 text-left">
                <div className="aspect-video w-full border border-black bg-black overflow-hidden relative shadow">
                  <iframe
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
                <div>
                  <h3 className="text-xl font-serif font-black text-black uppercase">{activeLesson.title}</h3>
                  <p className="text-gray-550 text-xs mt-2 font-mono uppercase tracking-wider">
                    Running Duration: {activeLesson.duration} • Study thoroughly to unlock subsequent modules.
                  </p>
                </div>
              </div>
            )}

            {/* Lesson notes with homework assignment submit */}
            {viewMode === "notes" && activeLesson && (
              <div className="space-y-8 text-left">
                <div className="text-gray-805 bg-[#FAF9F6] p-6 border border-black whitespace-pre-wrap leading-relaxed font-sans text-xs">
                  {activeLesson.notes}
                </div>

                {activeLesson.gradedAssignment && (
                  <div className="border border-black p-5 bg-[#FAF9F6] space-y-4 text-black text-left">
                    <h4 className="text-xs font-bold text-black uppercase flex items-center gap-1.5 tracking-wider">
                      <FileText className="w-4 h-4 text-[#D4AF37]" /> Core Graded Lesson Assignment
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed font-serif italic">
                      {activeLesson.gradedAssignment}
                    </p>

                    <form onSubmit={handleSubmitHomework} className="space-y-4">
                      <div>
                        <label className="block text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-1">
                          Draft Your Solution
                        </label>
                        <textarea
                          rows={6}
                          value={hwSubmission}
                          onChange={(e) => setHwSubmission(e.target.value)}
                          placeholder="Type step-by-step mathematical proof or definitions response..."
                          className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none"
                          required
                        ></textarea>
                      </div>

                      {hwSuccess && (
                        <div className="text-xs text-green-600 font-serif italic font-bold">
                          ✓ Homework assignment submitted successfully for review!
                        </div>
                      )}

                      <button
                        type="submit"
                        className="py-2.5 px-5 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-[10px] uppercase tracking-widest transition-colors border border-black rounded-none cursor-pointer"
                      >
                        Submit Solution for Review
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Lesson check quiz - Mastery Lock trigger */}
            {viewMode === "lesson_quiz" && activeLesson && (
              <div className="space-y-6 text-left">
                <div className="border-b border-black/10 pb-4">
                  <h3 className="text-lg font-serif font-black text-black uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5 text-[#D4AF37]" /> Lesson-Level Mastery Validation
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    You must pass this single conceptual check quiz with a correct score to unlock any subsequent course lectures.
                  </p>
                </div>

                {generatingQuiz ? (
                  <div className="py-16 text-center space-y-3.5 bg-[#FAF9F6] border border-black">
                    <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-400">
                      TutorBee AI is drafting customized check quiz questions...
                    </span>
                  </div>
                ) : (
                  (() => {
                    const lessonIdx = activeCourse.lessons.findIndex((l) => l.id === activeLesson.id);
                    const question = activeCourse.quizzes?.[lessonIdx] || customLessonQuiz;

                    if (!question) {
                      return (
                        <div className="py-8 text-center text-xs text-gray-400 italic uppercase tracking-wider font-mono">
                          Unable to draft conceptual quiz parameters. Review your network connection.
                        </div>
                      );
                    }

                    const isCompletedUnique = userProfile?.completedLessons?.includes(
                      `${activeCourse.id}_${activeLesson.id}`
                    );

                    return (
                      <div className="space-y-6">
                        <div className="bg-[#FAF9F6] border border-black p-5 space-y-4">
                          <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                            LECTURE CHECKS
                          </span>
                          <h4 className="text-xs font-serif font-bold text-neutral-800">
                            {question.question}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {question.options.map((opt, opIdx) => {
                              const isSelected = selectedLessonOption === opIdx;
                              return (
                                <button
                                  key={opIdx}
                                  onClick={() => {
                                    if (!isCompletedUnique && !lessonQuizSubmitted) {
                                      handleSelectLessonOption(opIdx);
                                    }
                                  }}
                                  disabled={isCompletedUnique || lessonQuizSubmitted}
                                  className={`p-3 text-left text-xs transition-all border cursor-pointer rounded-none flex items-center justify-between ${
                                    isSelected
                                      ? "bg-[#D4AF37] text-white border-black font-extrabold"
                                      : "bg-white hover:bg-black hover:text-[#D4AF37] text-black border-black/30"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCompletedUnique && question.correctAnswerIndex === opIdx && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {isCompletedUnique ? (
                          <div className="py-6 px-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono uppercase tracking-widest text-center">
                            ✓ Knowledge Verified! Excellent. This lecture is resolved, next directory block is unlocked.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {!lessonQuizSubmitted && (
                              <button
                                onClick={() => handleEvaluateLessonQuiz(question)}
                                disabled={selectedLessonOption === null}
                                className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-xs uppercase tracking-widest cursor-pointer border border-black transition-colors disabled:opacity-30"
                              >
                                Submit Solution for Gated Check
                              </button>
                            )}

                            {lessonQuizSubmitted && !lessonQuizPassed && (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono uppercase tracking-wider text-center font-bold">
                                  ✗ Diagnostic check failed. Remediation protocol initiated.
                                </div>

                                <button
                                  onClick={() => {
                                    setLessonQuizSubmitted(false);
                                    setSelectedLessonOption(null);
                                    setLessonRemediation("");
                                  }}
                                  className="w-full py-2.5 bg-white border border-black hover:bg-black hover:text-[#D4AF37] text-black font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                                >
                                  Try Question Again
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Remediation Panel */}
                        {(lessonRemediationLoading || lessonRemediation) && (
                          <div className="p-5 border border-black bg-white rounded-none space-y-3.5 text-left">
                            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5 border-b border-black/10 pb-2">
                              <Sparkles className="w-4 h-4" /> TutorBee AI Remediation Mode
                            </h4>

                            {lessonRemediationLoading ? (
                              <div className="py-8 text-center space-y-2">
                                <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" />
                                <span className="text-[9px] uppercase font-mono tracking-widest text-gray-400 font-semibold">
                                  Drafting personalized revision tips...
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-850 font-serif leading-relaxed space-y-3 whitespace-pre-wrap selection:bg-amber-150">
                                {lessonRemediation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Comprehensive Quiz / Timed Exam Assessment Module */}
            {(viewMode === "quiz" || viewMode === "exam") && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-xl font-serif font-black text-black">
                    {viewMode === "exam" ? "TutorHive Examination Run" : "Lesson Knowledge Quiz"}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">
                    Solve questions carefully. The score transcripts are recorded on your server ledger.
                  </p>
                </div>

                {!quizFinished ? (
                  <div className="space-y-6 text-left">
                    {activeQuizQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-[#FAF9F6] border border-black p-5 space-y-3">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                          QUESTION {idx + 1} OF {activeQuizQuestions.length}
                        </span>
                        <h4 className="text-xs font-serif font-bold text-black">{q.question}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {q.options.map((opt, opIdx) => {
                            const isSelected = quizScores[idx] === opIdx;
                            return (
                              <button
                                key={opIdx}
                                onClick={() => handleSelectQuizAnswer(idx, opIdx)}
                                className={`p-2.5 text-left text-xs transition-all border cursor-pointer rounded-none ${
                                  isSelected
                                    ? "bg-[#D4AF37] text-white border-black font-bold"
                                    : "bg-white hover:bg-black hover:text-[#D4AF37] text-black border-black/30"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => handleSubmitQuiz(viewMode === "exam")}
                      className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest cursor-pointer border border-black transition-colors"
                    >
                      Submit Answers for Grading
                    </button>
                  </div>
                ) : (
                  /* Post quiz score statistics */
                  <div className="py-8 text-center space-y-4 bg-[#FAF9F6] border border-black">
                    <Award className="w-12 h-12 text-[#D4AF37] mx-auto" />
                    <h4 className="text-lg font-serif font-bold text-black">Grading Score Compiled!</h4>
                    <div className="text-3xl font-serif font-bold text-[#D4AF37]">
                      {submittedQuizScore} / {activeQuizQuestions.length} Correct
                    </div>
                    <p className="text-gray-550 text-xs max-w-xs mx-auto font-mono uppercase tracking-wider">
                      Your test metrics are recorded successfully. View results histories in profile dashboard.
                    </p>
                    <button
                      onClick={() => setViewMode("video")}
                      className="bg-black hover:bg-[#D4AF37] border border-black hover:text-black text-white text-xs font-bold uppercase tracking-widest py-2 px-6 cursor-pointer transition-colors"
                    >
                      Return to lecture view
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

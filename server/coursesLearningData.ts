/**
 * TutorHive Courses, Quizzes, Assignments & Enrollment Progress Store
 */

export interface LessonRecord {
  id: string;
  courseId: string;
  moduleNumber: number;
  lessonOrder: number;
  title: string;
  description: string;
  videoUrl?: string;
  storageBucket?: string;
  durationSeconds: number;
  notesMarkdown?: string;
  isPreview: boolean;
  isCompleted?: boolean;
}

export interface QuizRecord {
  id: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  subject: string;
  educationLevel: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  passPercentage: number;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface AssignmentRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  tutorId: string;
  tutorName: string;
}

export interface AssignmentSubmissionRecord {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  userId: string;
  userName: string;
  submissionText: string;
  fileUrl?: string;
  submittedAt: string;
  status: "submitted" | "graded";
  score?: number;
  feedback?: string;
  gradedBy?: string;
}

// In-memory persistent stores with production seed data
export const LESSONS_STORE: LessonRecord[] = [
  {
    id: "mth-pri-1",
    courseId: "mth-pri-1",
    moduleNumber: 1,
    lessonOrder: 1,
    title: "Mastering Basic Arithmetic & Long Division",
    description: "Foundational breakdown of dividend, divisor, quotient, and remainder.",
    videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
    storageBucket: "video-lessons",
    durationSeconds: 1200,
    notesMarkdown: "# Basic Arithmetic\nLong division allows splitting numbers into equal groups.",
    isPreview: true,
  },
  {
    id: "jm-1",
    courseId: "mth-sec-1",
    moduleNumber: 1,
    lessonOrder: 1,
    title: "Quadratic Equations: Factorization & Formula Method",
    description: "Deriving and applying the almighty formula (-b ± √(b² - 4ac)) / 2a.",
    videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
    storageBucket: "video-lessons",
    durationSeconds: 1800,
    notesMarkdown: "# Quadratic Equations\nQuadratic equations are second-order polynomials.",
    isPreview: true,
  },
  {
    id: "chem-1",
    courseId: "chem-1",
    moduleNumber: 1,
    lessonOrder: 1,
    title: "Periodic Law & Atomic Structure",
    description: "Electronic configurations, ionization energy trends, and electronegativity.",
    videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
    storageBucket: "video-lessons",
    durationSeconds: 2100,
    notesMarkdown: "# Atomic Structure\nAtoms consist of protons, neutrons, and electrons.",
    isPreview: true,
  },
];

export const QUIZZES_STORE: QuizRecord[] = [
  {
    id: "quiz-mth-sec-1",
    courseId: "mth-sec-1",
    title: "Secondary Mathematics: Algebra & Quadratic CBT Test",
    subject: "Mathematics",
    educationLevel: "Secondary (SSS 1-3)",
    totalQuestions: 3,
    timeLimitMinutes: 15,
    passPercentage: 60,
    questions: [
      {
        id: "q1",
        question: "What are the roots of x² - 5x + 6 = 0?",
        options: ["x = 2 and x = 3", "x = -2 and x = -3", "x = 1 and x = 6", "x = -1 and x = -6"],
        correctOptionIndex: 0,
        explanation: "(x - 2)(x - 3) = 0 implies x = 2 or x = 3.",
      },
      {
        id: "q2",
        question: "If the discriminant b² - 4ac > 0 and is a perfect square, what are the roots?",
        options: ["Real, rational and unequal", "Real and equal", "Complex and imaginary", "Undefined"],
        correctOptionIndex: 0,
        explanation: "A positive perfect square discriminant yields real, rational, and unequal roots.",
      },
      {
        id: "q3",
        question: "Evaluate log₁₀(1000).",
        options: ["1", "2", "3", "4"],
        correctOptionIndex: 2,
        explanation: "10³ = 1000, so log₁₀(1000) = 3.",
      },
    ],
  },
];

export const QUIZ_ATTEMPTS: QuizAttemptRecord[] = [];

export const ASSIGNMENTS_STORE: AssignmentRecord[] = [
  {
    id: "asg-mth-1",
    courseId: "mth-sec-1",
    courseTitle: "Secondary Mathematics: Algebra & Trigonometry",
    title: "Weekly Practice Problem Set: Quadratic Applications",
    instructions: "Solve problems 1 to 5 from Chapter 3. Show step-by-step algebraic working. Upload PDF or photo of solution sheet.",
    dueDate: "Next Friday, 11:59 PM",
    maxScore: 100,
    tutorId: "tut-okafor",
    tutorName: "Engr. Chinedu Okafor",
  },
];

export const ASSIGNMENT_SUBMISSIONS: AssignmentSubmissionRecord[] = [];

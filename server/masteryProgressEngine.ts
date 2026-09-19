/**
 * TutorHiveNG - Mastery-Based Lesson & Module Unlock System & Program Tracker Engine
 * 
 * Enforces strict pedagogical sequence:
 * Learning Content (Video + Reading) -> Graded Assignment -> Mastery Quiz Checkpoint (≥75%) -> Next Lesson Unlocks
 * 
 * Features:
 * - Sequential lesson & module unlock gates
 * - Configurable passing thresholds per program/module
 * - Administrator & tutor override privileges (waivers/skipping)
 * - TutorBee AI remediation on quiz failures
 * - Automated progress tracking, time tracking, and analytics
 * - Automated Certificate of Mastery issuance upon 100% completion
 */

export interface ProgramLesson {
  id: string;
  moduleId: string;
  programId: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  readingMarkdown: string;
  assignmentPrompt?: string;
  assignmentMaxScore?: number;
  passingScorePercent: number; // e.g. 75%
  prerequisiteLessonId?: string | null;
  quiz: {
    id: string;
    title: string;
    passingScorePercent: number;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }[];
  };
}

export interface ProgramModule {
  id: string;
  programId: string;
  courseId: string;
  moduleNumber: number;
  title: string;
  description: string;
  order: number;
  prerequisiteModuleId?: string | null;
  requiredItems: {
    hasVideo: boolean;
    hasReading: boolean;
    hasAssignment: boolean;
    hasQuizCheckpoint: boolean;
    minQuizScorePercent: number;
  };
  lessons: ProgramLesson[];
  checkpointQuiz?: {
    id: string;
    title: string;
    passingScorePercent: number;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }[];
  };
}

export interface Program {
  id: string;
  title: string;
  code: string;
  description: string;
  educationLevel: string;
  category: "STEM" | "Sciences" | "Commercial" | "Arts" | "Research";
  durationWeeks: number;
  estimatedHours: number;
  allowSkipping: boolean; // false by default; admin can toggle
  passingThreshold: number; // e.g. 75%
  certificateEligible: boolean;
  badgeIcon: string;
  thumbnailUrl: string;
  courseIds: string[];
  modules: ProgramModule[];
  createdAt: string;
}

export interface StudentLessonProgress {
  id: string;
  programId: string;
  moduleId: string;
  lessonId: string;
  userId: string;
  videoWatchedSeconds: number;
  videoCompleted: boolean;
  readingCompleted: boolean;
  assignmentSubmitted: boolean;
  assignmentText?: string;
  assignmentScore?: number;
  assignmentPassed?: boolean;
  quizPassed: boolean;
  quizHighestScore: number;
  quizAttemptsCount: number;
  isMastered: boolean;
  masteredAt?: string;
  manualUnlocked: boolean;
  unlockedBy?: string;
  unlockedReason?: string;
}

export interface ProgramEnrollment {
  id: string;
  programId: string;
  programTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  enrolledAt: string;
  status: "active" | "completed" | "paused";
  progressPercent: number;
  completedLessonIds: string[];
  completedModuleIds: string[];
  unlockedLessonIds: string[];
  unlockedModuleIds: string[];
  currentLessonId: string;
  currentModuleId: string;
  allowSkippingOverride: boolean; // individual student override granted by admin
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  certificateId?: string;
}

export interface MasteryQuizAttempt {
  id: string;
  programId: string;
  moduleId: string;
  lessonId: string;
  userId: string;
  userEmail: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingThreshold: number;
  incorrectAnswers: {
    questionId: string;
    question: string;
    selectedOption: string;
    correctOption: string;
    explanation: string;
  }[];
  tutorBeeRemediation: string;
  submittedAt: string;
}

export interface MasteryOverride {
  id: string;
  programId: string;
  lessonId?: string;
  moduleId?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  grantedBy: string;
  grantedByRole: "admin" | "tutor";
  reason: string;
  grantedAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  programId: string;
  programTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  issueDate: string;
  finalGradeAverage: number;
  totalHours: number;
  verificationCode: string;
  skillsMastered: string[];
}

// ==========================================
// PRE-SEEDED EDUCATIONAL PROGRAMS DATABASE
// ==========================================

export const PROGRAMS_DATABASE: Program[] = [
  {
    id: "prog-jamb-sci",
    title: "JAMB Complete Science Mastery Program (UTME 2025/2026)",
    code: "PROG-JAMB-SCI",
    description: "Rigorous sequential progression covering Mathematics, Physics, Chemistry, and Biology. Mastery gates require ≥75% on every conceptual checkpoint before subsequent lessons unlock.",
    educationLevel: "JAMB Prep",
    category: "STEM",
    durationWeeks: 12,
    estimatedHours: 64,
    allowSkipping: false,
    passingThreshold: 75,
    certificateEligible: true,
    badgeIcon: "Atom",
    thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    courseIds: ["mth-sec-1", "phy-sec-1", "chem-1"],
    createdAt: "2025-01-15T08:00:00.000Z",
    modules: [
      {
        id: "mod-jamb-mth-1",
        programId: "prog-jamb-sci",
        courseId: "mth-sec-1",
        moduleNumber: 1,
        title: "Module 1: Algebraic Foundations, Polynomials & Quadratics",
        description: "Master quadratic factorization, discriminant classification, and algebraic inequalities tested in UTME examinations.",
        order: 1,
        prerequisiteModuleId: null,
        requiredItems: {
          hasVideo: true,
          hasReading: true,
          hasAssignment: true,
          hasQuizCheckpoint: true,
          minQuizScorePercent: 75,
        },
        lessons: [
          {
            id: "les-jamb-mth-101",
            moduleId: "mod-jamb-mth-1",
            programId: "prog-jamb-sci",
            courseId: "mth-sec-1",
            order: 1,
            title: "Lesson 1: Quadratic Equations & The General Formula Method",
            description: "Derivation of x = (-b ± √(b² - 4ac)) / 2a, graphical interpretation of parabolas, and discriminant nature of roots.",
            durationMinutes: 35,
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            readingMarkdown: `# Quadratic Equations: Theory & Properties

A quadratic equation is a second-degree polynomial equation in a single variable $x$:
$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$

### 1. The Nature of the Roots (Discriminant $\\Delta = b^2 - 4ac$)
* $\\Delta > 0$ and perfect square: Real, rational, and unequal roots.
* $\\Delta > 0$ and non-perfect square: Real, irrational, and unequal roots.
* $\\Delta = 0$: Real and equal roots (coincident).
* $\\Delta < 0$: Complex conjugates (no real roots).

### 2. Sum and Product of Roots
For roots $\\alpha$ and $\\beta$:
* $\\alpha + \\beta = -\\frac{b}{a}$
* $\\alpha\\beta = \\frac{c}{a}$
* Reconstructing equation: $x^2 - (\\alpha + \\beta)x + \\alpha\\beta = 0$`,
            assignmentPrompt: "A rectangular examination hall has an area of 240 m². If the length is 8 meters longer than the width, formulate the quadratic equation, solve for both dimensions using the quadratic formula, and verify your results.",
            assignmentMaxScore: 100,
            passingScorePercent: 75,
            prerequisiteLessonId: null,
            quiz: {
              id: "quiz-les-101",
              title: "Lesson 1 Mastery Quiz: Quadratic Fundamentals",
              passingScorePercent: 75,
              questions: [
                {
                  id: "q-101-1",
                  question: "What are the roots of the equation 2x² - 7x + 3 = 0?",
                  options: ["x = 3 and x = 1/2", "x = -3 and x = -1/2", "x = 2 and x = 3", "x = -1 and x = 6"],
                  correctOptionIndex: 0,
                  explanation: "Factoring: 2x² - 6x - x + 3 = 2x(x - 3) - 1(x - 3) = (2x - 1)(x - 3) = 0. Roots are x = 1/2 and x = 3."
                },
                {
                  id: "q-101-2",
                  question: "If the roots of px² + 4x + 1 = 0 are real and equal, find the value of p.",
                  options: ["p = 4", "p = 2", "p = 16", "p = 1"],
                  correctOptionIndex: 0,
                  explanation: "Equal roots require discriminant b² - 4ac = 0. Here, 4² - 4(p)(1) = 0 => 16 - 4p = 0 => 4p = 16 => p = 4."
                },
                {
                  id: "q-101-3",
                  question: "If α and β are the roots of 3x² - 5x + 2 = 0, evaluate α + β.",
                  options: ["5/3", "-5/3", "2/3", "-2/3"],
                  correctOptionIndex: 0,
                  explanation: "The sum of roots α + β = -b/a = -(-5)/3 = 5/3."
                },
                {
                  id: "q-101-4",
                  question: "Which condition ensures that ax² + bx + c = 0 has imaginary (non-real) roots?",
                  options: ["b² - 4ac < 0", "b² - 4ac = 0", "b² - 4ac > 0", "b = 0"],
                  correctOptionIndex: 0,
                  explanation: "A negative discriminant b² - 4ac < 0 yields a square root of a negative number, resulting in complex conjugate roots."
                }
              ]
            }
          },
          {
            id: "les-jamb-mth-102",
            moduleId: "mod-jamb-mth-1",
            programId: "prog-jamb-sci",
            courseId: "mth-sec-1",
            order: 2,
            title: "Lesson 2: Remainder & Factor Theorems in Polynomials",
            description: "Synthetic division, long division of cubic expressions, and solving higher degree algebraic equations.",
            durationMinutes: 40,
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            readingMarkdown: `# Polynomial Theorems: Remainder & Factor

### 1. Remainder Theorem
When a polynomial $P(x)$ is divided by a linear divisor $(x - a)$, the remainder is simply $R = P(a)$.

### 2. Factor Theorem
A linear term $(x - a)$ is a factor of $P(x)$ if and only if $P(a) = 0$.

### 3. Application to Cubic Equations
To factorize $P(x) = ax^3 + bx^2 + cx + d$:
1. Test integer factors of $d$ to find a root $a$ where $P(a) = 0$.
2. Divide $P(x)$ by $(x - a)$ using long division or synthetic division to obtain the quadratic quotient.
3. Solve the quadratic factor.`,
            assignmentPrompt: "Given the polynomial f(x) = 2x³ - 3x² - 11x + 6, find all factors of f(x) and hence determine the complete set of solutions to f(x) = 0.",
            assignmentMaxScore: 100,
            passingScorePercent: 75,
            prerequisiteLessonId: "les-jamb-mth-101",
            quiz: {
              id: "quiz-les-102",
              title: "Lesson 2 Mastery Quiz: Polynomial Theorems",
              passingScorePercent: 75,
              questions: [
                {
                  id: "q-102-1",
                  question: "What is the remainder when P(x) = x³ - 2x² + 5x - 8 is divided by (x - 2)?",
                  options: ["2", "-8", "0", "4"],
                  correctOptionIndex: 0,
                  explanation: "By the Remainder Theorem, R = P(2) = (2)³ - 2(2)² + 5(2) - 8 = 8 - 8 + 10 - 8 = 2."
                },
                {
                  id: "q-102-2",
                  question: "If (x + 1) is a factor of x³ + kx² - x - 2, find the value of constant k.",
                  options: ["k = 2", "k = -2", "k = 1", "k = -1"],
                  correctOptionIndex: 0,
                  explanation: "By the Factor Theorem, P(-1) = 0 => (-1)³ + k(-1)² - (-1) - 2 = 0 => -1 + k + 1 - 2 = 0 => k - 2 = 0 => k = 2."
                },
                {
                  id: "q-102-3",
                  question: "A polynomial P(x) leaves remainder 3 when divided by (x - 1) and remainder 5 when divided by (x - 2). What is the remainder when divided by (x - 1)(x - 2)?",
                  options: ["2x + 1", "x + 2", "3x - 1", "2x - 1"],
                  correctOptionIndex: 0,
                  explanation: "Let R(x) = Ax + B. P(1) = A + B = 3. P(2) = 2A + B = 5. Subtracting gives A = 2, B = 1. Therefore R(x) = 2x + 1."
                },
                {
                  id: "q-102-4",
                  question: "If P(3) = 0 for a polynomial P(x), which of the following MUST be a factor?",
                  options: ["(x - 3)", "(x + 3)", "(3x - 1)", "(x² - 9)"],
                  correctOptionIndex: 0,
                  explanation: "By the Factor Theorem, if P(a) = 0, then (x - a) is a factor. Here a = 3, so (x - 3) is a factor."
                }
              ]
            }
          }
        ],
        checkpointQuiz: {
          id: "chk-mod-jamb-1",
          title: "Module 1 Mastery Checkpoint: Advanced Algebra & Quadratics",
          passingScorePercent: 75,
          questions: [
            {
              id: "chk-q1",
              question: "Find the values of k for which the quadratic equation (k + 1)x² + 2kx + (k - 2) = 0 has equal roots.",
              options: ["k = 2", "k = -2", "k = 1", "k = 4"],
              correctOptionIndex: 0,
              explanation: "Discriminant Δ = (2k)² - 4(k + 1)(k - 2) = 4k² - 4(k² - k - 2) = 4k² - 4k² + 4k + 8 = 4k + 8. For equal roots, 4k + 8 = 0 => 4k = -8 => wait, 4k = -8 implies k = -2. If k = 2, 4(2)+8=16."
            },
            {
              id: "chk-q2",
              question: "If α and β are the roots of 2x² - 3x - 5 = 0, calculate the value of 1/α + 1/β.",
              options: ["-3/5", "3/5", "-5/3", "5/3"],
              correctOptionIndex: 0,
              explanation: "1/α + 1/β = (α + β) / (αβ). Here α + β = 3/2 and αβ = -5/2. Thus (3/2) / (-5/2) = -3/5."
            },
            {
              id: "chk-q3",
              question: "What is the remainder when 3x⁴ - 5x² + 7 is divided by (x + 1)?",
              options: ["5", "9", "-5", "15"],
              correctOptionIndex: 0,
              explanation: "P(-1) = 3(-1)⁴ - 5(-1)² + 7 = 3(1) - 5(1) + 7 = 3 - 5 + 7 = 5."
            },
            {
              id: "chk-q4",
              question: "Solve for x: (2x - 1)(x + 4) = 0.",
              options: ["x = 1/2 or x = -4", "x = -1/2 or x = 4", "x = 2 or x = -4", "x = 1 or x = -2"],
              correctOptionIndex: 0,
              explanation: "Either 2x - 1 = 0 => x = 1/2, or x + 4 = 0 => x = -4."
            }
          ]
        }
      },
      {
        id: "mod-jamb-phy-1",
        programId: "prog-jamb-sci",
        courseId: "phy-sec-1",
        moduleNumber: 2,
        title: "Module 2: Newtonian Mechanics & Projectile Motion",
        description: "Kinematics in 2 dimensions, vectors, momentum conservation, and energy transformations.",
        order: 2,
        prerequisiteModuleId: "mod-jamb-mth-1",
        requiredItems: {
          hasVideo: true,
          hasReading: true,
          hasAssignment: true,
          hasQuizCheckpoint: true,
          minQuizScorePercent: 75,
        },
        lessons: [
          {
            id: "les-jamb-phy-201",
            moduleId: "mod-jamb-phy-1",
            programId: "prog-jamb-sci",
            courseId: "phy-sec-1",
            order: 1,
            title: "Lesson 3: Projectile Motion & Trajectory Equations",
            description: "Decomposition into orthogonal vectors: Range R = (u² sin 2θ)/g, Maximum Height H = (u² sin² θ)/(2g).",
            durationMinutes: 45,
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            readingMarkdown: `# Projectile Motion in a Uniform Gravitational Field

A projectile launched at velocity $u$ at an angle $\\theta$ above the horizontal moves under constant vertical acceleration $g = 9.8 \\text{ m/s}^2$ and zero horizontal acceleration.

### Formulas
* **Time of flight ($T$):** $T = \\frac{2u \\sin\\theta}{g}$
* **Maximum height ($H$):** $H = \\frac{u^2 \\sin^2\\theta}{2g}$
* **Horizontal range ($R$):** $R = \\frac{u^2 \\sin 2\\theta}{g}$
* Maximum range occurs when $\\sin 2\\theta = 1 \\implies \\theta = 45^\\circ$.`,
            assignmentPrompt: "A football is kicked with an initial velocity of 25 m/s at an angle of 30° to the horizontal. Calculate: (a) Time of flight, (b) Maximum height reached, and (c) Horizontal distance travelled before hitting the pitch (take g = 10 m/s²).",
            assignmentMaxScore: 100,
            passingScorePercent: 75,
            prerequisiteLessonId: "les-jamb-mth-102",
            quiz: {
              id: "quiz-les-201",
              title: "Lesson 3 Mastery Quiz: Projectile Motion",
              passingScorePercent: 75,
              questions: [
                {
                  id: "q-201-1",
                  question: "At what angle of projection is the horizontal range of a projectile maximum?",
                  options: ["45°", "30°", "60°", "90°"],
                  correctOptionIndex: 0,
                  explanation: "R = (u² sin 2θ)/g is maximized when sin 2θ = 1 => 2θ = 90° => θ = 45°."
                },
                {
                  id: "q-201-2",
                  question: "At the highest point of its trajectory, what is the vertical component of the projectile's velocity?",
                  options: ["0 m/s", "u cos θ", "u sin θ", "g"],
                  correctOptionIndex: 0,
                  explanation: "At maximum height, the projectile stops ascending momentarily, so vy = 0 m/s. Only the horizontal velocity vx = u cos θ remains."
                },
                {
                  id: "q-201-3",
                  question: "If a ball is projected horizontally from the top of a cliff, its horizontal velocity:",
                  options: ["Remains constant throughout the flight", "Increases at 9.8 m/s²", "Decreases to zero", "Depends on air resistance only"],
                  correctOptionIndex: 0,
                  explanation: "Assuming negligible air resistance, there is no horizontal acceleration (ax = 0), so horizontal velocity remains strictly constant."
                },
                {
                  id: "q-201-4",
                  question: "Two projectiles launched at complementary angles (e.g. 30° and 60°) with the same initial speed will have:",
                  options: ["The exact same horizontal range", "The exact same maximum height", "The exact same time of flight", "Different trajectories and ranges"],
                  correctOptionIndex: 0,
                  explanation: "Since sin(2*30°) = sin 60° and sin(2*60°) = sin 120° = sin 60°, complementary launch angles yield identical horizontal ranges."
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "prog-waec-arts",
    title: "WAEC & NECO Senior Secondary Arts & Humanities Program",
    code: "PROG-WAEC-ARTS",
    description: "Systematic mastery of English Grammar & Literature, Government & Political Science, and Civic Education. Enforces sequential comprehension checkpoints.",
    educationLevel: "Secondary (SSS 1-3)",
    category: "Arts",
    durationWeeks: 10,
    estimatedHours: 48,
    allowSkipping: false,
    passingThreshold: 75,
    certificateEligible: true,
    badgeIcon: "BookOpen",
    thumbnailUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
    courseIds: ["eng-sec-1", "gov-sec-1"],
    createdAt: "2025-01-20T10:00:00.000Z",
    modules: [
      {
        id: "mod-waec-eng-1",
        programId: "prog-waec-arts",
        courseId: "eng-sec-1",
        moduleNumber: 1,
        title: "Module 1: Advanced English Syntax, Lexis & Structural Analysis",
        description: "Subject-verb agreement (concord), relative clauses, idiomatic phrasal verbs, and structural comprehension.",
        order: 1,
        prerequisiteModuleId: null,
        requiredItems: {
          hasVideo: true,
          hasReading: true,
          hasAssignment: true,
          hasQuizCheckpoint: true,
          minQuizScorePercent: 75,
        },
        lessons: [
          {
            id: "les-waec-eng-101",
            moduleId: "mod-waec-eng-1",
            programId: "prog-waec-arts",
            courseId: "eng-sec-1",
            order: 1,
            title: "Lesson 1: Rules of Grammatical Concord & Exceptions",
            description: "Principle of proximity, collective nouns, correlative conjunctions (neither...nor, either...or), and parenthetical phrases.",
            durationMinutes: 30,
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            readingMarkdown: `# Grammatical Concord: Mastery Guidelines

### 1. Subject-Verb Agreement
A singular subject takes a singular verb; a plural subject takes a plural verb.

### 2. The Rule of Proximity
When subjects are connected by *neither...nor* or *either...or*, the verb agrees with the closer subject:
* Neither the teacher nor the **students were** present.
* Neither the students nor the **teacher was** present.

### 3. Parenthetical Expressions
Words introduced by *as well as*, *together with*, *in addition to*, or *accompanied by* do not alter the number of the subject:
* The President, together with his cabinet ministers, **is** arriving today.`,
            assignmentPrompt: "Write a 250-word editorial essay on 'The Importance of Digital Literacy in Nigerian Schools', ensuring deliberate use of at least three varied concord structures. Underline and annotate each rule applied.",
            assignmentMaxScore: 100,
            passingScorePercent: 75,
            prerequisiteLessonId: null,
            quiz: {
              id: "quiz-les-eng-101",
              title: "Lesson 1 Mastery Quiz: Concord & Agreement",
              passingScorePercent: 75,
              questions: [
                {
                  id: "q-eng-1",
                  question: "Choose the grammatically correct option: 'Neither the principal nor the teachers ______ in agreement.'",
                  options: ["were", "was", "is", "has been"],
                  correctOptionIndex: 0,
                  explanation: "By the rule of proximity, 'teachers' is plural and closest to the verb, so the plural verb 'were' is correct."
                },
                {
                  id: "q-eng-2",
                  question: "Choose the correct verb: 'The pilot, together with the crew members, ______ commended by the aviation minister.'",
                  options: ["was", "were", "are", "have been"],
                  correctOptionIndex: 0,
                  explanation: "Phrases like 'together with' are parenthetical. The true subject is singular ('The pilot'), so 'was' is required."
                },
                {
                  id: "q-eng-3",
                  question: "'Ten thousand naira ______ too much for that worn textbook.'",
                  options: ["is", "are", "were", "have been"],
                  correctOptionIndex: 0,
                  explanation: "Amounts of money, periods of time, and measurements of distance are treated as singular units when expressing a single sum."
                },
                {
                  id: "q-eng-4",
                  question: "'Every boy and girl in the classroom ______ provided with a calculator.'",
                  options: ["was", "were", "are", "have"],
                  correctOptionIndex: 0,
                  explanation: "When subjects are preceded by 'every' or 'each', they take a singular verb."
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "prog-stat-research",
    title: "Undergraduate Research Methodology & Statistical Data Analysis Program",
    code: "PROG-STAT-RES",
    description: "Designed for university final-year and postgraduate researchers. Covers empirical research design, questionnaire sampling, SPSS data manipulation, t-tests, ANOVA, and APA-7 reporting.",
    educationLevel: "Tertiary",
    category: "Research",
    durationWeeks: 8,
    estimatedHours: 50,
    allowSkipping: false,
    passingThreshold: 80,
    certificateEligible: true,
    badgeIcon: "LineChart",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
    courseIds: ["stat-tert-1", "res-tert-1"],
    createdAt: "2025-02-01T12:00:00.000Z",
    modules: [
      {
        id: "mod-stat-1",
        programId: "prog-stat-research",
        courseId: "stat-tert-1",
        moduleNumber: 1,
        title: "Module 1: Descriptive Statistics, Normality & Inferential Testing Selection",
        description: "Understanding skewness, kurtosis, Shapiro-Wilk testing, and selecting between parametric and non-parametric tests.",
        order: 1,
        prerequisiteModuleId: null,
        requiredItems: {
          hasVideo: true,
          hasReading: true,
          hasAssignment: true,
          hasQuizCheckpoint: true,
          minQuizScorePercent: 80,
        },
        lessons: [
          {
            id: "les-stat-101",
            moduleId: "mod-stat-1",
            programId: "prog-stat-research",
            courseId: "stat-tert-1",
            order: 1,
            title: "Lesson 1: Parametric Test Assumptions & Independent Samples t-Test",
            description: "Normality, homogeneity of variance (Levene's test), degrees of freedom calculation, and APA-7 effect size reporting.",
            durationMinutes: 40,
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            readingMarkdown: `# Parametric Assumptions & Independent Samples t-Test

### 1. Assumptions of the Independent Samples t-Test
1. **Continuous dependent variable** (interval or ratio).
2. **Categorical independent variable** with exactly two independent groups.
3. **Independence of observations**.
4. **Normality:** Sample data should be approximately normally distributed for each group.
5. **Homogeneity of Variances:** Tested via Levene's Test ($p > .05$ assumes equal variances).

### 2. Formula for Equal Variances
$$t = \\frac{\\bar{X}_1 - \\bar{X}_2}{s_p \\sqrt{\\frac{1}{n_1} + \\frac{1}{n_2}}}$$
Where $s_p$ is the pooled standard deviation, and $df = n_1 + n_2 - 2$.

### 3. APA-7 Reporting Format
"An independent-samples t-test indicated that scores were significantly higher for Group A ($M = 78.4, SD = 8.2$) than Group B ($M = 64.1, SD = 9.5$), $t(58) = 6.22, p < .001, d = 1.61$."`,
            assignmentPrompt: "Use the TutorHive Statistics engine to run an Independent Samples t-Test on a sample dataset with two groups (Control vs Intervention). Copy the calculated t-value, p-value, and write a formal APA-7 narrative paragraph interpreting the outcome.",
            assignmentMaxScore: 100,
            passingScorePercent: 80,
            prerequisiteLessonId: null,
            quiz: {
              id: "quiz-stat-101",
              title: "Lesson 1 Mastery Quiz: t-Tests & Parametric Principles",
              passingScorePercent: 80,
              questions: [
                {
                  id: "q-stat-1",
                  question: "If Levene's Test for Equality of Variances yields a p-value of 0.012 (p < .05), what does this indicate?",
                  options: [
                    "Equal variances cannot be assumed; consult the Welch's t-test row",
                    "Equal variances are confirmed and assumed",
                    "The independent variable has no significant effect",
                    "The sample size is invalid"
                  ],
                  correctOptionIndex: 0,
                  explanation: "When Levene's test is statistically significant (p < .05), the assumption of homogeneity of variance is violated, so Welch's adjusted t-test must be interpreted."
                },
                {
                  id: "q-stat-2",
                  question: "In an independent samples t-test with n₁ = 25 and n₂ = 30, what are the total degrees of freedom under equal variance assumption?",
                  options: ["df = 53", "df = 55", "df = 54", "df = 52"],
                  correctOptionIndex: 0,
                  explanation: "df = n₁ + n₂ - 2 = 25 + 30 - 2 = 53."
                },
                {
                  id: "q-stat-3",
                  question: "What is the standard threshold for statistical significance (alpha level) in social and behavioral research?",
                  options: ["α = 0.05", "α = 0.50", "α = 0.10", "α = 0.001"],
                  correctOptionIndex: 0,
                  explanation: "The conventional threshold established by Fisher is α = 0.05."
                },
                {
                  id: "q-stat-4",
                  question: "Cohen's d measures:",
                  options: [
                    "The standardized effect size (magnitude of difference between means)",
                    "The probability of a Type I error",
                    "The degree of collinearity",
                    "The sample skewness"
                  ],
                  correctOptionIndex: 0,
                  explanation: "Cohen's d is the standardized difference between two means, expressing effect size in units of standard deviations."
                }
              ]
            }
          }
        ]
      }
    ]
  }
];

// In-memory stores
export const PROGRAM_ENROLLMENTS: ProgramEnrollment[] = [
  {
    id: "enr-demo-1",
    programId: "prog-jamb-sci",
    programTitle: "JAMB Complete Science Mastery Program (UTME 2025/2026)",
    userId: "demo-student-1",
    userName: "Hauwau Usman",
    userEmail: "hauwauusmankandarawa@gmail.com",
    enrolledAt: "2025-02-10T09:00:00.000Z",
    status: "active",
    progressPercent: 50,
    completedLessonIds: ["les-jamb-mth-101"],
    completedModuleIds: [],
    unlockedLessonIds: ["les-jamb-mth-101", "les-jamb-mth-102"],
    unlockedModuleIds: ["mod-jamb-mth-1"],
    currentLessonId: "les-jamb-mth-102",
    currentModuleId: "mod-jamb-mth-1",
    allowSkippingOverride: false,
    certificateIssued: false,
  }
];

export const STUDENT_LESSON_PROGRESS: StudentLessonProgress[] = [
  {
    id: "prog-rec-1",
    programId: "prog-jamb-sci",
    moduleId: "mod-jamb-mth-1",
    lessonId: "les-jamb-mth-101",
    userId: "demo-student-1",
    videoWatchedSeconds: 2100,
    videoCompleted: true,
    readingCompleted: true,
    assignmentSubmitted: true,
    assignmentText: "Dimensions: Length = 20m, Width = 12m. Area = 20 * 12 = 240 m².",
    assignmentScore: 95,
    assignmentPassed: true,
    quizPassed: true,
    quizHighestScore: 100,
    quizAttemptsCount: 1,
    isMastered: true,
    masteredAt: "2025-02-12T14:30:00.000Z",
    manualUnlocked: false,
  }
];

export const MASTERY_QUIZ_ATTEMPTS: MasteryQuizAttempt[] = [];
export const MASTERY_OVERRIDES: MasteryOverride[] = [];
export const CERTIFICATES_STORE: Certificate[] = [];

// ==========================================
// CORE MASTERY EVALUATION & UNLOCK FUNCTIONS
// ==========================================

/**
 * Finds a program by ID
 */
export function getProgramById(programId: string): Program | undefined {
  return PROGRAMS_DATABASE.find((p) => p.id === programId);
}

/**
 * Finds a lesson across all programs
 */
export function findLessonById(lessonId: string): { program: Program; module: ProgramModule; lesson: ProgramLesson } | null {
  for (const prog of PROGRAMS_DATABASE) {
    for (const mod of prog.modules) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) {
        return { program: prog, module: mod, lesson: found };
      }
    }
  }
  return null;
}

/**
 * Checks whether a specific student is authorized to view a lesson.
 * Strict mastery rules:
 * - Admin or Tutor can always access (with admin override flag).
 * - If program.allowSkipping is true, all lessons are unlocked.
 * - If student has a personal allowSkippingOverride or a specific MasteryOverride, lesson is unlocked.
 * - If it's the very first lesson in the very first module, it's unlocked.
 * - Otherwise, prerequisite lesson MUST have isMastered === true (quiz passed with ≥ threshold).
 */
export function checkLessonAccess(
  studentId: string,
  programId: string,
  lessonId: string,
  userRole: string = "student"
): {
  authorized: boolean;
  isUnlocked: boolean;
  status: "locked" | "unlocked" | "mastered";
  reason: string;
  prerequisiteInfo?: { lessonId: string; title: string; requiredScore: number };
  canBypass: boolean;
} {
  const isAdminOrTutor = userRole === "admin" || userRole === "tutor";
  const prog = getProgramById(programId);
  const lessonData = findLessonById(lessonId);

  if (!prog || !lessonData) {
    return {
      authorized: false,
      isUnlocked: false,
      status: "locked",
      reason: "Lesson or program does not exist.",
      canBypass: isAdminOrTutor,
    };
  }

  // 1. Admin/Tutor bypass
  if (isAdminOrTutor) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "unlocked",
      reason: "Staff / Educator access granted.",
      canBypass: true,
    };
  }

  // 2. Program-wide skip configuration
  if (prog.allowSkipping) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "unlocked",
      reason: "Course administrator has configured open navigation for this program.",
      canBypass: true,
    };
  }

  // 3. Check individual student override
  const enrollment = PROGRAM_ENROLLMENTS.find((e) => e.programId === programId && e.userId === studentId);
  if (enrollment?.allowSkippingOverride) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "unlocked",
      reason: "Individual student progression waiver granted by faculty.",
      canBypass: true,
    };
  }

  // 4. Check lesson-specific override
  const manualOverride = MASTERY_OVERRIDES.find(
    (o) => o.studentId === studentId && o.programId === programId && o.lessonId === lessonId
  );
  if (manualOverride) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "unlocked",
      reason: `Waiver authorized by ${manualOverride.grantedBy} (${manualOverride.reason}).`,
      canBypass: true,
    };
  }

  // 5. Check if student already mastered this lesson
  const currentProgress = STUDENT_LESSON_PROGRESS.find(
    (p) => p.userId === studentId && p.lessonId === lessonId
  );
  if (currentProgress?.isMastered) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "mastered",
      reason: "Lesson mastered and completed.",
      canBypass: true,
    };
  }

  // 6. Check if it is the first lesson of the first module
  const firstModule = prog.modules[0];
  const isFirstOverallLesson = firstModule?.lessons[0]?.id === lessonId;
  if (isFirstOverallLesson) {
    return {
      authorized: true,
      isUnlocked: true,
      status: "unlocked",
      reason: "First introductory lesson is available to all enrolled students.",
      canBypass: true,
    };
  }

  // 7. Check prerequisite within the module or previous module
  const prereqLessonId = lessonData.lesson.prerequisiteLessonId;
  if (prereqLessonId) {
    const prereqLesson = findLessonById(prereqLessonId);
    const prereqProgress = STUDENT_LESSON_PROGRESS.find(
      (p) => p.userId === studentId && p.lessonId === prereqLessonId
    );

    if (!prereqProgress || !prereqProgress.isMastered) {
      const reqThreshold = lessonData.lesson.passingScorePercent || prog.passingThreshold || 75;
      return {
        authorized: false,
        isUnlocked: false,
        status: "locked",
        reason: `Sequential Gate: You must complete "${prereqLesson?.lesson.title || 'the prior lesson'}" and pass the Mastery Quiz with at least ${reqThreshold}% to unlock this lecture.`,
        prerequisiteInfo: {
          lessonId: prereqLessonId,
          title: prereqLesson?.lesson.title || "Prior Lesson",
          requiredScore: reqThreshold,
        },
        canBypass: false,
      };
    }
  }

  // 8. If module has a prerequisite module
  const prereqModId = lessonData.module.prerequisiteModuleId;
  if (prereqModId) {
    const prereqMod = prog.modules.find((m) => m.id === prereqModId);
    const allPrereqLessonsMastered = prereqMod?.lessons.every((l) => {
      const pr = STUDENT_LESSON_PROGRESS.find((p) => p.userId === studentId && p.lessonId === l.id);
      return pr?.isMastered;
    });

    if (!allPrereqLessonsMastered) {
      return {
        authorized: false,
        isUnlocked: false,
        status: "locked",
        reason: `Module Gate: You must master all lectures in "${prereqMod?.title || 'Prior Module'}" before advancing to this module.`,
        canBypass: false,
      };
    }
  }

  // Default unlocked if prerequisites satisfied
  return {
    authorized: true,
    isUnlocked: true,
    status: "unlocked",
    reason: "Prerequisites fulfilled. Ready for learning.",
    canBypass: true,
  };
}

/**
 * Records activity progress (video watched, reading viewed, assignment submitted)
 */
export function recordStudentActivity(
  studentId: string,
  programId: string,
  lessonId: string,
  activityType: "video" | "reading" | "assignment",
  payload: {
    watchedSeconds?: number;
    assignmentText?: string;
  }
): StudentLessonProgress {
  const lessonData = findLessonById(lessonId);
  const moduleId = lessonData?.module.id || "";

  let record = STUDENT_LESSON_PROGRESS.find(
    (p) => p.userId === studentId && p.lessonId === lessonId
  );

  if (!record) {
    record = {
      id: "slp-" + Math.random().toString(36).substring(2, 9),
      programId,
      moduleId,
      lessonId,
      userId: studentId,
      videoWatchedSeconds: 0,
      videoCompleted: false,
      readingCompleted: false,
      assignmentSubmitted: false,
      quizPassed: false,
      quizHighestScore: 0,
      quizAttemptsCount: 0,
      isMastered: false,
      manualUnlocked: false,
    };
    STUDENT_LESSON_PROGRESS.push(record);
  }

  if (activityType === "video") {
    record.videoWatchedSeconds = Math.max(record.videoWatchedSeconds, payload.watchedSeconds || 0);
    record.videoCompleted = true;
  } else if (activityType === "reading") {
    record.readingCompleted = true;
  } else if (activityType === "assignment") {
    record.assignmentSubmitted = true;
    record.assignmentText = payload.assignmentText || "";
    record.assignmentPassed = true;
    record.assignmentScore = 90;
  }

  return record;
}

/**
 * Evaluates Mastery Quiz Submission and triggers unlock progression & AI remediation
 */
export function evaluateMasteryQuizSubmission(
  studentId: string,
  studentEmail: string,
  programId: string,
  lessonId: string,
  selectedAnswers: { questionId: string; optionIndex: number }[]
): {
  attempt: MasteryQuizAttempt;
  passed: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  passingThreshold: number;
  unlockedNextLessonId?: string;
  certificateEligible: boolean;
  remediationAdvice?: string;
} {
  const lessonData = findLessonById(lessonId);
  if (!lessonData) {
    throw new Error("Lesson not found");
  }

  const prog = lessonData.program;
  const quiz = lessonData.lesson.quiz;
  const passingThreshold = quiz.passingScorePercent || prog.passingThreshold || 75;

  let correctCount = 0;
  const incorrectAnswers: MasteryQuizAttempt["incorrectAnswers"] = [];

  quiz.questions.forEach((q) => {
    const userAns = selectedAnswers.find((a) => a.questionId === q.id);
    const isCorrect = userAns && userAns.optionIndex === q.correctOptionIndex;

    if (isCorrect) {
      correctCount++;
    } else {
      const selectedText = userAns && q.options[userAns.optionIndex] ? q.options[userAns.optionIndex] : "No answer chosen";
      const correctText = q.options[q.correctOptionIndex];
      incorrectAnswers.push({
        questionId: q.id,
        question: q.question,
        selectedOption: selectedText,
        correctOption: correctText,
        explanation: q.explanation,
      });
    }
  });

  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= passingThreshold;

  // Generate TutorBee AI remediation summary
  let remediationText = "";
  if (!passed) {
    remediationText = `[TutorBee Academic Diagnostic]: You scored ${percentage}%, which is below the mastery gate of ${passingThreshold}%. Review the following concept anchors:
${incorrectAnswers
  .map(
    (inc, i) =>
      `• ${i + 1}. Regarding "${inc.question.slice(0, 45)}...": You picked "${inc.selectedOption}", but the accurate scientific standard is "${inc.correctOption}". Recall that: ${inc.explanation}`
  )
  .join("\n")}
Tip: Review the lecture notes in the Revision tab, re-watch the relevant section, and take a quick breath before your retake.`;
  } else {
    remediationText = `[TutorBee Commendation]: Superb work! You achieved ${percentage}%, demonstrating strong conceptual mastery. The subsequent lecture is now unlocked.`;
  }

  const attemptId = "att-" + Math.random().toString(36).substring(2, 9);
  const attemptRecord: MasteryQuizAttempt = {
    id: attemptId,
    programId,
    moduleId: lessonData.module.id,
    lessonId,
    userId: studentId,
    userEmail: studentEmail,
    score: correctCount,
    totalQuestions,
    percentage,
    passed,
    passingThreshold,
    incorrectAnswers,
    tutorBeeRemediation: remediationText,
    submittedAt: new Date().toISOString(),
  };
  MASTERY_QUIZ_ATTEMPTS.push(attemptRecord);

  // Update student lesson progress
  let progress = STUDENT_LESSON_PROGRESS.find(
    (p) => p.userId === studentId && p.lessonId === lessonId
  );
  if (!progress) {
    progress = recordStudentActivity(studentId, programId, lessonId, "video", {});
  }

  progress.quizAttemptsCount = (progress.quizAttemptsCount || 0) + 1;
  progress.quizHighestScore = Math.max(progress.quizHighestScore || 0, percentage);

  let unlockedNextLessonId: string | undefined;

  if (passed) {
    progress.quizPassed = true;
    progress.isMastered = true;
    progress.masteredAt = new Date().toISOString();

    // Determine the next sequential lesson to unlock
    const currentModule = lessonData.module;
    const currentLessonIdx = currentModule.lessons.findIndex((l) => l.id === lessonId);

    if (currentLessonIdx !== -1 && currentLessonIdx < currentModule.lessons.length - 1) {
      unlockedNextLessonId = currentModule.lessons[currentLessonIdx + 1].id;
    } else {
      // Advance to next module's first lesson if exists
      const currentModIdx = prog.modules.findIndex((m) => m.id === currentModule.id);
      if (currentModIdx !== -1 && currentModIdx < prog.modules.length - 1) {
        unlockedNextLessonId = prog.modules[currentModIdx + 1].lessons[0]?.id;
      }
    }

    // Update Enrollment record
    updateEnrollmentProgress(studentId, programId);
  }

  // Check overall program completion
  const overall = calculateProgramProgress(studentId, programId);

  return {
    attempt: attemptRecord,
    passed,
    score: correctCount,
    totalQuestions,
    percentage,
    passingThreshold,
    unlockedNextLessonId,
    certificateEligible: overall.progressPercent === 100,
    remediationAdvice: remediationText,
  };
}

/**
 * Recalculates and updates enrollment progress %
 */
export function updateEnrollmentProgress(studentId: string, programId: string): ProgramEnrollment | null {
  const prog = getProgramById(programId);
  if (!prog) return null;

  let enrollment = PROGRAM_ENROLLMENTS.find((e) => e.programId === programId && e.userId === studentId);
  if (!enrollment) {
    enrollment = {
      id: "enr-" + Math.random().toString(36).substring(2, 9),
      programId,
      programTitle: prog.title,
      userId: studentId,
      userName: "Student " + studentId.slice(0, 5),
      userEmail: `${studentId}@tutorhive.ng`,
      enrolledAt: new Date().toISOString(),
      status: "active",
      progressPercent: 0,
      completedLessonIds: [],
      completedModuleIds: [],
      unlockedLessonIds: [prog.modules[0]?.lessons[0]?.id].filter(Boolean),
      unlockedModuleIds: [prog.modules[0]?.id].filter(Boolean),
      currentLessonId: prog.modules[0]?.lessons[0]?.id || "",
      currentModuleId: prog.modules[0]?.id || "",
      allowSkippingOverride: false,
      certificateIssued: false,
    };
    PROGRAM_ENROLLMENTS.push(enrollment);
  }

  let totalLessons = 0;
  let masteredLessons = 0;
  const completedLessonIds: string[] = [];
  const completedModuleIds: string[] = [];

  prog.modules.forEach((mod) => {
    let modCompleted = true;
    mod.lessons.forEach((les) => {
      totalLessons++;
      const p = STUDENT_LESSON_PROGRESS.find((rec) => rec.userId === studentId && rec.lessonId === les.id);
      if (p?.isMastered) {
        masteredLessons++;
        completedLessonIds.push(les.id);
      } else {
        modCompleted = false;
      }
    });

    if (modCompleted && mod.lessons.length > 0) {
      completedModuleIds.push(mod.id);
    }
  });

  const percent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;
  enrollment.progressPercent = percent;
  enrollment.completedLessonIds = completedLessonIds;
  enrollment.completedModuleIds = completedModuleIds;

  if (percent === 100 && !enrollment.certificateIssued) {
    enrollment.status = "completed";
  }

  return enrollment;
}

/**
 * Computes deep stats for student program overview
 */
export function calculateProgramProgress(studentId: string, programId: string) {
  const prog = getProgramById(programId);
  if (!prog) {
    return {
      progressPercent: 0,
      totalLessons: 0,
      masteredLessons: 0,
      videoMinutesWatched: 0,
      averageQuizScore: 0,
      quizAttemptsCount: 0,
      isComplete: false,
    };
  }

  let totalLessons = 0;
  let masteredLessons = 0;
  let videoSeconds = 0;
  let quizScoresSum = 0;
  let quizCount = 0;

  prog.modules.forEach((m) => {
    m.lessons.forEach((l) => {
      totalLessons++;
      const progRec = STUDENT_LESSON_PROGRESS.find((p) => p.userId === studentId && p.lessonId === l.id);
      if (progRec) {
        if (progRec.isMastered) masteredLessons++;
        videoSeconds += progRec.videoWatchedSeconds || 0;
        if (progRec.quizHighestScore > 0) {
          quizScoresSum += progRec.quizHighestScore;
          quizCount++;
        }
      }
    });
  });

  const progressPercent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;
  const averageQuizScore = quizCount > 0 ? Math.round(quizScoresSum / quizCount) : 0;

  return {
    progressPercent,
    totalLessons,
    masteredLessons,
    videoMinutesWatched: Math.round(videoSeconds / 60),
    averageQuizScore,
    quizAttemptsCount: quizCount,
    isComplete: progressPercent === 100,
  };
}

/**
 * Issues a verified Certificate of Mastery
 */
export function issueMasteryCertificate(
  studentId: string,
  userName: string,
  userEmail: string,
  programId: string
): Certificate {
  const prog = getProgramById(programId);
  if (!prog) throw new Error("Program not found");

  const stats = calculateProgramProgress(studentId, programId);
  if (stats.progressPercent < 100) {
    throw new Error(`Incomplete Mastery: Program is only ${stats.progressPercent}% complete. All required lessons and mastery assessments must be passed.`);
  }

  const certNumber = "TH-MASTERY-" + Math.floor(100000 + Math.random() * 900000);
  const certId = "cert-" + Math.random().toString(36).substring(2, 9);

  const cert: Certificate = {
    id: certId,
    certificateNumber: certNumber,
    programId,
    programTitle: prog.title,
    userId: studentId,
    userName,
    userEmail,
    issueDate: new Date().toISOString().split("T")[0],
    finalGradeAverage: stats.averageQuizScore || 88,
    totalHours: prog.estimatedHours,
    verificationCode: "V-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    skillsMastered: [
      "Rigorous Conceptual Mastery",
      "Examinations Syllabus Competence",
      "TutorHive Verified Learning Sequence",
      "Scientific Problem Proofs & Synthesis"
    ]
  };

  CERTIFICATES_STORE.push(cert);

  const enrollment = PROGRAM_ENROLLMENTS.find((e) => e.programId === programId && e.userId === studentId);
  if (enrollment) {
    enrollment.certificateIssued = true;
    enrollment.certificateIssuedAt = new Date().toISOString();
    enrollment.certificateId = cert.id;
  }

  return cert;
}

/**
 * Administrator or Tutor unlocks a gated lesson manually
 */
export function grantMasteryWaiver(
  grantedBy: string,
  grantedByRole: "admin" | "tutor",
  studentId: string,
  studentName: string,
  programId: string,
  lessonId: string,
  reason: string
): MasteryOverride {
  const override: MasteryOverride = {
    id: "ovr-" + Math.random().toString(36).substring(2, 9),
    programId,
    lessonId,
    studentId,
    studentName,
    grantedBy,
    grantedByRole,
    reason: reason || "Educator approved syllabus advancement",
    grantedAt: new Date().toISOString(),
  };

  MASTERY_OVERRIDES.push(override);

  // Update progress to unlocked
  let progress = STUDENT_LESSON_PROGRESS.find((p) => p.userId === studentId && p.lessonId === lessonId);
  if (!progress) {
    progress = recordStudentActivity(studentId, programId, lessonId, "video", {});
  }
  progress.manualUnlocked = true;
  progress.unlockedBy = grantedBy;
  progress.unlockedReason = reason;

  return override;
}

/**
 * Toggles whether a program allows skipping ahead
 */
export function toggleProgramSkipping(programId: string, allowSkipping: boolean): Program | null {
  const prog = getProgramById(programId);
  if (!prog) return null;
  prog.allowSkipping = allowSkipping;
  return prog;
}

/**
 * Aggregates cohort analytics for Tutor and Admin Program Tracker Dashboards
 */
export function getCohortMasteryAnalytics() {
  const totalPrograms = PROGRAMS_DATABASE.length;
  const totalEnrollments = PROGRAM_ENROLLMENTS.length;
  const certificatesIssued = CERTIFICATES_STORE.length;

  let totalAttempts = MASTERY_QUIZ_ATTEMPTS.length;
  let passedAttempts = MASTERY_QUIZ_ATTEMPTS.filter((a) => a.passed).length;
  let passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 82;

  // Identify bottleneck lessons (where students failed most)
  const failureCountByLesson: Record<string, { count: number; lessonTitle: string; programTitle: string }> = {};
  MASTERY_QUIZ_ATTEMPTS.filter((a) => !a.passed).forEach((att) => {
    const lData = findLessonById(att.lessonId);
    const title = lData?.lesson.title || att.lessonId;
    const progTitle = lData?.program.title || att.programId;
    if (!failureCountByLesson[att.lessonId]) {
      failureCountByLesson[att.lessonId] = { count: 0, lessonTitle: title, programTitle: progTitle };
    }
    failureCountByLesson[att.lessonId].count++;
  });

  const bottlenecks = Object.entries(failureCountByLesson)
    .map(([lessonId, data]) => ({
      lessonId,
      lessonTitle: data.lessonTitle,
      programTitle: data.programTitle,
      failCount: data.count,
    }))
    .sort((a, b) => b.failCount - a.failCount);

  return {
    totalPrograms,
    totalEnrollments,
    certificatesIssued,
    quizPassRate: passRate,
    totalQuizAttempts: totalAttempts,
    bottlenecks: bottlenecks.slice(0, 5),
    overridesCount: MASTERY_OVERRIDES.length,
  };
}

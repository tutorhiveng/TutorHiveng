/**
 * TutorHiveNG Intelligent Auto-Fill Service
 * Automatically retrieves stored information from the database to populate forms for:
 * - Student enrollment, submissions, and checkout
 * - Tutor onboarding, session bookings, and course creation
 * - Course and lesson generation
 * - Digital library metadata
 * Auto-filled fields always remain editable before final submission.
 */

import { TUTORS_DIRECTORY } from "./tutorsData";
import { DIGITAL_LIBRARY_STORE } from "./libraryData";

// In-memory courses registry
export const COURSES_REGISTRY = [
  {
    id: "mth-pri-1",
    code: "MTH-101",
    title: "Foundation Mathematics for Primary & Junior Secondary",
    subjectId: "subj-mth",
    subjectName: "Mathematics",
    educationLevel: "Primary & JSS",
    category: "Foundation STEM",
    tutorId: "tut-okafor",
    tutorName: "Engr. Chinedu Okafor",
    department: "Science",
    estimatedWeeks: 12,
    totalLessons: 24,
    description: "Foundational arithmetic, basic algebra, plane geometry, and mental math tricks.",
    learningObjectives: [
      "Master fractions, decimals, and percentages",
      "Solve basic algebraic linear equations",
      "Understand angles and geometric properties"
    ]
  },
  {
    id: "mth-sec-1",
    code: "MTH-201",
    title: "Secondary Mathematics: Algebra, Trigonometry & Coordinate Geometry",
    subjectId: "subj-mth",
    subjectName: "Mathematics",
    educationLevel: "Secondary (SSS 1-3)",
    category: "Senior Secondary STEM",
    tutorId: "tut-okafor",
    tutorName: "Engr. Chinedu Okafor",
    department: "Science",
    estimatedWeeks: 14,
    totalLessons: 32,
    description: "Senior secondary curriculum tailored for WAEC, NECO, and GCE distinction.",
    learningObjectives: [
      "Master quadratic and simultaneous equations",
      "Apply trigonometric ratios and sine/cosine rules",
      "Understand probability and grouped statistics"
    ]
  },
  {
    id: "chem-1",
    code: "CHM-301",
    title: "Complete Senior Secondary & UTME Chemistry Mastery",
    subjectId: "subj-chm",
    subjectName: "Chemistry",
    educationLevel: "JAMB Prep",
    category: "Science Prep",
    tutorId: "tut-adeleke",
    tutorName: "Prof. O. K. Adeleke",
    department: "Science",
    estimatedWeeks: 16,
    totalLessons: 40,
    description: "Physical, organic, and inorganic chemistry with UTME past question deconstructions.",
    learningObjectives: [
      "Master stoichiometry, gas laws, and chemical equilibrium",
      "Understand IUPAC nomenclature and organic reactions",
      "Identify qualitative analysis reagents and test procedures"
    ]
  },
  {
    id: "res-tert-1",
    code: "RES-401",
    title: "Tertiary Empirical Research Methodology & SPSS Data Analysis",
    subjectId: "subj-res",
    subjectName: "Research & Statistics",
    educationLevel: "Tertiary",
    category: "Academic Research",
    tutorId: "tut-adeyemi",
    tutorName: "Dr. Babatunde Adeyemi",
    department: "Tertiary",
    estimatedWeeks: 8,
    totalLessons: 18,
    description: "Step-by-step guidance on thesis formulation, questionnaire validation, and statistical testing.",
    learningObjectives: [
      "Formulate testable research hypotheses",
      "Run and interpret t-tests, ANOVA, and regression",
      "Write Chapter 4 (Results & Discussion) in APA 7th format"
    ]
  }
];

export interface StudentAutoFill {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
  institution: string;
  enrolledCourses: { courseId: string; title: string; progress: number }[];
  activePackages: string[];
  targetExam?: string;
}

export interface TutorAutoFill {
  tutorId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  availableDays: string[];
  taughtCourses: { courseId: string; title: string }[];
}

export interface CourseAutoFill {
  courseId: string;
  title: string;
  subjectName: string;
  educationLevel: string;
  category: string;
  tutorId?: string;
  tutorName?: string;
  department: string;
  description: string;
  learningObjectives: string[];
}

/**
 * Get Student Auto-Fill Data
 */
export function getStudentAutoFill(userId: string, emailHint = ""): StudentAutoFill {
  return {
    userId,
    fullName: emailHint.includes("student") ? "Ibrahim Danjuma" : "TutorHive Scholar",
    email: emailHint || "student@tutorhive.ng",
    phone: "08012345678",
    educationLevel: "Secondary (SSS 1-3)",
    institution: "Federal Government College / University of Ibadan",
    enrolledCourses: [
      { courseId: "mth-sec-1", title: "Secondary Mathematics: Algebra & Trigonometry", progress: 65 },
      { courseId: "chem-1", title: "Complete Senior Secondary Chemistry", progress: 40 }
    ],
    activePackages: ["pkg-standard"],
    targetExam: "WAEC May/June & JAMB UTME 2026"
  };
}

/**
 * Get Tutor Auto-Fill Data
 */
export function getTutorAutoFill(tutorId: string): TutorAutoFill | null {
  const tutor = TUTORS_DIRECTORY.find((t) => t.id === tutorId);
  if (!tutor) {
    // Return default first tutor
    const first = TUTORS_DIRECTORY[0];
    return {
      tutorId: first.id,
      fullName: first.name,
      email: first.email,
      phone: "08098765432",
      specialization: first.specialization,
      qualifications: first.qualifications,
      subjects: first.subjects,
      hourlyRate: first.hourlyRate,
      rating: first.rating,
      availableDays: first.availableDays,
      taughtCourses: [
        { courseId: "mth-sec-1", title: "Secondary Mathematics: Algebra & Trigonometry" }
      ]
    };
  }

  return {
    tutorId: tutor.id,
    fullName: tutor.name,
    email: tutor.email,
    phone: "08098765432",
    specialization: tutor.specialization,
    qualifications: tutor.qualifications,
    subjects: tutor.subjects,
    hourlyRate: tutor.hourlyRate,
    rating: tutor.rating,
    availableDays: tutor.availableDays,
    taughtCourses: COURSES_REGISTRY.filter((c) => c.tutorId === tutor.id).map((c) => ({
      courseId: c.id,
      title: c.title
    }))
  };
}

/**
 * Get Course Auto-Fill Data
 */
export function getCourseAutoFill(courseId: string): CourseAutoFill | null {
  const course = COURSES_REGISTRY.find((c) => c.id === courseId);
  if (!course) return null;

  return {
    courseId: course.id,
    title: course.title,
    subjectName: course.subjectName,
    educationLevel: course.educationLevel,
    category: course.category,
    tutorId: course.tutorId,
    tutorName: course.tutorName,
    department: course.department,
    description: course.description,
    learningObjectives: course.learningObjectives
  };
}

/**
 * Get Digital Library Item Auto-Fill Data
 */
export function getLibraryItemAutoFill(resourceId: string) {
  const item = DIGITAL_LIBRARY_STORE.find((b) => b.id === resourceId);
  if (!item) return null;
  return {
    resourceId: item.id,
    title: item.title,
    author: item.author,
    category: item.category,
    level: item.level,
    price: item.price,
    coverImageUrl: item.coverImageUrl,
    previewUrl: item.previewUrl
  };
}

export type UserRole = "student" | "tutor" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  specialization?: string; // e.g. "Pure Mathematics & Further Maths"
  qualifications?: string; // e.g. "B.Sc. Ed (UNILAG), M.Sc. Math"
  hourlyRate?: number; // In NGN
  rating?: number; // e.g. 4.9
  isVerifiedTutor?: boolean;
  academicDepartment?: string;
  currentLevel?: string;
  purchasedPackages: string[]; // e.g. ["Basic", "Standard"]
  purchasedProjects: string[]; // e.g. ["proj-101"]
  purchasedBooks?: string[]; // e.g. ["lib-bk-101"]
  enrolledCourses: string[]; // e.g. ["math-1"]
  completedLessons: string[]; // e.g. ["math-1_lesson-1"]
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // e.g. "MTH", "CHM", "PHY"
  department: string; // "Science", "Arts", "Commercial", "Tertiary"
  description: string;
  icon?: string;
}

export interface VideoLessonRecord {
  id: string;
  courseId: string;
  moduleNumber: number;
  lessonOrder: number;
  title: string;
  description?: string;
  videoUrl: string; // external or Supabase storage signed URL
  videoStoragePath?: string; // e.g. "video-lessons/course-101/lesson-1.mp4"
  durationSeconds: number;
  notesMarkdown?: string;
  attachmentStoragePath?: string;
  attachmentUrl?: string;
  isPreview: boolean; // free sample for non-subscribers
  createdAt: string;
}

export interface AssignmentRecord {
  id: string;
  courseId: string;
  lessonId?: string;
  tutorId: string;
  tutorName?: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  attachmentUrl?: string;
  createdAt: string;
}

export interface AssignmentSubmissionRecord {
  id: string;
  assignmentId: string;
  courseId?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  submissionText: string;
  fileStoragePath?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: "submitted" | "graded" | "resubmission_requested";
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface SubscriptionRecord {
  id: string;
  studentId: string;
  packageId: string;
  packageName: string;
  status: "active" | "expired" | "cancelled";
  amount: number;
  startDate: string;
  expiresAt: string;
  autoRenew: boolean;
  paymentReference: string;
  createdAt: string;
}

export interface DigitalBookRecord {
  id: string;
  title: string;
  author: string;
  category: string;
  level: string;
  fileType: "pdf" | "epub" | "docx";
  fileStoragePath?: string;
  previewUrl?: string;
  coverImageUrl?: string;
  price: number;
  downloadCount: number;
  isPublished: boolean;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  includes: string[];
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string; // Video URL (YouTube, Vimeo, etc.)
  notes: string; // Markdown / Text Notes
  gradedAssignment?: string; // Prompt / Instructions
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  level: string; // e.g., "Primary", "JSS", "JAMB Prep", "Tertiary"
  lessons: Lesson[];
  quizzes: QuizQuestion[];
  mockExaminations: QuizQuestion[];
}

export interface ResearchProject {
  id: string;
  title: string;
  category: string; // Education, Chemistry, Physics, Biology, Engineering, Computer Science, Geology
  abstract: string;
  preliminaryPages: string;
  chapterOnePreview: string;
  fullProjectUrl?: string; // unlocked by default if premium is purchased
  price: number;
  isFreePreview: boolean;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  type: "book" | "notes" | "pdf";
  price: number; // 0 for free
  fileUrl: string;
  coverImage?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: "opay" | "bank_transfer" | "card" | "paystack" | string;
  status: "pending" | "completed" | "failed" | "verified" | string;
  itemType: "package" | "project" | "library" | "course" | "service" | "tutor" | string;
  itemId: string;
  reference: string;
  createdAt: string;
}

export type PayableItemType = "library" | "package" | "project" | "course" | "service" | "tutor";

export interface PayableItem {
  id: string;
  type: PayableItemType;
  title: string;
  subtitle?: string;
  category?: string;
  description: string;
  price: number;
  badge?: string;
  authorOrDept?: string;
  detailsList?: string[];
  fileUrl?: string;
}

export interface PaymentInvoice {
  reference: string;
  transactionId: string;
  item: PayableItem;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: "card" | "bank_transfer" | "paystack";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cardBrand?: string;
  cardLast4?: string;
  timestamp: string;
}

export interface AssignmentSubmission {
  id: string;
  courseId: string;
  lessonId: string;
  userId: string;
  userEmail: string;
  submissionText: string;
  fileUrl?: string;
  score?: number;
  graded: boolean;
  submittedAt: string;
}

export interface TestResultRecord {
  id: string;
  userId: string;
  userEmail: string;
  itemId: string; // quiz or mock exam identifier
  itemType: "quiz" | "mock_exam";
  score: number;
  totalQuestions: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  imageUrl?: string;
  featured: boolean;
  createdAt: string;
}

export interface BlogComment {
  id: string;
  blogId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: any; // Timestamp or date ISO string
  status: "unread" | "replied";
}

export interface SupportChat {
  chatId: string;
  userId: string;
  userName: string;
  email: string;
  status: "active" | "ended";
  updatedAt: any; // Timestamp
}

export interface SupportChatMessage {
  messageId: string;
  sender: "user" | "assistant" | "admin";
  senderName: string;
  text: string;
  createdAt: any; // Timestamp
}

export interface NavigationEntry {
  tab: string;
  subTab?: string;
  levelFilter?: string;
  selectedCourseId?: string | null;
  label: string;
}

export interface TutorProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  specialization: string;
  qualifications: string;
  subjects: string[];
  levels: string[];
  hourlyRate: number; // in NGN
  rating: number; // e.g. 4.9
  reviewCount: number;
  totalStudentsTaught: number;
  totalHoursTaught: number;
  isVerified: boolean;
  availableDays: string[];
  location?: string;
  videoIntroUrl?: string;
}

export interface TutorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  subjects: string[];
  experienceYears: number;
  proposedHourlyRate: number;
  credentialsFileUrl?: string;
  statementOfIntent: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
}

export interface TutorBooking {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorEmail?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  scheduledDate: string;
  timeSlot: string;
  durationMinutes: number;
  totalAmount: number;
  tutorEarnings: number; // 85%
  platformCommission: number; // 15%
  status: "confirmed" | "completed" | "cancelled";
  meetingLink: string;
  paymentReference: string;
  notes?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId?: string; // empty or 'all' for broadcasts
  title: string;
  message: string;
  type: "payment" | "lesson" | "assignment" | "tutor" | "announcement" | "system";
  read: boolean;
  linkTab?: string;
  linkSubTab?: string;
  createdAt: string;
}

export interface PluginConfigField {
  key: string;
  label: string;
  type: "string" | "secret" | "url" | "boolean";
  description?: string;
  maskedValue?: string;
}

export interface PluginIntegration {
  id: string;
  name: string;
  category: "payment" | "ai" | "notification" | "video" | "analytics" | "storage";
  provider: string;
  status: "connected" | "configured" | "optional" | "disabled";
  description: string;
  iconName: string;
  version: string;
  docsUrl: string;
  webhookEndpoint?: string;
  eventsSupported: string[];
  isThirdParty: boolean;
  configFields: PluginConfigField[];
}

export interface WebhookEventLog {
  id: string;
  provider: "opay" | "paystack" | "gemini" | "resend" | "zoom" | "custom";
  event: string;
  status: "success" | "pending" | "failed";
  statusCode: number;
  payloadSummary: string;
  timestamp: string;
}

export interface PlatformAnalytics {
  totalRevenueNGN: number;
  mrrNGN: number;
  totalStudents: number;
  totalTutors: number;
  activeSubscribers: number;
  videoWatchMinutes: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  tutorBookingsCount: number;
  revenueByTier: { tier: string; count: number; revenue: number }[];
  popularCourses: { title: string; enrollments: number; completionRate: number }[];
  recentActivity: { id: string; user: string; action: string; timestamp: string; type: string }[];
}

export interface CalculationResult {
  topic: string;
  problem: string;
  steps: { stepNumber: number; title: string; formula?: string; explanation: string; resultSnippet?: string }[];
  finalAnswer: string;
  curriculumNotes?: string;
}

export interface ProgramLessonType {
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
  passingScorePercent: number;
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

export interface ProgramModuleType {
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
  lessons: ProgramLessonType[];
}

export interface ProgramType {
  id: string;
  title: string;
  code: string;
  description: string;
  educationLevel: string;
  category: string;
  durationWeeks: number;
  estimatedHours: number;
  allowSkipping: boolean;
  passingThreshold: number;
  certificateEligible: boolean;
  badgeIcon: string;
  thumbnailUrl: string;
  courseIds?: string[];
  modulesCount?: number;
  totalLessons?: number;
  enrollmentsCount?: number;
  modules?: ProgramModuleType[];
}

export interface CertificateType {
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




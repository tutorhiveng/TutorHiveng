import { createClient, User as SupabaseUser } from "@supabase/supabase-js";
import {
  UserProfile,
  UserRole,
  VideoLessonRecord,
  AssignmentRecord,
  AssignmentSubmissionRecord,
  SubscriptionRecord,
  DigitalBookRecord,
} from "./types";

export const SUPABASE_PROJECT_ID = "nbasiawyntilkdfekfqo";
export const SUPABASE_URL: string =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) || "https://nbasiawyntilkdfekfqo.supabase.co";
export const SUPABASE_ANON_KEY: string =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXNpYXd5bnRpbGtkZmVrZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzI1NzcsImV4cCI6MjEwNTI0ODU3N30.MakIa5Wz8tt1hmLaHeG8UcphK1zlbTp5xrF7sICA-3c";

// Initialize the single client-side Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
});

export interface SupabaseHealthStatus {
  connected: boolean;
  authHealthy: boolean;
  tablesDetected: {
    profiles: boolean;
    subjects: boolean;
    courses: boolean;
    video_lessons: boolean;
    digital_library: boolean;
    research_projects: boolean;
    assignments: boolean;
    assignment_submissions: boolean;
    packages: boolean;
    subscriptions: boolean;
    payments: boolean;
    grades: boolean;
    contact_messages: boolean;
  };
  storageBucketsDetected: {
    "educational-materials": boolean;
    "video-lessons": boolean;
    "digital-library": boolean;
    "student-submissions": boolean;
    avatars: boolean;
  };
  latencyMs: number;
  error?: string;
}

// Local cache keys for offline resilience and smooth onboarding before tables are initialized
const LOCAL_PROFILE_KEY = "tutorhive_supabase_profile_cache";
const LOCAL_PAYMENTS_KEY = "tutorhive_supabase_payments_cache";

/**
 * Perform a comprehensive health & schema audit against Supabase Auth, Tables & Storage
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const start = performance.now();
  const status: SupabaseHealthStatus = {
    connected: false,
    authHealthy: false,
    tablesDetected: {
      profiles: false,
      subjects: false,
      courses: false,
      video_lessons: false,
      digital_library: false,
      research_projects: false,
      assignments: false,
      assignment_submissions: false,
      packages: false,
      subscriptions: false,
      payments: false,
      grades: false,
      contact_messages: false,
    },
    storageBucketsDetected: {
      "educational-materials": false,
      "video-lessons": false,
      "digital-library": false,
      "student-submissions": false,
      avatars: false,
    },
    latencyMs: 0,
  };

  try {
    // 1. Check Auth health
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (authRes.ok) {
      status.authHealthy = true;
      status.connected = true;
    }

    // 2. Probe core tables
    const tableNames: (keyof typeof status.tablesDetected)[] = [
      "profiles",
      "subjects",
      "courses",
      "video_lessons",
      "digital_library",
      "research_projects",
      "assignments",
      "assignment_submissions",
      "packages",
      "subscriptions",
      "payments",
      "grades",
      "contact_messages",
    ];

    await Promise.all(
      tableNames.map(async (table) => {
        try {
          const res = await supabase.from(table).select("id").limit(1);
          if (!res.error || res.error.code !== "PGRST205") {
            status.tablesDetected[table] = true;
          }
        } catch {
          // table probe failed
        }
      })
    );

    // 3. Probe storage buckets
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets && Array.isArray(buckets)) {
        buckets.forEach((b) => {
          if (b.id in status.storageBucketsDetected) {
            status.storageBucketsDetected[b.id as keyof typeof status.storageBucketsDetected] = true;
          }
        });
      }
    } catch {
      // Storage listing requires admin/auth or is public
    }

    status.latencyMs = Math.round(performance.now() - start);
    return status;
  } catch (err: any) {
    status.error = err.message || "Failed to reach Supabase project";
    status.latencyMs = Math.round(performance.now() - start);
    return status;
  }
}

// ----------------------------------------------------
// 1. SUPABASE AUTHENTICATION & MULTI-ROLE HELPERS
// ----------------------------------------------------

/**
 * Sign In with Email & Password
 */
export async function signInWithSupabase(email: string, password: string) {
  const res = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

/**
 * Sign Up with Email, Password, Name and Optional Role (student, tutor, admin)
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "student",
  specialization = ""
) {
  const res = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: fullName,
        full_name: fullName,
        role,
        specialization,
      },
    },
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

/**
 * Sign In with Google OAuth via Supabase
 */
export async function signInWithSupabaseGoogle() {
  const redirectUrl = typeof window !== "undefined" ? window.location.origin : "https://nbasiawyntilkdfekfqo.supabase.co";

  // Initiate OAuth flow with explicit apikey parameter to prevent "No API key found in request" errors
  const res = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
      queryParams: {
        apikey: SUPABASE_ANON_KEY,
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (res.error) {
    throw res.error;
  }

  const oauthUrl = res.data?.url;
  if (!oauthUrl) {
    throw new Error("Supabase did not return a valid Google OAuth authorization URL.");
  }

  // Pre-flight check the authorization endpoint to verify if Google OAuth provider is enabled in the Supabase Dashboard
  try {
    const probeRes = await fetch(oauthUrl, { method: "GET" });
    if (!probeRes.ok) {
      const errorText = await probeRes.text();
      if (
        errorText.includes("Unsupported provider") ||
        errorText.includes("provider is not enabled")
      ) {
        throw new Error(
          "Google Sign-In is not currently enabled in this Supabase project. To enable it, navigate to Supabase Dashboard -> Authentication -> Providers -> Google, enable the provider, and enter your Google OAuth Client ID & Client Secret. In the meantime, you can register or sign in with your email and password."
        );
      } else if (errorText.includes("No API key found") || errorText.includes("apikey")) {
        throw new Error("Supabase API key is missing or invalid for Google OAuth.");
      }
    }
  } catch (probeErr: any) {
    // If we threw our detailed instruction error, bubble it up to the user UI
    if (
      probeErr.message?.includes("Google Sign-In is not currently enabled") ||
      probeErr.message?.includes("Supabase API key")
    ) {
      throw probeErr;
    }
    // Network or CORS checks on cross-domain 302 redirects are expected, so continue to browser redirect
  }

  // Proceed with browser redirect to Google OAuth
  if (typeof window !== "undefined") {
    window.location.href = oauthUrl;
  }
  return res.data;
}

/**
 * Reset Password via Supabase Auth
 */
export async function resetSupabasePassword(email: string) {
  const redirectUrl = typeof window !== "undefined" ? window.location.origin : "https://nbasiawyntilkdfekfqo.supabase.co";
  const res = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

/**
 * Sign Out of Supabase session
 */
export async function signOutFromSupabase() {
  try {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    // Clear user-specific cache keys
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(LOCAL_PROFILE_KEY) || key.startsWith("sb-")) {
          try {
            localStorage.removeItem(key);
          } catch {
            // ignore
          }
        }
      });
    }
  } catch {
    // ignore
  }
  const res = await supabase.auth.signOut();
  if (res.error) {
    throw res.error;
  }
}

/**
 * Get current authenticated user from Supabase session
 */
export async function getSupabaseCurrentUser(): Promise<SupabaseUser | null> {
  try {
    // Check cached active session first for immediate restoration
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return sessionData.session.user;
    }
    // Query auth server if session is being validated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Listen to Supabase auth state changes
 */
export function onSupabaseAuthStateChange(callback: (user: SupabaseUser | null, session?: any) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    callback(session?.user || null, session);
  });
  return () => {
    subscription.unsubscribe();
  };
}

// ----------------------------------------------------
// 2. USER PROFILE & ROLE ENGINE
// ----------------------------------------------------

/**
 * Fetch profile from Supabase `profiles` table with local cache fallback
 */
export async function getSupabaseUserProfile(
  userId: string,
  defaultEmail = "",
  defaultName = "",
  defaultRole: UserRole = "student"
): Promise<UserProfile> {
  let cachedProfile: UserProfile | null = null;
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${userId}`);
    if (raw) {
      cachedProfile = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (!error && data) {
      const profile: UserProfile = {
        uid: data.id,
        email: data.email || defaultEmail,
        name: data.display_name || defaultName || "User",
        role: (data.role || defaultRole) as UserRole,
        phone: data.phone_number,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        specialization: data.specialization,
        qualifications: data.qualifications,
        hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
        rating: data.rating ? Number(data.rating) : 5.0,
        isVerifiedTutor: data.is_verified_tutor,
        academicDepartment: data.academic_department,
        currentLevel: data.current_level,
        purchasedPackages: data.purchased_packages || [],
        purchasedProjects: data.purchased_projects || [],
        purchasedBooks: data.purchased_books || [],
        enrolledCourses: data.enrolled_courses || [],
        completedLessons: data.completed_lessons || [],
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at,
      };
      try {
        localStorage.setItem(`${LOCAL_PROFILE_KEY}_${userId}`, JSON.stringify(profile));
      } catch {
        // ignore
      }
      return profile;
    }
  } catch (err) {
    console.warn("Could not query Supabase profiles table, using fallback:", err);
  }

  if (cachedProfile) {
    return cachedProfile;
  }

  // Determine initial role
  let initialRole: UserRole = defaultRole;
  const lowerEmail = defaultEmail.toLowerCase();
  if (
    lowerEmail.includes("admin") ||
    lowerEmail.includes("director") ||
    lowerEmail === "hauwauusmankandarawa@gmail.com"
  ) {
    initialRole = "admin";
  } else if (lowerEmail.includes("tutor") || lowerEmail.includes("instructor")) {
    initialRole = "tutor";
  }

  const baseline: UserProfile = {
    uid: userId,
    email: defaultEmail,
    name: defaultName || "Student",
    role: initialRole,
    specialization: initialRole === "tutor" ? "General Science & Mathematics" : undefined,
    isVerifiedTutor: initialRole === "tutor",
    purchasedPackages: [],
    purchasedProjects: [],
    purchasedBooks: [],
    enrolledCourses: [],
    completedLessons: [],
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${userId}`, JSON.stringify(baseline));
  } catch {
    // ignore
  }

  syncUserProfileToSupabase(baseline).catch(() => {});
  return baseline;
}

/**
 * Upsert user profile to Supabase `profiles` table
 */
export async function syncUserProfileToSupabase(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${profile.uid}`, JSON.stringify(profile));
  } catch {
    // ignore
  }

  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: profile.uid,
        email: profile.email,
        display_name: profile.name,
        role: profile.role,
        phone_number: profile.phone || null,
        avatar_url: profile.avatarUrl || null,
        bio: profile.bio || null,
        specialization: profile.specialization || null,
        qualifications: profile.qualifications || null,
        hourly_rate: profile.hourlyRate || null,
        rating: profile.rating || 5.0,
        is_verified_tutor: profile.isVerifiedTutor || false,
        academic_department: profile.academicDepartment || null,
        current_level: profile.currentLevel || "Secondary",
        purchased_packages: profile.purchasedPackages || [],
        purchased_projects: profile.purchasedProjects || [],
        purchased_books: profile.purchasedBooks || [],
        enrolled_courses: profile.enrolledCourses || [],
        completed_lessons: profile.completedLessons || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase profile sync note:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("Supabase profile sync exception:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 3. STORAGE BUCKET OPERATIONS (VIDEOS, BOOKS, PAPERS, HOMEWORK)
// ----------------------------------------------------

/**
 * Upload a file to any Supabase Storage bucket
 */
export async function uploadFileToSupabaseStorage(
  bucket: "educational-materials" | "video-lessons" | "digital-library" | "student-submissions" | "avatars",
  filePath: string,
  file: File | Blob
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get a public URL or signed download link from Supabase Storage
 */
export function getSupabasePublicStorageUrl(bucket: string, filePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

/**
 * Create a temporary signed download URL for private files (e.g. graded submissions or purchased eBooks)
 */
export async function getSupabaseSignedStorageUrl(
  bucket: string,
  filePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.warn("Failed to create signed storage URL:", err);
    return null;
  }
}

// ----------------------------------------------------
// 4. RECORDED VIDEO LESSONS
// ----------------------------------------------------

export async function fetchVideoLessonsFromSupabase(courseId: string): Promise<VideoLessonRecord[]> {
  try {
    const { data, error } = await supabase
      .from("video_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_order", { ascending: true });

    if (!error && data) {
      return data.map((d) => ({
        id: d.id,
        courseId: d.course_id,
        moduleNumber: d.module_number,
        lessonOrder: d.lesson_order,
        title: d.title,
        description: d.description,
        videoUrl: d.video_url,
        videoStoragePath: d.video_storage_path,
        durationSeconds: d.duration_seconds,
        notesMarkdown: d.notes_markdown,
        attachmentStoragePath: d.attachment_storage_path,
        attachmentUrl: d.attachment_url,
        isPreview: Boolean(d.is_preview),
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch video lessons from Supabase:", err);
  }
  return [];
}

// ----------------------------------------------------
// 5. ASSIGNMENTS & HOMEWORK SUBMISSIONS
// ----------------------------------------------------

export async function fetchCourseAssignmentsFromSupabase(courseId: string): Promise<AssignmentRecord[]> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*, profiles:tutor_id(display_name)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        courseId: d.course_id,
        lessonId: d.lesson_id,
        tutorId: d.tutor_id,
        tutorName: d.profiles?.display_name || "Course Tutor",
        title: d.title,
        instructions: d.instructions,
        dueDate: d.due_date,
        maxScore: Number(d.max_score || 100),
        attachmentUrl: d.attachment_url,
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch assignments:", err);
  }
  return [];
}

export async function submitAssignmentToSupabase(submission: {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  submissionText: string;
  fileStoragePath?: string;
  fileUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("assignment_submissions").insert({
      id: submission.id,
      assignment_id: submission.assignmentId,
      course_id: submission.courseId,
      student_id: submission.studentId,
      submission_text: submission.submissionText,
      file_storage_path: submission.fileStoragePath || null,
      file_url: submission.fileUrl || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function gradeStudentSubmissionInSupabase(
  submissionId: string,
  score: number,
  feedback: string,
  tutorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        score,
        feedback,
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by: tutorId,
      })
      .eq("id", submissionId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 6. PAYMENTS & SUBSCRIPTIONS
// ----------------------------------------------------

export async function recordPaymentInSupabase(payment: {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  status: string;
  itemType: string;
  itemId: string;
  reference: string;
  createdAt: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existingRaw = localStorage.getItem(`${LOCAL_PAYMENTS_KEY}_${payment.userId}`) || "[]";
    const existing = JSON.parse(existingRaw);
    existing.unshift(payment);
    localStorage.setItem(`${LOCAL_PAYMENTS_KEY}_${payment.userId}`, JSON.stringify(existing));
  } catch {
    // ignore
  }

  try {
    const { error } = await supabase.from("payments").insert({
      id: payment.id,
      user_id: payment.userId,
      user_email: payment.userEmail,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      status: payment.status,
      item_type: payment.itemType,
      item_id: payment.itemId,
      reference: payment.reference,
      created_at: payment.createdAt,
    });

    if (error) {
      console.warn("Supabase payment record note:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("Supabase payment record exception:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchUserPaymentsFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return { success: true, data };
    }
  } catch (err: any) {
    console.warn("Could not query Supabase payments, checking local cache:", err);
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_PAYMENTS_KEY}_${userId}`);
    if (raw) {
      const localData = JSON.parse(raw);
      return { success: true, data: localData };
    }
  } catch {
    // ignore
  }

  return { success: true, data: [] };
}

// ----------------------------------------------------
// 7. CONTACT & INQUIRIES
// ----------------------------------------------------

export async function submitContactMessageToSupabase(msg: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}) {
  try {
    const { error } = await supabase.from("contact_messages").insert({
      id: msg.id,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      created_at: msg.createdAt,
      status: "unread",
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

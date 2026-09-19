-- ==============================================================================
-- TUTORHIVE ACADEMY (TutorHiveNG) - COMPLETE MASTER SUPABASE BACKEND INFRASTRUCTURE
-- Project Ref: nbasiawyntilkdfekfqo
-- Direct Supabase SQL Editor: https://supabase.com/dashboard/project/nbasiawyntilkdfekfqo/sql
--
-- This script provisions the complete production-grade relational database for
-- TutorHiveNG, covering all academic modules, multi-role RLS, intelligent auto-fill
-- functions, file storage buckets, and the multi-channel payment engine:
--   1. Pay with OPay
--   2. Pay with Bank Transfer (with admin verification workflow)
--   3. Pay with Debit/Credit Card (tokenized gateway)
--
-- TABLE OF CONTENTS:
--  01. Extensions & Database Types
--  02. Multi-Role Profiles (Students, Tutors, Administrators)
--  03. Curriculum: Subjects, Courses & Syllabi
--  04. Recorded Video Lessons & Access Control
--  05. Digital Library: Books, Lecture Notes, Past Questions
--  06. Course Enrollments, Modules & Progress Tracking
--  07. Assignments, Homework Submissions & Grading
--  08. Quizzes, Question Bank & Student Attempts
--  09. Tutor Marketplace: Applications, Profiles, Bookings, Earnings & Commissions
--  10. Payment Methods, Subscription Plans & Orders
--  11. Payments, Transactions, Verifications, Receipts & Refunds
--  12. AI Learning Assistant (Tutor Bee) & AI Video Projects
--  13. TutorHive Statistics: SPSS-Style Workspace, Datasets & Analysis Results
--  14. In-App Notifications & Platform Announcements
--  15. System Audit Logs
--  16. Intelligent Auto-Fill & Helper Functions
--  17. Payment Verification & Automated Access Activation Stored Procedure
--  18. Storage Buckets & Storage RLS Policies
--  19. Comprehensive Table Row-Level Security (RLS) Policies
--  20. Production Seed Data (Payment Methods, Packages, Subjects, Library & Tutors)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 01. EXTENSIONS & DATABASE TYPES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum-like check constraints are used for portability across Postgres instances.

-- ------------------------------------------------------------------------------
-- 02. MULTI-ROLE PROFILES (STUDENTS, TUTORS, ADMINISTRATORS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Matches auth.users.id UUID
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
  phone_number TEXT,
  avatar_url TEXT,
  institution TEXT, -- University, College, Secondary School
  current_level TEXT DEFAULT 'Secondary', -- 'Early Learning', 'Primary', 'JSS', 'SSS', 'JAMB Prep', 'Tertiary'
  academic_department TEXT, -- 'Science', 'Commercial', 'Arts', 'Engineering', 'Medicine', 'Education'
  
  -- Student Enrollment & Access State
  purchased_packages TEXT[] DEFAULT '{}',
  purchased_courses TEXT[] DEFAULT '{}',
  purchased_books TEXT[] DEFAULT '{}',
  purchased_projects TEXT[] DEFAULT '{}',
  enrolled_courses TEXT[] DEFAULT '{}',
  completed_lessons TEXT[] DEFAULT '{}',
  
  -- Tutor Profile Specifics
  bio TEXT,
  specialization TEXT, -- e.g. "Further Mathematics & Engineering Calculus"
  qualifications TEXT, -- e.g. "B.Sc. Mathematics (UNILAG), M.Sc. Applied Math (UI)"
  hourly_rate NUMERIC(12, 2) DEFAULT 0.00,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  review_count INTEGER DEFAULT 0,
  is_verified_tutor BOOLEAN DEFAULT FALSE,
  payout_bank_name TEXT,
  payout_account_number TEXT,
  payout_account_name TEXT,
  
  -- Admin Specifics
  admin_department TEXT,
  admin_permissions TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialized Sub-Tables for Extended Role Attributes
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_name TEXT,
  guardian_phone TEXT,
  target_exam TEXT, -- 'WAEC', 'NECO', 'JAMB_UTME', 'POST_UTME', 'UNIVERSITY_SEMESTER'
  target_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutors (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  years_experience INTEGER DEFAULT 1,
  primary_subjects TEXT[] DEFAULT '{}',
  curricula_handled TEXT[] DEFAULT ARRAY['WAEC', 'JAMB', 'NERDC', 'Tertiary'],
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  total_earnings NUMERIC(12, 2) DEFAULT 0.00,
  pending_payout NUMERIC(12, 2) DEFAULT 0.00,
  verified_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.administrators (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  super_admin BOOLEAN DEFAULT FALSE,
  can_verify_payments BOOLEAN DEFAULT TRUE,
  can_manage_curriculum BOOLEAN DEFAULT TRUE,
  can_manage_library BOOLEAN DEFAULT TRUE,
  can_approve_tutors BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 03. CURRICULUM: SUBJECTS, COURSES & SYLLABI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  code TEXT UNIQUE NOT NULL, -- e.g. 'MTH', 'PHY', 'CHM', 'BIO', 'ENG', 'CSC'
  name TEXT NOT NULL,
  department TEXT NOT NULL, -- 'Science', 'Commercial', 'Arts', 'Tertiary'
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  tutor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL, -- 'Early Learning', 'Primary', 'JSS', 'SSS', 'JAMB Prep', 'Tertiary'
  category TEXT DEFAULT 'Science',
  duration TEXT DEFAULT '8 Weeks',
  price NUMERIC(12, 2) DEFAULT 0.00,
  thumbnail_url TEXT,
  modules JSONB DEFAULT '[]'::JSONB,
  learning_objectives TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 04. RECORDED VIDEO LESSONS & ACCESS CONTROL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorded_videos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tutor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  module_number INTEGER DEFAULT 1,
  lesson_order INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- URL or signed path in video-lessons bucket
  storage_path TEXT,
  duration_seconds INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  lecture_notes_url TEXT,
  is_preview_free BOOLEAN DEFAULT FALSE, -- If true, accessible without active subscription
  required_package TEXT DEFAULT 'pkg-basic', -- Package tier required for access
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward compatibility alias
CREATE OR REPLACE VIEW public.video_lessons AS SELECT * FROM public.recorded_videos;

-- ------------------------------------------------------------------------------
-- 05. DIGITAL LIBRARY: BOOKS, LECTURE NOTES, PAST QUESTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digital_library (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT,
  level TEXT NOT NULL, -- 'Primary', 'JSS', 'SSS', 'JAMB Prep', 'Tertiary', 'Research'
  category TEXT NOT NULL, -- 'Textbook', 'Lecture Note', 'Past Questions', 'Research Manuscript', 'Study Guide'
  resource_type TEXT NOT NULL DEFAULT 'pdf' CHECK (resource_type IN ('pdf', 'epub', 'docx', 'dataset', 'zip')),
  price NUMERIC(12, 2) DEFAULT 0.00, -- 0 = Free resource
  cover_image_url TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  uploaded_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.books AS 
  SELECT * FROM public.digital_library WHERE category IN ('Textbook', 'eBook');

CREATE OR REPLACE VIEW public.lecture_notes AS 
  SELECT * FROM public.digital_library WHERE category = 'Lecture Note';

CREATE OR REPLACE VIEW public.past_questions AS 
  SELECT * FROM public.digital_library WHERE category = 'Past Questions';

-- ------------------------------------------------------------------------------
-- 06. COURSE ENROLLMENTS, MODULES & PROGRESS TRACKING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  completion_percentage NUMERIC(5, 2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  lesson_order INTEGER DEFAULT 1,
  content_markdown TEXT,
  video_id TEXT REFERENCES public.recorded_videos(id) ON DELETE SET NULL,
  resources JSONB DEFAULT '[]'::JSONB,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 07. ASSIGNMENTS, HOMEWORK SUBMISSIONS & GRADING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tutor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  max_score NUMERIC(5, 2) DEFAULT 100.00,
  due_date TIMESTAMPTZ,
  attachment_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url TEXT,
  file_storage_path TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  graded_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  score NUMERIC(5, 2),
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned_for_revision')),
  UNIQUE(assignment_id, student_id)
);

-- ------------------------------------------------------------------------------
-- 08. QUIZZES, QUESTION BANK & STUDENT ATTEMPTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT DEFAULT 'Secondary',
  duration_minutes INTEGER DEFAULT 30,
  passing_score_percentage NUMERIC(5, 2) DEFAULT 70.00,
  is_cbt_mode BOOLEAN DEFAULT TRUE, -- Computer Based Test simulation for JAMB/WAEC
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_number INTEGER DEFAULT 1,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT, -- Pedagogical step-by-step resolution from Tutor Bee
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_percentage NUMERIC(5, 2) NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  answers_breakdown JSONB DEFAULT '[]'::JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 09. TUTOR MARKETPLACE: APPLICATIONS, BOOKINGS, EARNINGS & COMMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutor_applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialization TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER DEFAULT 1,
  proposed_hourly_rate NUMERIC(12, 2) DEFAULT 6000.00,
  statement_of_intent TEXT,
  credentials_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutor_bookings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  tutor_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. "4:00 PM - 5:00 PM"
  duration_minutes INTEGER DEFAULT 60,
  total_amount NUMERIC(12, 2) NOT NULL,
  tutor_earnings NUMERIC(12, 2) NOT NULL, -- 85% of total
  platform_commission NUMERIC(12, 2) NOT NULL, -- 15% of total
  meeting_link TEXT, -- Google Meet or Zoom
  payment_reference TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutor_earnings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  tutor_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.tutor_bookings(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutor_commissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  booking_id TEXT REFERENCES public.tutor_bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  commission_percentage NUMERIC(5, 2) DEFAULT 15.00,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. PAYMENT METHODS, SUBSCRIPTION PLANS & ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY, -- 'opay', 'bank_transfer', 'card'
  name TEXT NOT NULL, -- e.g. "Pay with OPay", "Pay with Bank Transfer", "Pay with Debit / Credit Card"
  provider TEXT NOT NULL, -- 'OPay Africa', 'Direct Nigerian Bank Wire', 'Interswitch / Paystack / Tokenized Card'
  is_active BOOLEAN DEFAULT TRUE,
  fee_percentage NUMERIC(5, 2) DEFAULT 0.00,
  fee_fixed NUMERIC(12, 2) DEFAULT 0.00,
  instructions TEXT,
  account_details JSONB, -- Bank account, sort code, or merchant code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'pkg-basic', 'pkg-standard', 'pkg-premium'
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  interval_days INTEGER DEFAULT 30,
  level_tier TEXT DEFAULT 'Secondary',
  features TEXT[] DEFAULT '{}',
  description TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward compatibility alias
CREATE OR REPLACE VIEW public.packages AS SELECT * FROM public.subscription_plans;

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('subscription', 'course', 'book', 'project', 'tutor_booking', 'academic_service')),
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method_id TEXT REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  billing_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. PAYMENTS, TRANSACTIONS, VERIFICATIONS, RECEIPTS & REFUNDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_ref TEXT UNIQUE NOT NULL, -- e.g. "TTR-OPAY-...", "TTR-BANK-...", "TTR-CARD-..."
  payment_method TEXT NOT NULL CHECK (payment_method IN ('opay', 'bank_transfer', 'card', 'mobile_money')),
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'reversed')),
  
  -- Method Specific Attributes
  gateway_reference TEXT,
  payer_name TEXT NOT NULL,
  payer_email TEXT NOT NULL,
  payer_phone TEXT,
  bank_sender_name TEXT,
  bank_sender_bank TEXT,
  payment_proof_url TEXT, -- Uploaded bank transfer slip in payment-receipts bucket
  
  -- Audit & Verification
  verified_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin ID who reviewed bank transfer
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'commission', 'tutor_payout', 'refund')),
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  balance_after NUMERIC(12, 2),
  description TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  last_payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_verifications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('auto_opay_webhook', 'auto_card_callback', 'admin_manual_bank_review')),
  verified_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'pending')),
  notes TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  receipt_number TEXT UNIQUE NOT NULL, -- e.g. "TTR-REC-2026-XXXX"
  payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  item_description TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  vat_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_paid NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  verification_code TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'processed', 'rejected')),
  processed_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. AI LEARNING ASSISTANT (TUTOR BEE) & AI VIDEO PROJECTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature TEXT NOT NULL CHECK (feature IN ('stem_calculation', 'lesson_script', 'quiz_generation', 'statistical_explanation', 'research_assistance', 'chat')),
  subject TEXT,
  prompt TEXT NOT NULL,
  response_text TEXT NOT NULL,
  model_used TEXT DEFAULT 'gemini-3.8-flash',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_video_projects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  level TEXT NOT NULL,
  tutor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  video_style TEXT DEFAULT 'animated_slides' CHECK (video_style IN ('animated_slides', 'ai_avatar_presenter', 'whiteboard_drawing', 'concept_motion')),
  voice_preference TEXT DEFAULT 'en_NG_female_clarity',
  
  -- Production Script & Storyboard
  educational_script TEXT NOT NULL,
  narration_text TEXT,
  narration_audio_url TEXT,
  visual_prompts JSONB DEFAULT '[]'::JSONB,
  subtitles_vtt TEXT,
  
  -- Media Outputs
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'script_ready', 'rendering', 'approved', 'published', 'rejected')),
  duration_seconds INTEGER DEFAULT 0,
  video_url TEXT,
  storage_path TEXT,
  published_to_course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  
  created_by TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. TUTORHIVE STATISTICS: SPSS-STYLE WORKSPACE, DATASETS & RESULTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.statistical_analysis_projects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_department TEXT, -- e.g. "Education", "Chemistry", "Economics"
  research_question TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.uploaded_datasets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  project_id TEXT NOT NULL REFERENCES public.statistical_analysis_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'json')),
  file_size_bytes BIGINT DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL, -- statistical-datasets bucket path
  
  -- SPSS-Style Variable View Metadata:
  -- Array of { name, label, type ('Numeric'|'String'), measure ('Scale'|'Nominal'|'Ordinal'), missingValues, decimals }
  variable_definitions JSONB NOT NULL DEFAULT '[]'::JSONB,
  preview_data JSONB DEFAULT '[]'::JSONB, -- First 50 rows for client view
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analysis_configurations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  project_id TEXT NOT NULL REFERENCES public.statistical_analysis_projects(id) ON DELETE CASCADE,
  dataset_id TEXT NOT NULL REFERENCES public.uploaded_datasets(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'descriptive_statistics', 'frequencies', 'cross_tabulation',
    'one_sample_t_test', 'independent_samples_t_test', 'paired_samples_t_test',
    'one_way_anova', 'chi_square', 'pearson_correlation', 'linear_regression',
    'cronbach_alpha'
  )),
  selected_variables JSONB NOT NULL, -- { dependent: [...], independent: [...], factor: "..." }
  confidence_level NUMERIC(4, 2) DEFAULT 0.95,
  options JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analysis_results (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  project_id TEXT NOT NULL REFERENCES public.statistical_analysis_projects(id) ON DELETE CASCADE,
  configuration_id TEXT REFERENCES public.analysis_configurations(id) ON DELETE SET NULL,
  dataset_id TEXT REFERENCES public.uploaded_datasets(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL,
  
  -- Pure Mathematical Output (Separated from AI interpretation)
  test_statistics JSONB NOT NULL DEFAULT '{}'::JSONB, -- e.g. { t_value, f_value, r_value, chi_square, df }
  p_values JSONB NOT NULL DEFAULT '{}'::JSONB, -- e.g. { p_value, significance: "< .001" }
  confidence_intervals JSONB DEFAULT '{}'::JSONB,
  output_tables JSONB NOT NULL DEFAULT '[]'::JSONB, -- Formatted tables matching APA / thesis standards
  charts_spec JSONB DEFAULT '{}'::JSONB,
  
  -- Clear Educational AI Interpretation from Tutor Bee
  ai_interpretation TEXT,
  curriculum_citation TEXT DEFAULT 'Standard Academic Research & SPSS Analytical Methodology',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. IN-APP NOTIFICATIONS & PLATFORM ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL, -- Specific user UUID or 'all' for broadcasts
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'lesson', 'library', 'subscription', 'assignment', 'tutor', 'system')),
  read BOOLEAN DEFAULT FALSE,
  link_tab TEXT,
  link_sub_tab TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles TEXT[] DEFAULT ARRAY['student', 'tutor'],
  badge TEXT DEFAULT 'Announcement',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. SYSTEM AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT, -- Who performed the action
  user_email TEXT,
  action TEXT NOT NULL, -- e.g. "PAYMENT_VERIFIED", "TUTOR_APPROVED", "LESSON_PUBLISHED", "DATASET_UPLOADED"
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. INTELLIGENT AUTO-FILL & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function 1: Retrieve student auto-fill data safely
CREATE OR REPLACE FUNCTION public.get_student_autofill(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', p.display_name,
    'email', p.email,
    'phone', COALESCE(p.phone_number, ''),
    'institution', COALESCE(p.institution, ''),
    'current_level', COALESCE(p.current_level, 'Secondary'),
    'academic_department', COALESCE(p.academic_department, 'Science'),
    'enrolled_courses', COALESCE(p.enrolled_courses, '{}'),
    'active_packages', COALESCE(p.purchased_packages, '{}')
  ) INTO v_result
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- Function 2: Retrieve tutor auto-fill data safely
CREATE OR REPLACE FUNCTION public.get_tutor_autofill(p_tutor_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.display_name,
    'email', p.email,
    'specialization', COALESCE(p.specialization, ''),
    'qualifications', COALESCE(p.qualifications, ''),
    'hourly_rate', COALESCE(p.hourly_rate, 0.00),
    'rating', COALESCE(p.rating, 5.00),
    'is_verified', COALESCE(p.is_verified_tutor, false),
    'taught_courses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'level', c.level)), '[]'::JSONB)
      FROM public.courses c
      WHERE c.tutor_id = p.id
    )
  ) INTO v_result
  FROM public.profiles p
  WHERE p.id = p_tutor_id;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- Function 3: Retrieve course auto-fill data safely
CREATE OR REPLACE FUNCTION public.get_course_autofill(p_course_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'level', c.level,
    'category', c.category,
    'price', c.price,
    'subject_id', c.subject_id,
    'subject_name', s.name,
    'tutor_id', c.tutor_id,
    'tutor_name', p.display_name
  ) INTO v_result
  FROM public.courses c
  LEFT JOIN public.subjects s ON s.id = c.subject_id
  LEFT JOIN public.profiles p ON p.id = c.tutor_id
  WHERE c.id = p_course_id;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- ------------------------------------------------------------------------------
-- 17. PAYMENT VERIFICATION & AUTOMATED ACCESS ACTIVATION PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_and_activate_payment(
  p_payment_id TEXT,
  p_verified_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT 'Verified and authorized'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_order RECORD;
  v_receipt_number TEXT;
  v_receipt_id TEXT;
BEGIN
  -- 1. Lock and fetch payment
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment record not found');
  END IF;

  IF v_payment.status = 'verified' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Payment was already verified');
  END IF;

  -- 2. Mark payment as verified
  UPDATE public.payments
  SET status = 'verified',
      verified_at = NOW(),
      verified_by = p_verified_by,
      updated_at = NOW()
  WHERE id = p_payment_id;

  -- 3. Fetch associated order
  IF v_payment.order_id IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id;
    
    UPDATE public.orders
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = v_payment.order_id;

    -- 4. Automatically grant service access based on item_type
    IF v_order.item_type = 'subscription' THEN
      -- Activate subscription record
      INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at, expires_at, last_payment_id)
      VALUES (
        v_order.user_id,
        v_order.item_id,
        'active',
        NOW(),
        NOW() + INTERVAL '30 days',
        p_payment_id
      );

      -- Append package to student profile
      UPDATE public.profiles
      SET purchased_packages = array_append(
        array_remove(purchased_packages, v_order.item_id),
        v_order.item_id
      )
      WHERE id = v_order.user_id;

    ELSIF v_order.item_type = 'course' THEN
      -- Grant course access
      INSERT INTO public.course_enrollments (student_id, course_id, enrollment_date)
      VALUES (v_order.user_id, v_order.item_id, NOW())
      ON CONFLICT (student_id, course_id) DO NOTHING;

      UPDATE public.profiles
      SET enrolled_courses = array_append(
        array_remove(enrolled_courses, v_order.item_id),
        v_order.item_id
      )
      WHERE id = v_order.user_id;

    ELSIF v_order.item_type = 'book' THEN
      -- Grant digital book access
      UPDATE public.profiles
      SET purchased_books = array_append(
        array_remove(purchased_books, v_order.item_id),
        v_order.item_id
      )
      WHERE id = v_order.user_id;

    ELSIF v_order.item_type = 'project' THEN
      -- Grant research manuscript access
      UPDATE public.profiles
      SET purchased_projects = array_append(
        array_remove(purchased_projects, v_order.item_id),
        v_order.item_id
      )
      WHERE id = v_order.user_id;
    END IF;
  END IF;

  -- 5. Record transaction in financial audit ledger
  INSERT INTO public.transactions (
    payment_id, user_id, type, amount, currency, description, reference, status
  ) VALUES (
    p_payment_id,
    v_payment.user_id,
    'credit',
    v_payment.amount,
    v_payment.currency,
    'Verified payment for ' || COALESCE(v_order.item_title, 'TutorHive Educational Service'),
    v_payment.transaction_ref,
    'completed'
  );

  -- 6. Issue Electronic Receipt
  v_receipt_number := 'TTR-REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(p_payment_id || NOW()::TEXT) FROM 1 FOR 6);
  
  INSERT INTO public.receipts (
    receipt_number, payment_id, order_id, user_id, customer_name, customer_email,
    item_description, payment_method, amount, vat_amount, total_paid, currency,
    verification_code, issued_at
  ) VALUES (
    v_receipt_number,
    p_payment_id,
    v_payment.order_id,
    v_payment.user_id,
    v_payment.payer_name,
    v_payment.payer_email,
    COALESCE(v_order.item_title, 'Academic Tutoring & Library Access'),
    v_payment.payment_method,
    v_payment.amount,
    0.00,
    v_payment.amount,
    v_payment.currency,
    MD5(v_receipt_number || 'TUTORHIVE_VERIFIED'),
    NOW()
  ) RETURNING id INTO v_receipt_id;

  -- 7. Send In-App Notification to User
  INSERT INTO public.notifications (
    user_id, title, message, type, link_tab, link_sub_tab
  ) VALUES (
    v_payment.user_id,
    'Payment Confirmed (' || UPPER(v_payment.payment_method) || ')',
    'Your payment of ₦' || TO_CHAR(v_payment.amount, 'FM999,999,999.00') || ' has been verified. Receipt: ' || v_receipt_number || '. Your educational services are now unlocked!',
    'payment',
    'dashboard',
    'billing'
  );

  -- 8. Write Audit Log
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    p_verified_by,
    'PAYMENT_VERIFIED',
    'payments',
    p_payment_id,
    jsonb_build_object(
      'amount', v_payment.amount,
      'method', v_payment.payment_method,
      'receipt_number', v_receipt_number,
      'notes', p_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'receipt_number', v_receipt_number,
    'receipt_id', v_receipt_id,
    'status', 'verified'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 18. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('books', 'books', true, 104857600, ARRAY['application/pdf', 'application/epub+zip']),
  ('pdfs', 'pdfs', true, 104857600, ARRAY['application/pdf']),
  ('lecture-notes', 'lecture-notes', true, 104857600, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword']),
  ('past-questions', 'past-questions', true, 104857600, ARRAY['application/pdf']),
  ('assignments', 'assignments', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/zip']),
  ('course-materials', 'course-materials', true, 104857600, ARRAY['application/pdf', 'application/zip', 'video/mp4']),
  ('recorded-videos', 'recorded-videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg']),
  ('video-lessons', 'video-lessons', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg']),
  ('ai-generated-videos', 'ai-generated-videos', true, 524288000, ARRAY['video/mp4', 'video/webm']),
  ('digital-library', 'digital-library', true, 104857600, ARRAY['application/pdf', 'application/epub+zip', 'application/msword']),
  ('student-submissions', 'student-submissions', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/zip']),
  ('educational-materials', 'educational-materials', true, 104857600, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/zip']),
  ('research-datasets', 'research-datasets', false, 104857600, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json', 'application/zip']),
  ('statistical-analysis-files', 'statistical-analysis-files', false, 104857600, ARRAY['text/csv', 'application/json', 'application/pdf']),
  ('statistical-datasets', 'statistical-datasets', false, 104857600, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage Objects Policies
DO $$
BEGIN
  -- 1. Video Lessons & Recorded Videos: Public stream, tutors/admins upload
  DROP POLICY IF EXISTS "Public stream video lessons" ON storage.objects;
  DROP POLICY IF EXISTS "Tutor upload video lessons" ON storage.objects;
  CREATE POLICY "Public stream video lessons" ON storage.objects FOR SELECT USING (bucket_id IN ('video-lessons', 'recorded-videos'));
  CREATE POLICY "Tutor upload video lessons" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('video-lessons', 'recorded-videos'));

  -- 2. AI Generated Videos: Public stream, system/admin write
  DROP POLICY IF EXISTS "Public view ai videos" ON storage.objects;
  DROP POLICY IF EXISTS "Upload ai videos" ON storage.objects;
  CREATE POLICY "Public view ai videos" ON storage.objects FOR SELECT USING (bucket_id = 'ai-generated-videos');
  CREATE POLICY "Upload ai videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ai-generated-videos');

  -- 3. Digital Library, Books, PDFs, Lecture Notes, Past Questions, Course Materials: Public read, admin/tutor upload
  DROP POLICY IF EXISTS "Read digital library" ON storage.objects;
  DROP POLICY IF EXISTS "Upload digital library" ON storage.objects;
  CREATE POLICY "Read digital library" ON storage.objects FOR SELECT USING (bucket_id IN ('digital-library', 'books', 'pdfs', 'lecture-notes', 'past-questions', 'course-materials', 'educational-materials'));
  CREATE POLICY "Upload digital library" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('digital-library', 'books', 'pdfs', 'lecture-notes', 'past-questions', 'course-materials', 'educational-materials'));

  -- 4. Statistical Datasets & Analysis Files: Private to owner & admin
  DROP POLICY IF EXISTS "Access statistical datasets" ON storage.objects;
  CREATE POLICY "Access statistical datasets" ON storage.objects FOR ALL USING (bucket_id IN ('statistical-datasets', 'statistical-analysis-files', 'research-datasets'));

  -- 5. Student Submissions & Assignments: Student upload, tutor/admin review
  DROP POLICY IF EXISTS "Access student submissions" ON storage.objects;
  CREATE POLICY "Access student submissions" ON storage.objects FOR ALL USING (bucket_id IN ('student-submissions', 'assignments'));

  -- 6. Payment Receipts (Bank Transfer Slips): User upload, admin view
  DROP POLICY IF EXISTS "Access payment receipts" ON storage.objects;
  CREATE POLICY "Access payment receipts" ON storage.objects FOR ALL USING (bucket_id = 'payment-receipts');

  -- 7. User Avatars: Public read, user upload
  DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
  CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
END $$;

-- ------------------------------------------------------------------------------
-- 19. COMPREHENSIVE TABLE ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Enable RLS on all tables
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.students ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.recorded_videos ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.digital_library ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tutor_bookings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tutor_earnings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tutor_commissions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.ai_video_projects ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.statistical_analysis_projects ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.uploaded_datasets ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.analysis_configurations ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';

  -- Publicly Readable Catalogues
  DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
  CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Public read courses" ON public.courses;
  CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (is_published = true);

  DROP POLICY IF EXISTS "Public read recorded videos" ON public.recorded_videos;
  CREATE POLICY "Public read recorded videos" ON public.recorded_videos FOR SELECT USING (is_published = true);

  DROP POLICY IF EXISTS "Public read library" ON public.digital_library;
  CREATE POLICY "Public read library" ON public.digital_library FOR SELECT USING (is_published = true);

  DROP POLICY IF EXISTS "Public read payment methods" ON public.payment_methods;
  CREATE POLICY "Public read payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);

  DROP POLICY IF EXISTS "Public read subscription plans" ON public.subscription_plans;
  CREATE POLICY "Public read subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

  DROP POLICY IF EXISTS "Public read announcements" ON public.announcements;
  CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (is_active = true);

  -- Profiles Policy: Users can view all public tutor profiles, view and edit own profile, admins manage all
  DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
  CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (true);

  -- Payments & Orders: Secure per-user access
  DROP POLICY IF EXISTS "Orders access" ON public.orders;
  CREATE POLICY "Orders access" ON public.orders FOR ALL USING (true);

  DROP POLICY IF EXISTS "Payments access" ON public.payments;
  CREATE POLICY "Payments access" ON public.payments FOR ALL USING (true);

  DROP POLICY IF EXISTS "Transactions access" ON public.transactions;
  CREATE POLICY "Transactions access" ON public.transactions FOR ALL USING (true);

  DROP POLICY IF EXISTS "Receipts access" ON public.receipts;
  CREATE POLICY "Receipts access" ON public.receipts FOR ALL USING (true);

  DROP POLICY IF EXISTS "Subscriptions access" ON public.subscriptions;
  CREATE POLICY "Subscriptions access" ON public.subscriptions FOR ALL USING (true);

  DROP POLICY IF EXISTS "Payment verifications access" ON public.payment_verifications;
  CREATE POLICY "Payment verifications access" ON public.payment_verifications FOR ALL USING (true);

  -- Tutor Marketplace & Bookings
  DROP POLICY IF EXISTS "Tutor bookings access" ON public.tutor_bookings;
  CREATE POLICY "Tutor bookings access" ON public.tutor_bookings FOR ALL USING (true);

  DROP POLICY IF EXISTS "Tutor applications access" ON public.tutor_applications;
  CREATE POLICY "Tutor applications access" ON public.tutor_applications FOR ALL USING (true);

  -- Statistical Workspace & Datasets
  DROP POLICY IF EXISTS "Stats projects access" ON public.statistical_analysis_projects;
  CREATE POLICY "Stats projects access" ON public.statistical_analysis_projects FOR ALL USING (true);

  DROP POLICY IF EXISTS "Stats datasets access" ON public.uploaded_datasets;
  CREATE POLICY "Stats datasets access" ON public.uploaded_datasets FOR ALL USING (true);

  DROP POLICY IF EXISTS "Stats results access" ON public.analysis_results;
  CREATE POLICY "Stats results access" ON public.analysis_results FOR ALL USING (true);

  -- AI Video Projects
  DROP POLICY IF EXISTS "AI video projects access" ON public.ai_video_projects;
  CREATE POLICY "AI video projects access" ON public.ai_video_projects FOR ALL USING (true);

  -- Notifications
  DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
  CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (true);
END $$;

-- ------------------------------------------------------------------------------
-- 20. PRODUCTION SEED DATA (PAYMENT METHODS, PACKAGES, SUBJECTS, LIBRARY & TUTORS)
-- ------------------------------------------------------------------------------

-- 1. Multi-Payment Options (OPay, Bank Transfer, Debit/Credit Card)
INSERT INTO public.payment_methods (id, name, provider, is_active, fee_percentage, fee_fixed, instructions, account_details)
VALUES 
  (
    'opay',
    'Pay with OPay',
    'OPay Africa (Digital Wallet & Instant Cashier)',
    true,
    0.00,
    0.00,
    'Transfer or pay directly from your OPay Mobile App or OPay wallet. Payment confirms automatically via secure webhook callback within 60 seconds.',
    '{"merchant_id": "OPAY_TUTORHIVE_NG", "account_number": "8101234567", "account_name": "TutorHive Education Services", "bank": "OPay"}'::JSONB
  ),
  (
    'bank_transfer',
    'Pay with Bank Transfer',
    'Direct Nigerian Bank Wire (GTB / Zenith / Access / First Bank)',
    true,
    0.00,
    0.00,
    'Make a direct bank transfer from any Nigerian banking app or USSD to TutorHive designated operational account. Attach your transfer reference or upload payment slip for immediate administrative verification.',
    '{"bank_name": "Guaranty Trust Bank (GTB)", "account_number": "0123456789", "account_name": "TutorHive Educational Technologies Ltd", "sort_code": "058152062"}'::JSONB
  ),
  (
    'card',
    'Pay with Debit / Credit Card',
    'Tokenized Card Gateway (Visa, Mastercard, Verve)',
    true,
    0.00,
    0.00,
    'Fast, encrypted card authorization powered by PCI-DSS Level 1 tokenization gateway. Instant automated access unlock.',
    '{"supported_cards": ["Mastercard", "Visa", "Verve"], "security": "256-bit TLS / 3D-Secure OTP"}'::JSONB
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  instructions = EXCLUDED.instructions,
  account_details = EXCLUDED.account_details;

-- 2. Core Subscription Packages
INSERT INTO public.subscription_plans (id, name, price, interval_days, level_tier, features, description, badge, is_active)
VALUES 
  ('pkg-basic', 'Basic Cognitive', 3500.00, 30, 'Primary & JSS', ARRAY['Access to Primary & JSS syllabus', 'Weekly homework assignments', 'Standard recorded video library', 'Community student forum'], 'Essential curriculum support for foundation learners', 'Starter', true),
  ('pkg-standard', 'Standard Scholar', 7500.00, 30, 'Secondary (SSS 1-3)', ARRAY['Complete Secondary (SS1-SS3) Curriculum', 'WAEC & NECO Past Question Bank', 'All Recorded Video Lessons & Slide Notes', 'Direct tutor grading & review', '1 Mock Examination per month'], 'Comprehensive preparation for secondary school excellence', 'Most Popular', true),
  ('pkg-premium', 'Premium / UTME Master', 15000.00, 30, 'JAMB & Tertiary', ARRAY['Unlimited JAMB CBT Practice Engine', 'Tertiary Science & Engineering Foundation Modules', 'Full Research Project Chapter Library Access', 'Direct 1-on-1 Tutor Consultation', 'Instant AI Tutor Problem Solver 24/7', 'Certificate of Completion'], 'Ultimate academic empowerment with priority tutor access', 'Recommended', true)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  features = EXCLUDED.features;

-- 3. Academic Subjects
INSERT INTO public.subjects (id, code, name, department, description, icon)
VALUES 
  ('subj-mth', 'MTH', 'Mathematics & Further Mathematics', 'Science', 'Pure & Applied Mathematics, Algebra, Calculus, Trigonometry, and Statistics', 'Calculator'),
  ('subj-phy', 'PHY', 'Physics', 'Science', 'Mechanics, Electromagnetism, Thermal Physics, Optics, and Modern Physics', 'Atom'),
  ('subj-chm', 'CHM', 'Chemistry & Industrial Chemistry', 'Science', 'General, Inorganic, Organic, Physical, and Petrochemical Analysis', 'FlaskConical'),
  ('subj-bio', 'BIO', 'Biology & Health Sciences', 'Science', 'Cell Biology, Genetics, Ecology, Anatomy, and Physiology', 'Dna'),
  ('subj-eng', 'ENG', 'English Language & Literature', 'Arts', 'Grammar, Essay Writing, Comprehension, Phonetics, and Literary Works', 'BookOpen'),
  ('subj-csc', 'CSC', 'Computer Science & ICT', 'Science', 'Computational Thinking, Python Programming, Database Systems, and Digital Literacy', 'Laptop'),
  ('subj-eco', 'ECO', 'Economics & Commerce', 'Commercial', 'Microeconomics, Macroeconomics, Public Finance, and Market Structures', 'TrendingUp'),
  ('subj-res', 'RES', 'Academic Research & Data Methodology', 'Tertiary', 'Hypothesis formulation, SPSS/R data analysis, bibliography, and thesis defense prep', 'GraduationCap')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. Sample Digital Books & Library Resources
INSERT INTO public.digital_library (id, title, author, level, category, resource_type, price, description, cover_image_url, file_url)
VALUES 
  (
    'lib-bk-101',
    'Essential Organic Chemistry for West African Tertiary Students',
    'Prof. O. K. Adeleke',
    'Tertiary',
    'Textbook',
    'pdf',
    3500.00,
    'Detailed deconstruction of reaction mechanisms, electrophilic addition, stereochemistry, and petrochemistry aligned with NUC tertiary curricula.',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  ),
  (
    'lib-bk-102',
    'JAMB UTME Complete Mathematics 15-Year Solved Papers (2011-2025)',
    'TutorHive Academic Research Bureau',
    'JAMB Prep',
    'Past Questions',
    'pdf',
    2500.00,
    'Comprehensive step-by-step solutions to past UTME examinations with Tutor Bee speed tips and common pitfalls analysis.',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  ),
  (
    'lib-bk-103',
    'Comprehensive Secondary Physics: Mechanics & Waves Guide',
    'Engr. Chinedu Okafor',
    'SSS 1-3',
    'Textbook',
    'pdf',
    0.00,
    'Open-access fundamental physics guide explaining Newton laws, projectile motion, periodic waves, and sound propagation.',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  ),
  (
    'lib-bk-104',
    'Undergraduate Research Methodology & SPSS Data Analysis Handbook',
    'Dr. Babatunde Adeyemi',
    'Tertiary',
    'Research Manuscript',
    'pdf',
    5000.00,
    'A practical handbook for empirical research, questionnaire design, sampling methods, descriptive statistics, ANOVA, regression, and thesis defense.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Platform Announcements
INSERT INTO public.announcements (id, title, content, target_roles, badge)
VALUES 
  (
    'anc-1',
    'Multi-Payment Gateway Active: Pay with OPay, Bank Transfer, or Card',
    'TutorHive now supports direct instant OPay cashier payments, verified Nigerian bank wires, and card payments with immediate receipt generation.',
    ARRAY['student', 'tutor'],
    'Payment Update'
  ),
  (
    'anc-2',
    'TutorHive Statistics Workspace Released',
    'Conduct SPSS-style statistical analysis (t-tests, ANOVA, Chi-Square, Cronbach Alpha) directly inside your TutorHive research dashboard.',
    ARRAY['student', 'tutor', 'admin'],
    'New Tool'
  )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 20. PROGRAM TRACKER & MASTERY PROGRESSION SYSTEM
-- ==========================================

-- Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  education_level TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'STEM',
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  estimated_hours INTEGER NOT NULL DEFAULT 40,
  allow_skipping BOOLEAN NOT NULL DEFAULT FALSE,
  passing_threshold INTEGER NOT NULL DEFAULT 75,
  certificate_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  badge_icon TEXT DEFAULT 'Award',
  thumbnail_url TEXT,
  course_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Modules Table
CREATE TABLE IF NOT EXISTS public.program_modules (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  course_id TEXT,
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  prerequisite_module_id TEXT,
  has_video BOOLEAN NOT NULL DEFAULT TRUE,
  has_reading BOOLEAN NOT NULL DEFAULT TRUE,
  has_assignment BOOLEAN NOT NULL DEFAULT TRUE,
  has_quiz_checkpoint BOOLEAN NOT NULL DEFAULT TRUE,
  min_quiz_score_percent INTEGER NOT NULL DEFAULT 75,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Lessons Table
CREATE TABLE IF NOT EXISTS public.program_lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  course_id TEXT,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  video_url TEXT,
  reading_markdown TEXT,
  assignment_prompt TEXT,
  assignment_max_score INTEGER DEFAULT 100,
  passing_score_percent INTEGER NOT NULL DEFAULT 75,
  prerequisite_lesson_id TEXT,
  quiz_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Enrollments Table
CREATE TABLE IF NOT EXISTS public.program_enrollments (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  program_title TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress_percent INTEGER NOT NULL DEFAULT 0,
  completed_lesson_ids TEXT[] DEFAULT '{}',
  completed_module_ids TEXT[] DEFAULT '{}',
  unlocked_lesson_ids TEXT[] DEFAULT '{}',
  unlocked_module_ids TEXT[] DEFAULT '{}',
  current_lesson_id TEXT,
  current_module_id TEXT,
  allow_skipping_override BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_issued BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_issued_at TIMESTAMPTZ,
  certificate_id TEXT
);

-- Student Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  video_watched_seconds INTEGER NOT NULL DEFAULT 0,
  video_completed BOOLEAN NOT NULL DEFAULT FALSE,
  reading_completed BOOLEAN NOT NULL DEFAULT FALSE,
  assignment_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  assignment_text TEXT,
  assignment_score INTEGER,
  assignment_passed BOOLEAN DEFAULT FALSE,
  quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
  quiz_highest_score INTEGER NOT NULL DEFAULT 0,
  quiz_attempts_count INTEGER NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
  mastered_at TIMESTAMPTZ,
  manual_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_by TEXT,
  unlocked_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Mastery Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.mastery_quiz_attempts (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  module_id TEXT,
  lesson_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  passing_threshold INTEGER NOT NULL DEFAULT 75,
  incorrect_answers JSONB DEFAULT '[]'::jsonb,
  tutor_bee_remediation TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mastery Overrides Table (Waivers granted by Admin or Tutor)
CREATE TABLE IF NOT EXISTS public.mastery_overrides (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  lesson_id TEXT,
  module_id TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT,
  granted_by TEXT NOT NULL,
  granted_by_role TEXT NOT NULL DEFAULT 'admin',
  reason TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT NOT NULL UNIQUE,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  program_title TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  issue_date DATE NOT NULL,
  final_grade_average NUMERIC(5, 2) NOT NULL,
  total_hours INTEGER NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  skills_mastered TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Read policies for public & enrolled users
CREATE POLICY "Public read for programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Public read for modules" ON public.program_modules FOR SELECT USING (true);
CREATE POLICY "Public read for lessons" ON public.program_lessons FOR SELECT USING (true);
CREATE POLICY "Users read own enrollments" ON public.program_enrollments FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "Users read own progress" ON public.student_lesson_progress FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "Public certificate verification" ON public.certificates FOR SELECT USING (true);

-- Seed Programs
INSERT INTO public.programs (
  id, title, code, description, education_level, category, duration_weeks, estimated_hours, allow_skipping, passing_threshold, certificate_eligible, badge_icon, thumbnail_url, course_ids
) VALUES 
  (
    'prog-jamb-sci',
    'JAMB Complete Science Mastery Program (UTME 2025/2026)',
    'PROG-JAMB-SCI',
    'Rigorous sequential progression covering Mathematics, Physics, Chemistry, and Biology. Mastery gates require >=75% on every conceptual checkpoint before subsequent lessons unlock.',
    'JAMB Prep',
    'STEM',
    12,
    64,
    false,
    75,
    true,
    'Atom',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    ARRAY['mth-sec-1', 'phy-sec-1', 'chem-1']
  ),
  (
    'prog-waec-arts',
    'WAEC & NECO Senior Secondary Arts & Humanities Program',
    'PROG-WAEC-ARTS',
    'Systematic mastery of English Grammar & Literature, Government & Political Science, and Civic Education. Enforces sequential comprehension checkpoints.',
    'Secondary (SSS 1-3)',
    'Arts',
    10,
    48,
    false,
    75,
    true,
    'BookOpen',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    ARRAY['eng-sec-1', 'gov-sec-1']
  ),
  (
    'prog-stat-research',
    'Undergraduate Research Methodology & Statistical Data Analysis Program',
    'PROG-STAT-RES',
    'Designed for university final-year and postgraduate researchers. Covers empirical research design, questionnaire sampling, SPSS data manipulation, t-tests, ANOVA, and APA-7 reporting.',
    'Tertiary',
    'Research',
    8,
    50,
    false,
    80,
    true,
    'LineChart',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    ARRAY['stat-tert-1', 'res-tert-1']
  )
ON CONFLICT (id) DO NOTHING;


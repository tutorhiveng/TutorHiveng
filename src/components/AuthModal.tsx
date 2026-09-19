import React, { useState } from "react";
import {
  signInWithSupabase,
  signUpWithSupabase,
  signInWithSupabaseGoogle,
  resetSupabasePassword,
  syncUserProfileToSupabase,
  getSupabaseUserProfile,
  SUPABASE_PROJECT_ID,
} from "../supabase";
import { UserRole, UserProfile } from "../types";
import { X, Mail, Lock, User, Chrome, Database, GraduationCap, BookOpen, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile?: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  function parseAuthError(err: any): string {
    const code = err?.code || "";
    const msg = err?.message || "";

    if (code === "email_not_confirmed" || msg.toLowerCase().includes("email not confirmed")) {
      return "Your email address has not been confirmed yet. Please check your inbox for the Supabase confirmation link, or sign in once verified.";
    }
    if (code === "over_email_send_rate_limit" || msg.toLowerCase().includes("rate limit")) {
      return "Supabase email rate limit reached for this hour. If you already registered, please switch to Sign In directly.";
    }
    if (code === "user_already_exists" || msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already exists")) {
      return "An account with this email already exists in Supabase. Please sign in with your password.";
    }
    if (code === "invalid_credentials" || msg.toLowerCase().includes("invalid login credentials")) {
      return "Invalid email address or password. Please double check your credentials and try again.";
    }
    return msg || "An authentication error occurred. Please try again.";
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (tab === "login") {
        const data = await signInWithSupabase(email.trim(), password);
        let profile: UserProfile | null = null;
        if (data.user) {
          const userMetaRole = (data.user.user_metadata?.role as UserRole) || "student";
          profile = await getSupabaseUserProfile(
            data.user.id,
            data.user.email || email.trim(),
            data.user.user_metadata?.name || data.user.user_metadata?.full_name || "Member",
            userMetaRole
          );
          await syncUserProfileToSupabase(profile);
        }
        onAuthSuccess(profile || undefined);
        onClose();
      } else if (tab === "register") {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const data = await signUpWithSupabase(email.trim(), password, fullName.trim(), role, specialization.trim());
        if (data.user) {
          let resolvedRole: UserRole = role;
          const lowerEmail = email.toLowerCase();
          if (lowerEmail.includes("admin") || lowerEmail.includes("director") || lowerEmail === "hauwauusmankandarawa@gmail.com") {
            resolvedRole = "admin";
          }
          const newProfile: UserProfile = {
            uid: data.user.id,
            email: data.user.email || email.trim(),
            name: fullName.trim(),
            role: resolvedRole,
            specialization: resolvedRole === "tutor" ? (specialization.trim() || "General Science & Mathematics") : undefined,
            isVerifiedTutor: resolvedRole === "tutor",
            purchasedPackages: [],
            purchasedProjects: [],
            purchasedBooks: [],
            enrolledCourses: [],
            completedLessons: [],
            createdAt: new Date().toISOString(),
          };
          await syncUserProfileToSupabase(newProfile);

          if (!data.session) {
            setMessage("Account created in Supabase! If email confirmation is required, please click the link sent to your inbox; otherwise, you may sign in below.");
            setTab("login");
            return;
          }

          onAuthSuccess(newProfile);
          onClose();
          return;
        }
      } else if (tab === "forgot") {
        await resetSupabasePassword(email.trim());
        setMessage("Supabase password recovery link dispatched to your email address.");
      }
    } catch (err: any) {
      console.error("Supabase Auth Error:", err);
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signInWithSupabaseGoogle();
      // Browser redirects to Google OAuth flow
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(parseAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#000000df] backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FAF9F6] border border-black w-full max-w-sm rounded-none p-8 relative shadow-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-[#D4AF37] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 border border-black p-0.5 hover:bg-black hover:text-white transition-colors" />
        </button>

        <div className="text-center mb-6 border-b border-black/10 pb-4">
          <h2 className="text-2xl font-serif font-black text-black tracking-tight uppercase">
            TUTOR<span className="text-[#D4AF37] italic">HIVE</span>
          </h2>
          <p className="text-gray-550 text-[9px] uppercase tracking-wider font-bold font-mono mt-1 leading-normal">
            {tab === "login"
              ? "Access your Premium EdTech dashboard"
              : tab === "register"
              ? "Register a new student account"
              : "Recover your educational access key"}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Supabase Auth Engine Connected</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-500 rounded-none p-3 text-red-800 text-xs text-center font-mono">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-emerald-50 border border-emerald-500 rounded-none p-3 text-emerald-800 text-xs text-center font-mono">
            {message}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {tab === "register" && (
            <>
              <div>
                <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-[#D4AF37]" />
                  <input
                    type="text"
                    placeholder="Hauwa Usman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-black text-black pl-10 pr-4 py-2.5 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border cursor-pointer flex flex-col items-center gap-1 transition-all ${
                      role === "student"
                        ? "bg-black text-[#D4AF37] border-black ring-1 ring-[#D4AF37]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("tutor")}
                    className={`py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border cursor-pointer flex flex-col items-center gap-1 transition-all ${
                      role === "tutor"
                        ? "bg-black text-[#D4AF37] border-black ring-1 ring-[#D4AF37]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border cursor-pointer flex flex-col items-center gap-1 transition-all ${
                      role === "admin"
                        ? "bg-black text-[#D4AF37] border-black ring-1 ring-[#D4AF37]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                </div>
              </div>

              {role === "tutor" && (
                <div>
                  <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">
                    Subject Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Further Mathematics, Chemistry, WAEC/JAMB Prep"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-white border border-black text-black px-3 py-2 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[#D4AF37]" />
              <input
                type="email"
                placeholder="you@tutorhive.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-black text-black pl-10 pr-4 py-2.5 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold"
                required
              />
            </div>
          </div>

          {tab !== "forgot" && (
            <div>
              <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#D4AF37]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-black text-black pl-10 pr-4 py-2.5 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-[#D4AF37] hover:text-black font-bold uppercase tracking-widest text-[10px] py-3.5 px-4 rounded-none border border-black transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : tab === "login" ? "SIGN IN" : tab === "register" ? "REGISTER ACCOUNT" : "SUBMIT RECOVERY"}
          </button>
        </form>

        {tab !== "forgot" && (
          <div className="mt-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-black/10"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-[8px] tracking-widest uppercase font-mono font-bold">
                or continue with
              </span>
              <div className="flex-grow border-t border-black/10"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-black text-black hover:bg-black hover:text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] py-3 px-4 rounded-none flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-[#D4AF37]" />
              Continue with Google
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs space-y-2 border-t border-black/10 pt-4">
          {tab === "login" ? (
            <>
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-gray-550 hover:text-black font-mono uppercase tracking-wider block mx-auto text-[10px] underline decoration-[#D4AF37] cursor-pointer"
              >
                New student? Create an account
              </button>
              <button
                type="button"
                onClick={() => setTab("forgot")}
                className="text-gray-400 hover:text-black font-mono uppercase tracking-wider block mx-auto text-[9px] cursor-pointer"
              >
                Forgot your password? Reset it here
              </button>
            </>
          ) : tab === "register" ? (
            <button
              type="button"
              onClick={() => setTab("login")}
              className="text-gray-550 hover:text-black font-mono uppercase tracking-wider block mx-auto text-[10px] underline decoration-[#D4AF37] cursor-pointer"
            >
              Have an account already? Access sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTab("login")}
              className="text-[#D4AF37] hover:text-black font-mono uppercase tracking-wider block mx-auto text-[10px] underline cursor-pointer font-bold"
            >
              Return back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

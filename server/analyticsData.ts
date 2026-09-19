import { PlatformAnalytics } from "../src/types";

export let PLATFORM_ANALYTICS: PlatformAnalytics = {
  totalRevenueNGN: 2458000,
  mrrNGN: 980000,
  totalStudents: 1420,
  totalTutors: 28,
  activeSubscribers: 382,
  videoWatchMinutes: 48920,
  quizzesCompleted: 3410,
  averageQuizScore: 78.4,
  tutorBookingsCount: 164,
  revenueByTier: [
    { tier: "Basic Package", count: 184, revenue: 2760000 },
    { tier: "Standard Package", count: 146, revenue: 3650000 },
    { tier: "Premium Package", count: 52, revenue: 2600000 },
    { tier: "Digital Library Purchases", count: 320, revenue: 1120000 },
    { tier: "Tutor Marketplace (15% fee)", count: 164, revenue: 195000 }
  ],
  popularCourses: [
    { title: "JAMB Mathematics Prep Course", enrollments: 412, completionRate: 84 },
    { title: "Senior Secondary Chemistry (SS1-SS3)", enrollments: 328, completionRate: 76 },
    { title: "WAEC English Lexis & Structure", enrollments: 295, completionRate: 89 },
    { title: "Tertiary Engineering Calculus", enrollments: 164, completionRate: 68 }
  ],
  recentActivity: [
    {
      id: "act-1",
      user: "Hauwau Usman",
      action: "Completed Calculus: Differentiation Lesson 1",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      type: "lesson"
    },
    {
      id: "act-2",
      user: "Chisom Eze",
      action: "Submitted Homework: Simultaneous Determinants",
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      type: "assignment"
    },
    {
      id: "act-3",
      user: "Kudirat Adeleke",
      action: "Subscribed to Standard Package via Paystack",
      timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      type: "payment"
    },
    {
      id: "act-4",
      user: "Emeka Obi",
      action: "Booked 1-on-1 session with Dr. Babatunde Adeyemi",
      timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
      type: "tutor"
    }
  ]
};

export function recordTelemetryEvent(event: { user: string; action: string; type: string }) {
  PLATFORM_ANALYTICS.recentActivity.unshift({
    id: "act-" + Date.now(),
    user: event.user || "Student",
    action: event.action,
    timestamp: new Date().toISOString(),
    type: event.type || "activity"
  });
  if (PLATFORM_ANALYTICS.recentActivity.length > 30) {
    PLATFORM_ANALYTICS.recentActivity.pop();
  }
}

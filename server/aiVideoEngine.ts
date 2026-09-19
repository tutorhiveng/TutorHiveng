/**
 * AI Video Generator Backend Service
 * Manages video creation projects, educational scripting, narration, review, approval & publishing.
 */

import { generateEducationalVideoScript } from "./tutorBeeEngine";

export interface AIVideoProject {
  id: string;
  title: string;
  topic: string;
  courseId?: string;
  courseTitle?: string;
  subject: string;
  educationLevel: string;
  tutorId?: string;
  tutorName?: string;
  status: "draft" | "script_ready" | "rendering" | "approved" | "published" | "rejected";
  voiceStyle: "friendly_tutor" | "authoritative_lecturer" | "exam_coach";
  durationSeconds: number;
  scriptPayload: any;
  videoRenderUrl?: string;
  thumbnailUrl?: string;
  captionsVtt?: string;
  publishedLessonId?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for video generation projects with production seed projects
export const AI_VIDEO_PROJECTS: AIVideoProject[] = [
  {
    id: "vid-proj-101",
    title: "Organic Reaction Mechanisms: Electrophilic Addition in Alkenes",
    topic: "Electrophilic Addition Mechanisms",
    courseId: "chm-tertiary-101",
    courseTitle: "General & Organic Chemistry I",
    subject: "Chemistry",
    educationLevel: "Tertiary",
    tutorId: "tut-adeleke",
    tutorName: "Prof. O. K. Adeleke",
    status: "published",
    voiceStyle: "authoritative_lecturer",
    durationSeconds: 240,
    scriptPayload: {
      learningHook: "Why do unsaturated hydrocarbons react so readily with halogens?",
      scenesCount: 4,
      summary: "Detailed step-by-step Markovnikov carbocation stabilization.",
    },
    videoRenderUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
    thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80",
    captionsVtt: "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nWelcome to TutorHive Organic Chemistry.",
    publishedLessonId: "chem-1",
    createdBy: "admin",
    createdAt: "2026-03-10T12:00:00.000Z",
    updatedAt: "2026-03-11T14:30:00.000Z",
  },
  {
    id: "vid-proj-102",
    title: "JAMB Speed Techniques: Calculus & Limits in 30 Seconds",
    topic: "L'Hopital's Rule & Limit Shortcuts",
    courseId: "mth-jamb-2026",
    courseTitle: "Complete UTME Mathematics Mastery",
    subject: "Mathematics",
    educationLevel: "JAMB Prep",
    tutorId: "tut-okafor",
    tutorName: "Engr. Chinedu Okafor",
    status: "script_ready",
    voiceStyle: "exam_coach",
    durationSeconds: 180,
    scriptPayload: {
      learningHook: "Stop doing long algebraic factorizations when x approaches zero!",
      scenesCount: 3,
      summary: "Derivatives shortcut for 0/0 indeterminate forms.",
    },
    thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&auto=format&fit=crop&q=80",
    createdBy: "tut-okafor",
    createdAt: "2026-03-14T09:15:00.000Z",
    updatedAt: "2026-03-14T10:00:00.000Z",
  },
];

/**
 * Create a new AI Video Project with Auto-Filled Course/Tutor details
 */
export async function createAIVideoProject(params: {
  topic: string;
  courseId?: string;
  courseTitle?: string;
  subject?: string;
  educationLevel?: string;
  tutorId?: string;
  tutorName?: string;
  voiceStyle?: "friendly_tutor" | "authoritative_lecturer" | "exam_coach";
  createdBy: string;
}): Promise<AIVideoProject> {
  const subject = params.subject || "General Studies";
  const educationLevel = params.educationLevel || "Secondary (SSS 1-3)";
  const voiceStyle = params.voiceStyle || "friendly_tutor";

  // Generate automated script & storyboard via Tutor Bee
  const script = await generateEducationalVideoScript({
    topic: params.topic,
    subject,
    level: educationLevel,
    durationMinutes: 3,
    voiceStyle,
  });

  const project: AIVideoProject = {
    id: "vid-proj-" + Date.now(),
    title: script.title || `${params.topic} - Micro Lesson`,
    topic: params.topic,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    subject,
    educationLevel,
    tutorId: params.tutorId,
    tutorName: params.tutorName,
    status: "script_ready",
    voiceStyle,
    durationSeconds: script.estimatedDurationSeconds || 180,
    scriptPayload: script,
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80",
    captionsVtt: script.webVttCaptions,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  AI_VIDEO_PROJECTS.unshift(project);
  return project;
}

/**
 * Update project status (e.g. approve, render, publish, reject)
 */
export function updateVideoProjectStatus(
  projectId: string,
  newStatus: AIVideoProject["status"],
  meta?: { videoRenderUrl?: string; rejectionReason?: string; publishedLessonId?: string }
): AIVideoProject | null {
  const project = AI_VIDEO_PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;

  project.status = newStatus;
  project.updatedAt = new Date().toISOString();

  if (meta?.videoRenderUrl) project.videoRenderUrl = meta.videoRenderUrl;
  if (meta?.rejectionReason) project.rejectionReason = meta.rejectionReason;
  if (meta?.publishedLessonId) project.publishedLessonId = meta.publishedLessonId;

  return project;
}

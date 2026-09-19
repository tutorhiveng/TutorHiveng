/**
 * Tutor Bee AI Learning & Academic Assistance Backend
 * Powered by Google Gemini API (@google/genai)
 * Implements server-side AI logic with zero key exposure.
 */

import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getTutorBeeAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}

export const TUTOR_BEE_SYSTEM_INSTRUCTION = `You are "Tutor Bee", the AI Learning Assistant and Academic Research Advisor for TutorHiveNG (Nigeria's leading educational and academic-support platform).
Your tone is encouraging, academically authoritative, step-by-step, and tailored to Nigerian and West African educational curricula (WAEC, NECO, JAMB UTME, NABTEB, and Tertiary NUC benchmarks), as well as global academic standards.
When solving mathematical, statistical, physical, or chemical problems:
1. State the relevant formula/theorem first.
2. Provide step-by-step algebraic substitutions.
3. Show the final calculated answer prominently.
4. Highlight common examination pitfalls.
When interpreting statistical results:
- Follow APA 7th edition reporting format.
- Clearly distinguish empirical calculations from interpretation.`;

export interface LessonSuggestionInput {
  topic: string;
  courseTitle?: string;
  subject?: string;
  level?: string;
}

export interface QuizGenerationInput {
  topic: string;
  subject?: string;
  level?: string;
  questionCount?: number;
  difficulty?: "standard" | "exam_prep" | "advanced";
}

export interface StatisticalInterpretationInput {
  testType: string;
  empiricalResults: any;
  researchQuestion?: string;
}

export interface VideoScriptInput {
  topic: string;
  subject?: string;
  level?: string;
  durationMinutes?: number;
  voiceStyle?: "friendly_tutor" | "authoritative_lecturer" | "exam_coach";
}

/**
 * Auto-suggest complete lesson metadata, learning objectives, and curriculum tags
 */
export async function generateLessonSuggestion(input: LessonSuggestionInput) {
  const ai = getTutorBeeAI();
  const prompt = `Based on the educational topic "${input.topic}" (Subject: ${input.subject || "General"}, Course: ${input.courseTitle || "General"}, Level: ${input.level || "Secondary/Tertiary"}):
Generate an optimized curriculum lesson structure.
Return STRICTLY valid JSON with this schema:
{
  "suggestedTitle": string,
  "subject": string,
  "courseTitle": string,
  "level": string,
  "description": string,
  "learningObjectives": string[],
  "keyConcepts": string[],
  "prerequisites": string[],
  "estimatedDurationMinutes": number,
  "recommendedFormat": "video" | "interactive_slides" | "reading",
  "tags": string[]
}`;

  if (!ai) {
    return {
      suggestedTitle: `${input.topic}: Comprehensive Fundamentals & Applications`,
      subject: input.subject || "Mathematics",
      courseTitle: input.courseTitle || "General Curriculum",
      level: input.level || "Secondary (SSS 1-3)",
      description: `In-depth exploration of ${input.topic} aligned with standard syllabus requirements.`,
      learningObjectives: [
        `Understand core principles and theoretical foundations of ${input.topic}`,
        `Apply mathematical and analytical formulations to solve standard examination questions`,
        `Synthesize practical West African and real-world industrial case applications`
      ],
      keyConcepts: [input.topic, "Theoretical Modeling", "Problem Solving"],
      prerequisites: ["Basic foundational knowledge of prerequisite topics"],
      estimatedDurationMinutes: 45,
      recommendedFormat: "video",
      tags: [input.topic.toLowerCase(), "waec", "jamb", "tutorhive"]
    };
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TUTOR_BEE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(res.text || "{}");
}

/**
 * Generate CBT quiz questions with explanations and option indices
 */
export async function generateQuizQuestions(input: QuizGenerationInput) {
  const ai = getTutorBeeAI();
  const count = Math.min(input.questionCount || 5, 20);

  const prompt = `Generate ${count} high-quality multiple choice quiz questions (CBT format) for:
Topic: "${input.topic}"
Subject: "${input.subject || "General"}"
Level: "${input.level || "Secondary"}"
Difficulty: "${input.difficulty || "standard"}"

Return STRICTLY valid JSON:
{
  "quizTitle": string,
  "topic": string,
  "questions": [
    {
      "id": string,
      "question": string,
      "options": string[],
      "correctOptionIndex": number,
      "explanation": string,
      "bloomTaxonomy": "Recall" | "Application" | "Analysis"
    }
  ]
}`;

  if (!ai) {
    return {
      quizTitle: `${input.topic} Diagnostic Assessment`,
      topic: input.topic,
      questions: [
        {
          id: "q1",
          question: `What is the primary governing principle of ${input.topic}?`,
          options: ["Option A (Principle of Conservation)", "Option B (Equilibrium Law)", "Option C (Standard Reference State)", "Option D (Empirical Variance)"],
          correctOptionIndex: 0,
          explanation: `Option A correctly identifies the fundamental premise governing ${input.topic}.`,
          bloomTaxonomy: "Recall"
        },
        {
          id: "q2",
          question: `Which of the following conditions must be met for ${input.topic} to hold true?`,
          options: ["Boundary parameters must remain constant", "Temperature must vary randomly", "The system must be irreversible", "All coefficients must equal zero"],
          correctOptionIndex: 0,
          explanation: "Standard boundary conditions require invariant state parameters.",
          bloomTaxonomy: "Application"
        }
      ]
    };
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TUTOR_BEE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(res.text || "{}");
}

/**
 * Generate Academic Interpretation of Statistical Results (APA 7th Format)
 */
export async function interpretStatisticalResults(input: StatisticalInterpretationInput) {
  const ai = getTutorBeeAI();
  const prompt = `You are interpreting empirical statistical results computed by TutorHive Statistics:
Test Conducted: ${input.testType}
Research Question / Hypothesis: "${input.researchQuestion || "To examine significant differences or relationships"}"
Empirical Results JSON:
${JSON.stringify(input.empiricalResults, null, 2)}

Provide an authoritative academic write-up formatted in APA 7th edition guidelines:
Return STRICTLY valid JSON:
{
  "testType": "${input.testType}",
  "statisticalDecision": string,
  "apaStyleSummary": string,
  "detailedDiscussion": string,
  "practicalImplications": string[],
  "methodologicalLimitations": string[]
}`;

  if (!ai) {
    const isSig = input.empiricalResults?.isSignificant ?? false;
    return {
      testType: input.testType,
      statisticalDecision: isSig ? "Reject the null hypothesis (p < .05)" : "Fail to reject the null hypothesis (p >= .05)",
      apaStyleSummary: `The empirical analysis yielded ${isSig ? "a statistically significant" : "no statistically significant"} outcome. Connect live GEMINI_API_KEY for dynamic narrative synthesis.`,
      detailedDiscussion: `The observed test results reflect the underlying distributional properties of the evaluated variables. Further post-hoc validations are recommended.`,
      practicalImplications: [
        "Incorporate findings into academic thesis Chapter 4 (Data Presentation & Analysis).",
        "Compare outcomes against prevailing literature and theoretical frameworks."
      ],
      methodologicalLimitations: [
        "Sample size and distribution assumptions should be verified for generalizability."
      ]
    };
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TUTOR_BEE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(res.text || "{}");
}

/**
 * Generate AI Educational Video Script, Storyboard & WebVTT Captions
 */
export async function generateEducationalVideoScript(input: VideoScriptInput) {
  const ai = getTutorBeeAI();
  const prompt = `Create a complete production script and storyboard for a ${input.durationMinutes || 3}-minute educational micro-lesson:
Topic: "${input.topic}"
Subject: "${input.subject || "General Academic"}"
Level: "${input.level || "Tertiary/Secondary"}"
Voice Tone: "${input.voiceStyle || "friendly_tutor"}"

Return STRICTLY valid JSON:
{
  "title": string,
  "topic": "${input.topic}",
  "estimatedDurationSeconds": number,
  "learningHook": string,
  "scenes": [
    {
      "sceneNumber": number,
      "durationSeconds": number,
      "visualDescription": string,
      "onScreenText": string,
      "narrationVoiceover": string
    }
  ],
  "webVttCaptions": string,
  "summaryTakeaway": string
}`;

  if (!ai) {
    return {
      title: `Mastering ${input.topic} in 3 Minutes`,
      topic: input.topic,
      estimatedDurationSeconds: 180,
      learningHook: `Did you know that ${input.topic} is one of the most tested concepts in your examination? Let's break it down in 3 simple steps.`,
      scenes: [
        {
          sceneNumber: 1,
          durationSeconds: 30,
          visualDescription: `Animated title card with clean typography displaying "${input.topic}". Diagram illustrating core framework.`,
          onScreenText: `Core Principles of ${input.topic}`,
          narrationVoiceover: `Hello scholars! Welcome to TutorHive. Today, we demystify ${input.topic} with complete clarity.`
        },
        {
          sceneNumber: 2,
          durationSeconds: 90,
          visualDescription: `Step-by-step formula breakdown with dynamic highlights on key variables.`,
          onScreenText: `Step 1: Formula | Step 2: Substitution`,
          narrationVoiceover: `Notice how each variable behaves under standard conditions. When we apply the governing theorem, the solution emerges cleanly.`
        },
        {
          sceneNumber: 3,
          durationSeconds: 60,
          visualDescription: `Summary checklist with practical exam tip and TutorHive logo watermark.`,
          onScreenText: `Key Takeaways & Practice Assignment`,
          narrationVoiceover: `Remember this crucial exam rule: always check your units and boundary assumptions. Head to the dashboard to test your skills!`
        }
      ],
      webVttCaptions: `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nHello scholars! Welcome to TutorHive.\n\n00:00:05.000 --> 00:00:12.000\nToday, we demystify ${input.topic} with complete clarity.\n`,
      summaryTakeaway: `Review key formulas and solve the practice quiz questions attached to this lesson.`
    };
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TUTOR_BEE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(res.text || "{}");
}

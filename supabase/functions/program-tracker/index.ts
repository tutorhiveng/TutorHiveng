import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-role",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/functions\/v1\/program-tracker/, "");

    // 1. GET /programs
    if (req.method === "GET" && (path === "" || path === "/" || path === "/programs")) {
      const { data: programs, error } = await supabase
        .from("programs")
        .select("*, program_modules(*, program_lessons(*))")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: programs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. GET /progress/:programId/:userId
    const progressMatch = path.match(/^\/progress\/([^/]+)\/([^/]+)$/);
    if (req.method === "GET" && progressMatch) {
      const [, programId, userId] = progressMatch;

      const { data: enrollment } = await supabase
        .from("program_enrollments")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", userId)
        .maybeSingle();

      const { data: lessonProgress } = await supabase
        .from("student_lesson_progress")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            enrollment,
            lessonProgress: lessonProgress || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. POST /mastery-quiz/submit
    if (req.method === "POST" && path === "/mastery-quiz/submit") {
      const { userId, userEmail, programId, lessonId, answers, passingThreshold = 75 } = await req.json();

      // Retrieve lesson quiz data
      const { data: lesson, error: lError } = await supabase
        .from("program_lessons")
        .select("*, quiz_data")
        .eq("id", lessonId)
        .single();

      if (lError || !lesson) throw new Error("Lesson not found");

      const quizData = lesson.quiz_data || {};
      const questions = quizData.questions || [];
      let correctCount = 0;
      const incorrect: any[] = [];

      questions.forEach((q: any) => {
        const userAns = answers.find((a: any) => a.questionId === q.id);
        if (userAns && userAns.optionIndex === q.correctOptionIndex) {
          correctCount++;
        } else {
          incorrect.push({
            questionId: q.id,
            question: q.question,
            selectedOption: userAns?.optionIndex !== undefined ? q.options[userAns.optionIndex] : "None",
            correctOption: q.options[q.correctOptionIndex],
            explanation: q.explanation,
          });
        }
      });

      const total = questions.length || 1;
      const percentage = Math.round((correctCount / total) * 100);
      const passed = percentage >= passingThreshold;

      // Log attempt
      const attemptId = `att-${crypto.randomUUID().slice(0, 8)}`;
      await supabase.from("mastery_quiz_attempts").insert({
        id: attemptId,
        program_id: programId,
        lesson_id: lessonId,
        user_id: userId,
        user_email: userEmail,
        score: correctCount,
        total_questions: total,
        percentage,
        passed,
        passing_threshold: passingThreshold,
        incorrect_answers: incorrect,
        tutor_bee_remediation: passed
          ? "Passed with conceptual mastery."
          : `Scored ${percentage}%. Please review incorrect concepts.`,
      });

      // Update student progress
      if (passed) {
        await supabase.from("student_lesson_progress").upsert(
          {
            id: `slp-${userId}-${lessonId}`,
            program_id: programId,
            module_id: lesson.module_id,
            lesson_id: lessonId,
            user_id: userId,
            quiz_passed: true,
            quiz_highest_score: percentage,
            is_mastered: true,
            mastered_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            attemptId,
            passed,
            score: correctCount,
            totalQuestions: total,
            percentage,
            passingThreshold,
            incorrect,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

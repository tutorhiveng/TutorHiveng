// Supabase Edge Function: Tutor Bee AI Academic Assistant
// Endpoint: /functions/v1/tutor-bee-ai
// Handles: Academic explanations, STEM calculations, Lesson suggestions, Quiz generation, Video scripts, Statistical interpretations

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceSupabase } from '../_shared/supabaseClient.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, prompt, topic, subject, level, problem, questionCount, empiricalResults, researchQuestion, userId } = await req.json();

    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const supabase = getServiceSupabase();

    let result: any = null;

    if (action === 'calculate') {
      // STEM Mathematical & Scientific step-by-step solver
      if (geminiKey) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Solve this ${subject || 'STEM'} problem step-by-step for WAEC/JAMB/Tertiary students: "${problem}". Return JSON with: topic, problem, steps (stepNumber, title, formula, explanation), finalAnswer, curriculumNotes.`
                }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        const data = await aiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        result = JSON.parse(text || '{}');
      } else {
        result = {
          topic: subject || 'STEM Calculation',
          problem: problem || 'Expression',
          steps: [
            { stepNumber: 1, title: 'State Formula', explanation: 'Recall standard mathematical definitions and boundary parameters.' },
            { stepNumber: 2, title: 'Substitution', explanation: 'Group like terms and compute algebraic substitutions.' },
            { stepNumber: 3, title: 'Verification', explanation: 'Confirm consistency against examination marking guidelines.' }
          ],
          finalAnswer: 'Step-by-step solution evaluated. Connect live GEMINI_API_KEY for dynamic calculations.',
          curriculumNotes: 'Aligned with West African WAEC & JAMB UTME syllabus standards.'
        };
      }
    } else if (action === 'suggest-lesson') {
      // Auto-suggest lesson structure, learning objectives, and tags
      if (geminiKey) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Generate curriculum lesson metadata for topic "${topic}", subject "${subject}", level "${level}". Return JSON with: suggestedTitle, subject, level, description, learningObjectives, keyConcepts, estimatedDurationMinutes, tags.`
                }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        const data = await aiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        result = JSON.parse(text || '{}');
      } else {
        result = {
          suggestedTitle: `${topic}: Fundamentals & Examination Principles`,
          subject: subject || 'General Studies',
          level: level || 'Secondary (SSS 1-3)',
          description: `Detailed syllabus-aligned study of ${topic}.`,
          learningObjectives: [
            `Understand core principles and theoretical definitions of ${topic}`,
            `Solve standard examination and past question problems`,
            `Apply concepts to practical Nigerian and West African case contexts`
          ],
          keyConcepts: [topic, 'Core Principles', 'Problem Solving'],
          estimatedDurationMinutes: 45,
          tags: [String(topic).toLowerCase(), 'waec', 'jamb', 'tutorhive']
        };
      }
    } else if (action === 'generate-quiz') {
      // CBT Quiz generation
      const count = Math.min(Number(questionCount) || 5, 20);
      if (geminiKey) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Generate ${count} CBT multiple choice questions for topic "${topic}", subject "${subject}". Return JSON with: quizTitle, topic, questions (id, question, options [array of 4], correctOptionIndex, explanation).`
                }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        const data = await aiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        result = JSON.parse(text || '{}');
      } else {
        result = {
          quizTitle: `${topic} Diagnostic Assessment`,
          topic,
          questions: [
            {
              id: 'q1',
              question: `What is the primary governing principle of ${topic}?`,
              options: ['Option A (Conservation Principle)', 'Option B (Equilibrium Law)', 'Option C (Standard Reference State)', 'Option D (Empirical Variance)'],
              correctOptionIndex: 0,
              explanation: 'Option A correctly identifies the fundamental premise.'
            }
          ]
        };
      }
    } else if (action === 'interpret-stats') {
      // APA 7th Edition Statistical Results Interpretation
      if (geminiKey) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Write an APA 7th edition academic interpretation of these statistical results: ${JSON.stringify(empiricalResults)}. Research Question: "${researchQuestion || 'To examine significant differences or relationships'}". Return JSON with: testType, statisticalDecision, apaStyleSummary, detailedDiscussion, practicalImplications, methodologicalLimitations.`
                }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        const data = await aiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        result = JSON.parse(text || '{}');
      } else {
        result = {
          testType: empiricalResults?.testType || 'Statistical Test',
          statisticalDecision: empiricalResults?.isSignificant ? 'Reject Null Hypothesis (p < .05)' : 'Fail to Reject Null Hypothesis (p >= .05)',
          apaStyleSummary: `The empirical analysis yielded ${empiricalResults?.isSignificant ? 'a statistically significant' : 'no statistically significant'} outcome.`,
          detailedDiscussion: 'The observed statistics demonstrate the distributional properties of the evaluated sample.',
          practicalImplications: ['Integrate into thesis Chapter 4 (Data Presentation & Discussion).'],
          methodologicalLimitations: ['Sample size and normality assumptions should be documented.']
        };
      }
    } else {
      // General Tutor Bee academic chat
      if (geminiKey) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Tutor Bee, AI Learning Assistant for TutorHiveNG. Respond academically and clearly to: "${prompt}"`
                }]
              }]
            })
          }
        );
        const data = await aiRes.json();
        result = {
          reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.',
          tutor: 'Tutor Bee AI'
        };
      } else {
        result = {
          reply: `Hello scholar! I am Tutor Bee. Regarding "${prompt || topic || 'your inquiry'}": please review your curriculum notes or provide a specific problem. Connect your live GEMINI_API_KEY for dynamic AI assistance.`,
          tutor: 'Tutor Bee AI (Offline Mode)'
        };
      }
    }

    // Record AI generation event in database if table exists
    try {
      if (userId && result) {
        await supabase.from('ai_generated_content').insert({
          user_id: userId,
          content_type: action || 'chat',
          prompt: prompt || topic || problem || 'AI Inquiry',
          response_text: typeof result === 'string' ? result : JSON.stringify(result),
          metadata: { action, subject, level }
        });
      }
    } catch {
      // Ignore non-blocking audit write failure
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Tutor Bee AI failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

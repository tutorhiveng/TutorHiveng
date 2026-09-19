// Supabase Edge Function: AI Video Generator
// Endpoint: /functions/v1/ai-video-generator
// Handles educational video generation projects, auto-fill, script generation & review workflow

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceSupabase } from '../_shared/supabaseClient.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = getServiceSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ai_video_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, projects: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, topic, courseId, courseTitle, subject, educationLevel, tutorId, tutorName, voiceStyle, projectId, status, videoRenderUrl } = body;

      if (action === 'update-status') {
        const { data, error } = await supabase
          .from('ai_video_projects')
          .update({
            status,
            video_url: videoRenderUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .select()
          .single();

        return new Response(JSON.stringify({ success: !error, project: data }), {
          status: error ? 400 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new video project with auto-fill
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      let scriptPayload: any = null;

      if (geminiKey && topic) {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Create an educational micro-lesson script for topic "${topic}", subject "${subject || 'General'}", level "${educationLevel || 'Secondary'}". Return JSON with: title, learningHook, scenes (array with sceneNumber, durationSeconds, visualDescription, onScreenText, narrationVoiceover), webVttCaptions.`
                }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        const aiData = await aiRes.json();
        scriptPayload = JSON.parse(aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      } else {
        scriptPayload = {
          title: `${topic} Micro-Lesson`,
          learningHook: `Welcome to TutorHive! Today we break down ${topic} with clarity.`,
          scenes: [
            { sceneNumber: 1, durationSeconds: 30, visualDescription: 'Animated title card', onScreenText: topic, narrationVoiceover: `Welcome scholars! Today we learn ${topic}.` },
            { sceneNumber: 2, durationSeconds: 90, visualDescription: 'Formula and concept breakdown', onScreenText: 'Step 1 & Step 2', narrationVoiceover: 'Notice how the principles apply.' }
          ],
          webVttCaptions: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nWelcome to TutorHive!'
        };
      }

      const projectData = {
        title: scriptPayload?.title || `${topic} Educational Video`,
        topic,
        course_id: courseId || null,
        subject: subject || 'General',
        education_level: educationLevel || 'Secondary',
        tutor_id: tutorId || null,
        status: 'script_ready',
        voice_style: voiceStyle || 'friendly_tutor',
        script_payload: scriptPayload,
        thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_video_projects')
        .insert(projectData)
        .select()
        .single();

      return new Response(JSON.stringify({ success: !error, project: data || projectData }), {
        status: error ? 400 : 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'AI Video Generator error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

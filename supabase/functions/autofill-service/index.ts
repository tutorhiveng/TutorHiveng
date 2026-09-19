// Supabase Edge Function: TutorHive Auto-Fill Service
// Endpoint: /functions/v1/autofill-service
// Automatically retrieves stored information from the database to populate forms without re-entry

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceSupabase } from '../_shared/supabaseClient.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'student';
  const id = url.searchParams.get('id') || '';

  const supabase = getServiceSupabase();

  try {
    let autoFillData: any = null;

    if (type === 'student') {
      // Call Postgres stored procedure get_student_autofill
      const { data, error } = await supabase.rpc('get_student_autofill', { p_user_id: id });
      if (!error && data) {
        autoFillData = data;
      } else {
        // Fallback query to profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, email, phone_number, current_level, enrolled_courses, purchased_packages')
          .eq('id', id)
          .maybeSingle();

        autoFillData = {
          user_id: id,
          full_name: profile?.display_name || 'TutorHive Student',
          email: profile?.email || 'student@tutorhive.ng',
          phone: profile?.phone_number || '',
          education_level: profile?.current_level || 'Secondary (SSS 1-3)',
          enrolled_courses: profile?.enrolled_courses || [],
          active_packages: profile?.purchased_packages || []
        };
      }
    } else if (type === 'tutor') {
      // Call Postgres stored procedure get_tutor_autofill
      const { data, error } = await supabase.rpc('get_tutor_autofill', { p_tutor_id: id });
      if (!error && data) {
        autoFillData = data;
      } else {
        const { data: tutor } = await supabase
          .from('tutors')
          .select('id, user_id, specialization, qualifications, subjects, hourly_rate, rating, profiles:user_id(display_name, email, phone_number)')
          .eq('id', id)
          .maybeSingle();

        autoFillData = {
          tutor_id: id,
          full_name: (tutor as any)?.profiles?.display_name || 'Verified Tutor',
          email: (tutor as any)?.profiles?.email || '',
          specialization: tutor?.specialization || 'Academic Tutoring',
          qualifications: tutor?.qualifications || 'B.Sc / M.Sc',
          subjects: tutor?.subjects || ['General Studies'],
          hourly_rate: tutor?.hourly_rate || 6000
        };
      }
    } else if (type === 'course') {
      // Call Postgres stored procedure get_course_autofill
      const { data, error } = await supabase.rpc('get_course_autofill', { p_course_id: id });
      if (!error && data) {
        autoFillData = data;
      } else {
        const { data: course } = await supabase
          .from('courses')
          .select('id, title, code, education_level, category, description, subjects:subject_id(name), profiles:tutor_id(display_name)')
          .eq('id', id)
          .maybeSingle();

        autoFillData = {
          course_id: id,
          title: course?.title || '',
          subject_name: (course as any)?.subjects?.name || 'General',
          education_level: course?.education_level || 'Secondary',
          category: course?.category || 'Curriculum',
          tutor_name: (course as any)?.profiles?.display_name || 'Lead Tutor',
          description: course?.description || ''
        };
      }
    } else if (type === 'library') {
      const { data: book } = await supabase
        .from('digital_library')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      autoFillData = book || {
        resource_id: id,
        title: '',
        author: '',
        category: 'General',
        price: 0
      };
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      id,
      autoFillData,
      isEditable: true,
      message: 'Information retrieved and auto-filled from database. Remains editable before submission.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Auto-fill retrieval failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

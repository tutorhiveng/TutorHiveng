// Supabase Edge Function Client Helper
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

export function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing in Edge Function environment.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

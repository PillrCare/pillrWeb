import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with secret key for admin operations.
 * Use this for cron jobs, background tasks, and operations that need to bypass RLS.
 * 
 * WARNING: Secret key has full database access. Never expose this to the client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Try new secret key first, fall back to legacy service_role key for backwards compatibility
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy)'
    );
  }

  return createSupabaseClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


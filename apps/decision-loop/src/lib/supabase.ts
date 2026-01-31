import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

export interface DayEntry {
  id: string;
  user_id: string;
  date: string;
  one_thing: string | null;
  problem_what: string | null;
  problem_why: string | null;
  problem_who: string | null;
  problem_constraints: string | null;
  production: string | null;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionLock {
  id: string;
  day_entry_id: string;
  decision_text: string;
  assumptions: string | null;
  practical_change: string | null;
  shared_with_fyrk: boolean;
  share_token: string | null;
  created_at: string;
}

export function createServerClient(cookies: AstroCookies): SupabaseClient {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (accessToken && refreshToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}

export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

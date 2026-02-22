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

interface CloudflareRuntime {
  env?: Record<string, string>;
}

function getEnv(key: string, runtime?: CloudflareRuntime): string {
  return import.meta.env[key] ?? runtime?.env?.[key] ?? '';
}

export function createServerClient(cookies: AstroCookies, runtime?: CloudflareRuntime): SupabaseClient {
  const supabaseUrl = getEnv('SUPABASE_URL', runtime);
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', runtime);

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

export function createServiceRoleClient(runtime?: CloudflareRuntime): SupabaseClient {
  return createClient(
    getEnv('SUPABASE_URL', runtime),
    getEnv('SUPABASE_SERVICE_ROLE_KEY', runtime),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

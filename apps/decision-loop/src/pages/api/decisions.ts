import type { APIRoute } from 'astro';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ locals }) => {
  const supabase = (locals as unknown as Record<string, unknown>).supabase as SupabaseClient;
  const user = (locals as unknown as Record<string, unknown>).user as User;

  const { data: entries, error } = await supabase
    .from('day_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_locked', true)
    .order('date', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const decisions = [];

  for (const entry of entries ?? []) {
    const { data: lock } = await supabase
      .from('decision_locks')
      .select('*')
      .eq('day_entry_id', entry.id)
      .single();

    if (lock) {
      decisions.push({ entry, lock });
    }
  }

  return new Response(JSON.stringify({ decisions }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

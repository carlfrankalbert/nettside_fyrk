import type { APIRoute } from 'astro';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url, locals }) => {
  const supabase = (locals as unknown as Record<string, unknown>).supabase as SupabaseClient;
  const user = (locals as unknown as Record<string, unknown>).user as User;
  const date = url.searchParams.get('date');

  if (!date) {
    return new Response(JSON.stringify({ error: 'date required' }), { status: 400 });
  }

  const { data: entry } = await supabase
    .from('day_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  let lock = null;
  if (entry?.is_locked) {
    const { data } = await supabase
      .from('decision_locks')
      .select('*')
      .eq('day_entry_id', entry.id)
      .single();
    lock = data;
  }

  return new Response(JSON.stringify({ entry, lock }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const supabase = (locals as unknown as Record<string, unknown>).supabase as SupabaseClient;
  const user = (locals as unknown as Record<string, unknown>).user as User;
  const body = await request.json() as Record<string, unknown>;
  const { date, ...fields } = body;

  if (!date) {
    return new Response(JSON.stringify({ error: 'date required' }), { status: 400 });
  }

  const { data: existing } = await supabase
    .from('day_entries')
    .select('id, is_locked')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  if (existing?.is_locked) {
    return new Response(JSON.stringify({ error: 'Entry is locked' }), { status: 403 });
  }

  let entry;

  if (existing) {
    const { data, error } = await supabase
      .from('day_entries')
      .update(fields)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    entry = data;
  } else {
    const { data, error } = await supabase
      .from('day_entries')
      .insert({ user_id: user.id, date, ...fields })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    entry = data;
  }

  return new Response(JSON.stringify({ entry, lock: null }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

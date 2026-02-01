import type { APIRoute } from 'astro';
import type { SupabaseClient, User } from '@supabase/supabase-js';

interface LockRequestBody {
  day_entry_id: string;
  decision_text: string;
  assumptions?: string;
  practical_change?: string;
  shared_with_fyrk?: boolean;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = (locals as unknown as Record<string, unknown>).supabase as SupabaseClient;
  const user = (locals as unknown as Record<string, unknown>).user as User;
  const body = (await request.json()) as LockRequestBody;
  const { day_entry_id, decision_text, assumptions, practical_change, shared_with_fyrk } = body;

  if (!day_entry_id || !decision_text?.trim()) {
    return new Response(JSON.stringify({ error: 'day_entry_id and decision_text required' }), {
      status: 400,
    });
  }

  // Verify ownership and not already locked
  const { data: entry, error: fetchError } = await supabase
    .from('day_entries')
    .select('id, user_id, is_locked')
    .eq('id', day_entry_id)
    .single();

  if (fetchError || !entry) {
    return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404 });
  }

  if (entry.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
  }

  if (entry.is_locked) {
    return new Response(JSON.stringify({ error: 'Entry already locked' }), { status: 409 });
  }

  // Generate share token if sharing
  let shareToken: string | null = null;
  if (shared_with_fyrk) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    shareToken = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Lock the entry
  const { error: updateError } = await supabase
    .from('day_entries')
    .update({ is_locked: true, locked_at: new Date().toISOString() })
    .eq('id', day_entry_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  // Insert decision lock
  const { error: lockError } = await supabase.from('decision_locks').insert({
    day_entry_id,
    decision_text: decision_text.trim(),
    assumptions: assumptions || null,
    practical_change: practical_change || null,
    shared_with_fyrk: Boolean(shared_with_fyrk),
    share_token: shareToken,
  });

  if (lockError) {
    // Rollback lock
    await supabase
      .from('day_entries')
      .update({ is_locked: false, locked_at: null })
      .eq('id', day_entry_id);
    return new Response(JSON.stringify({ error: lockError.message }), { status: 500 });
  }

  // Fetch updated data
  const { data: updatedEntry } = await supabase
    .from('day_entries')
    .select('*')
    .eq('id', day_entry_id)
    .single();

  const { data: lock } = await supabase
    .from('decision_locks')
    .select('*')
    .eq('day_entry_id', day_entry_id)
    .single();

  return new Response(JSON.stringify({ entry: updatedEntry, lock }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

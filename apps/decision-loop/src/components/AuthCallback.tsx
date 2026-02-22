import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      );

      const { data, error: authError } = await supabase.auth.getSession();

      if (authError || !data.session) {
        setError('Login failed. Please try again.');
        return;
      }

      const { access_token, refresh_token } = data.session;

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError('Failed to create session.');
      }
    }

    handleCallback();
  }, []);

  if (error) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <a href="/login" className="mt-2 inline-block text-sm underline">Back to login</a>
      </div>
    );
  }

  return <p className="text-neutral-500">Logging in...</p>;
}

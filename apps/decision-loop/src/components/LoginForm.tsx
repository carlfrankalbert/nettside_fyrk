import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Mode = 'signin' | 'signup';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSent, setSignUpSent] = useState(false);

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSignUpSent(true);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { access_token, refresh_token } = data.session;

    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    });

    if (!res.ok) {
      setLoading(false);
      setError('Failed to create session');
      return;
    }

    window.location.href = '/';
  }

  if (signUpSent) {
    return (
      <p className="text-neutral-600">
        Check your email for a confirmation link.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading
          ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
          : (mode === 'signin' ? 'Sign in' : 'Create account')}
      </button>
      <p className="text-center text-sm text-neutral-500">
        {mode === 'signin' ? (
          <>
            No account?{' '}
            <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="underline hover:text-neutral-700">
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('signin'); setError(''); }} className="underline hover:text-neutral-700">
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}

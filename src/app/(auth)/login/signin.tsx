'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { authClient } from '@/lib/better-auth-client';

export function SignIn({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function redirectToGoogle(kind: 'sign-in' | 'sign-up') {
    const cb = typeof window !== 'undefined' && callbackUrl && !/^https?:/i.test(callbackUrl)
      ? `${window.location.origin}${callbackUrl}`
      : callbackUrl;
    // Prefer the SDK; if it doesn't return a URL, fallback to manual call
    try {
      const result = await (kind === 'sign-up' ? authClient.signUp.social : authClient.signIn.social)({
        provider: 'google',
        callbackURL: cb,
        requestSignUp: kind === 'sign-up',
      } as any);
      const url = (result as any)?.url as string | undefined;
      if (url) {
        const u = new URL(url);
        u.searchParams.set('prompt', 'select_account');
        u.searchParams.set('include_granted_scopes', 'true');
        window.location.href = u.toString();
        return;
      }
    } catch {}

    // Fallback (robust): submit a temporary form POST so the browser follows redirects
    try {
      const endpoint = kind === 'sign-up' ? '/api/auth/sign-up/social' : '/api/auth/sign-in/social';
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = endpoint;
      form.style.display = 'none';
      const add = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      add('provider', 'google');
      add('callbackURL', cb || '');
      add('requestSignUp', String(kind === 'sign-up'));
      document.body.appendChild(form);
      form.submit();
      return;
    } catch {}

    // Last resort
    const last = kind === 'sign-up' ? '/api/auth/sign-up/google' : '/api/auth/sign-in/google';
    window.location.href = `${last}?prompt=select_account&include_granted_scopes=true`;
  }

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await redirectToGoogle('sign-in');
      setTimeout(() => setLoading(false), 600);
    } catch {
      setLoading(false);
    }
  };

  return (
    <GoogleButton onClick={handleGoogleSignIn} loading={loading} labelLoading="Signing in..." />
  );
}

export function SignUpWithGoogle({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const abs = typeof window !== 'undefined' && callbackUrl && !/^https?:/i.test(callbackUrl)
        ? `${window.location.origin}${callbackUrl}`
        : callbackUrl;
      // Direct, robust redirect to Better Auth provider route
      const url = new URL('/api/auth/sign-up/google', window.location.origin);
      if (abs) url.searchParams.set('callbackURL', abs);
      url.searchParams.set('prompt', 'select_account');
      url.searchParams.set('include_granted_scopes', 'true');
      window.location.href = url.toString();
    } catch {
      // Fallback to SDK path if constructing URL fails for any reason
      try {
        await redirectToGoogle('sign-up');
      } catch {}
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <GoogleButton onClick={handleGoogleSignUp} loading={loading} labelLoading="Creating account..." labelDefault="Sign up with Google" />
  );
}

function GoogleButton({ onClick, loading, labelLoading, labelDefault }: { onClick: () => void; loading: boolean; labelLoading: string; labelDefault?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full px-5 py-3 rounded-md border text-sm font-semibold border-slate-300/60 bg-white text-slate-900 hover:bg-white/90 disabled:opacity-60 shadow-sm flex items-center justify-center gap-3 transition-colors dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {loading ? labelLoading : (labelDefault || 'Continue with Google')}
    </button>
  );
}

export function CredentialsForm({
  callbackUrl,
  defaultEmail,
}: {
  callbackUrl: string;
  defaultEmail?: string;
}) {
  const [email, setEmail] = React.useState(defaultEmail || '');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });

      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm text-slate-300">Email</span>
        <input
          type="email"
          placeholder="you@company.com"
          className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-slate-300">Password</span>
        <input
          type="password"
          placeholder="••••••••"
          className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? (
        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}
      <button
        disabled={loading}
        className="mt-2 w-full px-5 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/30"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

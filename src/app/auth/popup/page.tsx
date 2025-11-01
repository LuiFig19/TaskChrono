'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { authClient, signIn } from '@/lib/better-auth-client';

export default function Popup() {
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const dst = url?.searchParams.get('dst') || '/dashboard';
  const [busyGoogle, setBusyGoogle] = React.useState(false);
  const [busyEmail, setBusyEmail] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (busyGoogle || busyEmail) return;
    setBusyEmail(true);
    setError(null);
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: dst,
      });
      if (result.error) {
        setError('Invalid email or password');
        return;
      }
      // Notify parent and close
      if (window.opener)
        window.opener.postMessage({ type: 'tc:signed-in', dst }, window.location.origin);
      try {
        window.close();
      } catch {}
      // Fallback navigate if the popup couldn't close
      setTimeout(() => {
        window.location.href = dst;
      }, 150);
    } catch (err) {
      setError('Sign in failed');
    } finally {
      setBusyEmail(false);
    }
  }

  async function handleGoogleSignIn() {
    if (busyGoogle || busyEmail) return;
    setBusyGoogle(true);
    setError(null);
    try {
      const callbackURL = `/auth/popup/done?dst=${encodeURIComponent(dst)}`;
      const result = await authClient.signIn.social({ provider: 'google', callbackURL } as any);
      const url = (result as any)?.url as string | undefined;
      if (url) {
        const u = new URL(url);
        u.searchParams.set('prompt', 'select_account');
        u.searchParams.set('include_granted_scopes', 'true');
        window.location.href = u.toString();
        return;
      }
    } catch {}
    try {
      const res = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (data?.url) {
        const u = new URL(data.url as string);
        u.searchParams.set('prompt', 'select_account');
        u.searchParams.set('include_granted_scopes', 'true');
        window.location.href = u.toString();
        return;
      }
      // last resort
      window.location.href = '/api/auth/callback/google';
    } catch (err) {
      setBusyGoogle(false);
    }
  }

  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-slate-950 text-slate-100">
      {/* Animated ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-1/2 -left-1/2 size-[120vmax] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 size-[120vmax] rounded-full bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.12),transparent_60%)] animate-pulse" />
      </div>

      <div className="relative min-h-[100vh] flex items-center justify-center p-2">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[420px]"
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.25)] backdrop-blur"
            >
              <div className="text-lg font-semibold tc-animated-gradient">TaskChrono</div>
              <div className="text-sm text-slate-400 mt-1">Sign in to continue</div>

              <div className="mt-6 grid gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoogleSignIn}
                  className="w-full px-4 py-2 rounded-md border text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-70 bg-white text-slate-900 border-slate-300 hover:bg-white/90 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  disabled={busyEmail || busyGoogle}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {busyGoogle ? 'Opening Google…' : 'Continue with Google'}
                </motion.button>

                <form onSubmit={handleCredentialsSignIn} className="grid gap-2">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email"
                    className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {error ? <div className="text-sm text-rose-400">{error}</div> : null}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                  data-auth-solid="sign-in"
                  className="w-full px-4 py-2 rounded-md font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-90 bg-indigo-700 text-white hover:bg-indigo-800 border border-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/40 dark:hover:bg-indigo-500/25"
                    disabled={busyEmail || busyGoogle}
                  >
                    {busyEmail ? 'Signing in…' : 'Sign in'}
                  </motion.button>
                </form>

              <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.close()}
                  data-auth-solid="cancel"
                  className="w-full px-4 py-2 rounded-md font-semibold transition-colors duration-200 cursor-pointer bg-rose-700 text-white hover:bg-rose-800 border border-rose-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400/60 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/40 dark:hover:bg-rose-500/25"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

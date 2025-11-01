export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/better-auth';

import { SignIn, CredentialsForm } from './signin';

export default async function LoginPage(
  props:
    | { searchParams?: { callbackUrl?: string; signup?: string; email?: string } }
    | { searchParams: Promise<{ callbackUrl?: string; signup?: string; email?: string }> },
) {
  let params: { callbackUrl?: string; signup?: string; email?: string } = {};
  try {
    const maybe = (props as any).searchParams;
    params = typeof maybe?.then === 'function' ? await maybe : maybe || {};
  } catch {}
  const dst =
    typeof params.callbackUrl === 'string' && params.callbackUrl
      ? params.callbackUrl
      : '/dashboard';

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) redirect(dst);

  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const justSignedUp = String(params.signup || '') === '1';
  const defaultEmail = typeof params.email === 'string' ? params.email : undefined;

  return (
    <div className="relative overflow-hidden min-h-[100vh] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse bg-[radial-gradient(ellipse_60%_60%_at_20%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(ellipse_50%_50%_at_80%_30%,rgba(37,99,235,0.25),transparent_60%)]" />

      {/* Centered card */}
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur shadow-2xl">
          <div className="mb-3">
            <span className="tc-animated-gradient text-2xl font-extrabold">TaskChrono</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-300 mt-2">Sign in to continue to your workspace</p>

          {hasGoogle ? (
            <div className="mt-6">
              <SignIn callbackUrl={dst} />
            </div>
          ) : null}

          {hasGoogle ? (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-3 text-slate-400">Or continue with email</span>
              </div>
            </div>
          ) : null}

          {justSignedUp ? (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
              Your account was created. Please sign in to continue onboarding.
            </div>
          ) : null}

          <div className={hasGoogle ? '' : 'mt-6'}>
            <CredentialsForm callbackUrl={dst} defaultEmail={defaultEmail} />
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            New here?{' '}
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(dst)}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

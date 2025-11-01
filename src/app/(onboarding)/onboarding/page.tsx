import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/better-auth';

import OnboardingClient from './OnboardingClient';
export const dynamic = 'force-dynamic';

export default async function OnboardingPage(
  props: { searchParams?: { plan?: string } } | { searchParams: Promise<{ plan?: string }> },
) {
  let planParam: string | undefined;
  try {
    const maybe = (props as any).searchParams;
    const sp = typeof maybe?.then === 'function' ? await maybe : maybe || {};
    planParam = sp?.plan;
  } catch {}
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    const plan = planParam || 'FREE';
    const cb = `/onboarding?plan=${plan}`;
    redirect(`/register?callbackUrl=${encodeURIComponent(cb)}`);
  }

  // Check if user already has an organization - redirect to dashboard if they do
  const { prisma } = await import('@/lib/prisma');
  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (existingMembership) {
    redirect('/dashboard');
  }

  const plan = planParam || 'FREE';
  const planLabel = (() => {
    const upper = String(plan).toUpperCase();
    if (upper === 'FREE') {
      return <span className="font-semibold text-green-400">FREE</span>;
    }
    if (upper === 'BUSINESS') {
      return <span className="font-semibold text-orange-400">💼 BUSINESS</span>;
    }
    if (upper === 'ENTERPRISE') {
      return (
        <span className="font-semibold text-amber-400">
          <span className="not-italic mr-1">🏢</span>
          <span className="italic">ENTERPRISE</span>
        </span>
      );
    }
    return <span className="font-semibold text-indigo-300">✨ {upper}</span>;
  })();
  return (
    <div className="relative overflow-hidden min-h-[100vh] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse bg-[radial-gradient(ellipse_60%_60%_at_20%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(ellipse_50%_50%_at_80%_30%,rgba(37,99,235,0.25),transparent_60%)]" />
      {/* Centered modal */}
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur shadow-2xl">
          <div className="mb-2">
            <span className="tc-animated-gradient text-lg font-extrabold">TaskChrono</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your workspace</h1>
          <p className="text-slate-300 mt-1">Selected plan: {planLabel}</p>

          <OnboardingClient plan={plan} />
        </div>
      </div>
    </div>
  );
}

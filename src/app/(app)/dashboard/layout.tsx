import { headers } from 'next/headers';
import React from 'react';

import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import { getUserPlan } from '@/features/dashboard/lib/featureGate';
import { auth } from '@/lib/better-auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const plan = await getUserPlan();
  let userEmail: string | undefined = undefined;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userEmail = session?.user?.email as string | undefined;
  } catch {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <DashboardHeader plan={plan as any} userEmail={userEmail} />
      <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

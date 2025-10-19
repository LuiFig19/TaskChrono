import React from "react";
import { getUserPlan } from "./_components/feature-gate";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import DashboardHeader from "./_components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const plan = await getUserPlan();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userEmail = session?.user?.email as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <DashboardHeader plan={plan as any} userEmail={userEmail} />
      <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

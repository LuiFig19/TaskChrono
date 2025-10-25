"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { ensureBetterAuthSchema } from "@/lib/dbMigrations";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type RegisterState = { error?: string };

export async function registerLocalAction(
  _prevState: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Ensure production DB is aligned before attempting to create the account
    await ensureBetterAuthSchema();

    // If a skeleton user was pre-created (e.g., via an invite) with no password,
    // complete it instead of throwing a duplicate email error.
    try {
      const existing = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true, orgMemberships: true, sessions: true },
      });
      if (existing && !existing.passwordHash) {
        // Prefer upgrading the existing user with a password to preserve any references (e.g., org invites)
        const hash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash: hash, name: name || existing.name || null },
        });
        // Auto sign-in and go to onboarding/destination
        await auth.api.signInEmail({
          body: { email, password },
          headers: await headers(),
          cookies: await cookies(),
        });
        redirect(callbackUrl);
      }
    } catch {}

    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || undefined,
      },
      headers: await headers(),
    });

    if ((signUpResult as any)?.error) {
      const msg = (signUpResult as any).error?.message || (signUpResult as any).error;
      return { error: String(msg || 'Failed to create user account') };
    }

    if (!signUpResult || !(signUpResult as any).user) {
      return { error: "Failed to create user account" };
    }
  } catch (error: any) {
    if (error?.message?.toLowerCase?.().includes('already') && error?.message?.toLowerCase?.().includes('email')) {
      return { error: "This email is already registered. Please sign in instead or use a different email." };
    }
    return { error: error?.message || "Failed to register. Please try again." };
  }

  // Auto sign-in after successful signup and continue onboarding
  await auth.api.signInEmail({
    body: { email, password },
    headers: await headers(),
    cookies: await cookies(),
  });
  redirect(callbackUrl);
}

export async function signOutAction(formData: FormData) {
  await auth.api.signOut({
    headers: await headers(),
  });
  
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('taskchrono')) {
      cookieStore.delete(cookie.name);
    }
  });
  
  const plan = String(formData.get("plan") || "FREE");
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");
  
  redirect(`/register?plan=${plan}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { ensureBetterAuthSchema } from "@/lib/dbMigrations";

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

  // Do NOT auto-sign in after signup. Explicitly sign out and send user to login.
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {}
  redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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

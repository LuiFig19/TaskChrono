"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { ensureBetterAuthSchema } from "@/lib/dbMigrations";

export async function registerLocalAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  if (!email || !password) {
    throw new Error("Email and password are required");
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

    // If API returned a structured error
    if ((signUpResult as any)?.error) {
      const msg = (signUpResult as any).error?.message || (signUpResult as any).error;
      throw new Error(String(msg || 'Failed to create user account'));
    }

    if (!signUpResult || !(signUpResult as any).user) {
      throw new Error("Failed to create user account");
    }
  } catch (error: any) {
    if (error?.message?.includes('email') && (error?.message?.includes('already exists') || error?.message?.includes('duplicate'))) {
      throw new Error("This email is already registered. Please sign in instead or use a different email.");
    }
    
    throw new Error(error?.message || "Failed to register. Please try again.");
  }

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

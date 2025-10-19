"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";

export async function registerLocalAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || undefined,
      },
      headers: await headers(),
    });

    if (!signUpResult || !signUpResult.user) {
      throw new Error("Failed to create user account");
    }

    const userId = signUpResult.user.id;

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "ADMIN" as any },
      });
    }

    let membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });

    if (!membership) {
      const org = await prisma.organization.create({
        data: {
          name: name ? `${name}'s Org` : "Developer Org",
          planTier: "ENTERPRISE" as any,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdById: userId,
          members: { create: { userId, role: "OWNER" as any } },
        },
      });
      membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: org.id },
        include: { organization: true },
      });
    } else if (membership.organization.planTier !== "ENTERPRISE") {
      await prisma.organization.update({
        where: { id: membership.organization.id },
        data: { planTier: "ENTERPRISE" as any },
      });
    }

    redirect(callbackUrl);
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error?.message || "Failed to register. Please try again.");
  }
}

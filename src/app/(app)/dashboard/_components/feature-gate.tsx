import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type Plan = "FREE" | "BUSINESS" | "ENTERPRISE" | "CUSTOM";

export async function getUserPlan(): Promise<Plan> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user) return "FREE";

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });
    return (membership?.organization.planTier as Plan) ?? "FREE";
  } catch {
    return "FREE";
  }
}

export function isFeatureEnabled(
  plan: Plan,
  feature:
    | "INVENTORY"
    | "INVOICING"
    | "ADV_ANALYTICS"
    | "FILES"
    | "CALENDAR"
    | "AI"
    | "SCHEDULER"
): boolean {
  switch (feature) {
    case "ADV_ANALYTICS":
    case "AI":
    case "SCHEDULER":
      return plan === "BUSINESS" || plan === "ENTERPRISE" || plan === "CUSTOM";
    case "FILES":
    case "CALENDAR":
      return (
        plan === "FREE" ||
        plan === "BUSINESS" ||
        plan === "ENTERPRISE" ||
        plan === "CUSTOM"
      );
    case "INVENTORY":
    case "INVOICING":
      return plan === "ENTERPRISE" || plan === "CUSTOM";
    default:
      return false;
  }
}

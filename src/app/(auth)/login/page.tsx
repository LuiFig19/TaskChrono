import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { SignIn, CredentialsForm } from "./signin";

export default async function LoginPage(
  props:
    | { searchParams?: { callbackUrl?: string } }
    | { searchParams: Promise<{ callbackUrl?: string }> }
) {
  let params: { callbackUrl?: string } = {};
  try {
    const maybe = (props as any).searchParams;
    params =
      typeof maybe?.then === "function" ? await maybe : maybe || {};
  } catch {}
  const dst =
    typeof params.callbackUrl === "string" && params.callbackUrl
      ? params.callbackUrl
      : "/dashboard";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) redirect(dst);

  const hasGoogle =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600 mt-1">Choose a method below.</p>

        {hasGoogle ? (
          <div className="mt-4">
            <SignIn callbackUrl={dst} />
          </div>
        ) : null}

        <div className="mt-3">
          <CredentialsForm callbackUrl={dst} />
        </div>

        <div className="mt-6 text-xs text-gray-500">
          New here?{" "}
          <Link href="/register" className="underline">
            Create a local admin
          </Link>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow activation page without auth check (it will verify session client-side)
  if (request.nextUrl.pathname.startsWith("/onboarding/activation")) {
    return NextResponse.next();
  }

  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Check for Better-auth session cookie
  const sessionToken = request.cookies.get("taskchrono.session_token");

  if (!sessionToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

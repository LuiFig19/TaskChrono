import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow activation page without auth check (it will verify session client-side)
  if (request.nextUrl.pathname.startsWith("/onboarding/activation")) {
    return NextResponse.next();
  }

  // Don't check auth in middleware for dashboard - let the page handle it
  // This prevents redirect loops when session cookies are being set
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

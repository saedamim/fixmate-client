import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Services, service details (with booking), the dashboards and the payment confirmation page are for signed-in users.
// The Home page ("/") is NOT listed in the matcher below and must always stay public.
//
// This is a quick, optimistic check (is there a session cookie?); the Express API still checks
// the real token and role on every protected request.
// Signed-out visitors are sent to Sign In and return to the requested page afterwards.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/services", "/services/:path*", "/dashboard/:path*", "/payment/success"],
};

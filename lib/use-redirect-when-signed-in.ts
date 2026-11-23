"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardPath, useSession } from "@/lib/auth-client";

// For Sign In / Sign Up: a signed-in user is sent on, either to the page they asked for or to their own dashboard.
// This also covers a fresh sign in (the session appears) and a return from Google sign in.
export function useRedirectWhenSignedIn(redirect: string) {
  const router = useRouter();
  const { data: session } = useSession();
  const signedIn = Boolean(session);
  const role = session?.user.role;

  useEffect(() => {
    if (!signedIn) return;
    router.replace(redirect === "/" ? dashboardPath(role) : redirect);
    router.refresh();
  }, [signedIn, role, redirect, router]);
}

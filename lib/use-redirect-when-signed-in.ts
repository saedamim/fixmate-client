"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

// For Sign In / Sign Up: a signed-in user is sent on to the page they asked for, or to Home.
// This also covers a fresh sign in (the session appears) and a return from Google sign in.
export function useRedirectWhenSignedIn(redirect: string) {
  const router = useRouter();
  const { data: session } = useSession();
  const signedIn = Boolean(session);

  useEffect(() => {
    if (!signedIn) return;
    router.replace(redirect);
    router.refresh();
  }, [signedIn, redirect, router]);
}

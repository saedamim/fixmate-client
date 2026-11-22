
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    jwtClient(), // adds authClient.token() for calling the Express API
    inferAdditionalFields({ user: { role: { type: "string", required: false } } }), // types session.user.role
  ],
});
export const { signIn, signUp, signOut, useSession } = authClient;

// A same-site path taken from ?redirect=... (anything else becomes "/"), so users can return after signing in
export const safeRedirect = (target: string | null) =>
  target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\") ? target : "/";
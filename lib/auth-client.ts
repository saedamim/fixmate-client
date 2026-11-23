
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins";

// No baseURL: requests go to this site's own /api/auth, which next.config.ts forwards to the Express API
export const authClient = createAuthClient({
  plugins: [
    jwtClient(), // adds authClient.token() for calling the Express API
    inferAdditionalFields({
      // types session.user.role and the profile fields
      user: {
        role: { type: "string", required: false },
        phone: { type: "string", required: false },
        area: { type: "string", required: false },
        bio: { type: "string", required: false },
      },
    }),
  ],
});
export const { signIn, signUp, signOut, useSession } = authClient;

// A same-site path taken from ?redirect=... (anything else becomes "/"), so users can return after signing in
export const safeRedirect = (target: string | null) =>
  target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\") ? target : "/";

// Absolute URL on THIS site for Better Auth's OAuth redirects (a relative path would be resolved against the API's URL)
export const siteUrl = (path: string) => `${window.location.origin}${path}`;

// Each role's own dashboard (customer is the default)
export const dashboardPath = (role?: string | null) =>
  role === "technician" ? "/dashboard/technician" : role === "admin" ? "/dashboard/admin" : "/dashboard/customer";

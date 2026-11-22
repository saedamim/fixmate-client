import type { NextConfig } from "next";

// The Express API (Better Auth + REST). Same variable the app already uses as its API base URL.
// Trailing slashes are stripped: "https://api//api/auth/..." makes Vercel answer 308 and the rewrite loops.
const apiUrl = (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Auth requests go to this site's own /api/auth and are forwarded to the API, so the session cookie belongs to
  // THIS domain. Without it the cookie would live on the API's domain, and proxy.ts (which runs on this domain)
  // could never see it, so every protected page would redirect back to Sign In in production.
  async rewrites() {
    return [{ source: "/api/auth/:path*", destination: `${apiUrl}/api/auth/:path*` }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

// Wraps a dashboard page: shows a skeleton while the session loads, a Sign in prompt when signed out, a notice for the
// wrong role, and the page itself for the right role. The API still checks the role on every request.
export default function RoleGate({
  role,
  action,
  signInPath,
  children,
}: {
  role: "customer" | "technician" | "admin";
  action: string; // e.g. "view this dashboard"
  signInPath: string; // where Sign in returns to
  children: (user: { id: string; name: string; email: string }) => React.ReactNode;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;

  if (!session) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with {role === "admin" ? "an" : "a"} {role} account to {action}.</p>
        <Link href={`/sign-in?redirect=${signInPath}`} className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  }

  if (session.user.role !== role) {
    return (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only {role} accounts can {action}.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  }

  return <>{children(session.user)}</>;
}

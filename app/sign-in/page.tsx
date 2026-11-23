
"use client";

import { toast } from "sonner";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirect, siteUrl, signIn } from "@/lib/auth-client";

// Existing accounts shown as a hint on the Sign-in page. Emails only: passwords are never stored or shown here.
const demoAccounts = [
  { role: "Admin", email: "yeasminmem@gmail.com", badge: "bg-purple-50 text-purple-700" },
  { role: "Customer", email: "bottoslay@gmail.com", badge: "bg-teal-50 text-teal-700" },
  { role: "Technician", email: "ahsan@gmail.com", badge: "bg-orange-50 text-orange-600" },
  { role: "Technician", email: "abdurrahim@gmail.com", badge: "bg-orange-50 text-orange-600" },
];

function SignInForm() {
  const router = useRouter();

  // ?redirect=/some/path is where the user was heading before being asked to sign in
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const redirectQuery = redirect === "/" ? "" : `?redirect=${encodeURIComponent(redirect)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const { error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Invalid email or password");
        toast.error(error.message || "Invalid email or password");
        return;
      }

      toast.success("Signed in successfully.");

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    try {
      setGoogleLoading(true);

      const { error } = await signIn.social({
        provider: "google",
        callbackURL: siteUrl(redirect),
        errorCallbackURL: siteUrl("/sign-in"),
      });

      if (error) {
        setError(error.message || "Google sign in failed");
        setGoogleLoading(false);
      }
    } catch {
      setError("Google sign in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f8] px-4 py-10">
      <div className="grid w-full max-w-5xl items-start gap-6 lg:grid-cols-2">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {redirect === "/" ? "Sign in to continue using FixMate." : "Please sign in to continue. You will return to the page you asked for."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full rounded-lg bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.27 5.64c4.25-3.92 7.52-9.7 7.52-17.29z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.27-5.64c-2.02 1.35-4.6 2.15-8.63 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>

          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <p className="mt-6 text-center text-sm font-medium text-gray-700">
          Dont have an account?{" "}
          <Link
            href={`/sign-up${redirectQuery}`}
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Create Account
          </Link>
        </p>
      </div>

      <aside className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9" aria-labelledby="demo-accounts">
        <h2 id="demo-accounts" className="text-2xl font-bold text-gray-900">Demo Accounts</h2>
        <p className="mt-2 text-sm text-gray-600">Existing FixMate accounts for each role. Select one to fill in the email.</p>
        <ul className="mt-6 space-y-3">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => setEmail(account.email)}
                className="w-full rounded-xl border border-gray-200 bg-[#f7f8f8] p-4 text-left transition hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${account.badge}`}>{account.role}</span>
                <span className="mt-2 block break-all text-sm font-semibold text-gray-900">{account.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      </div>
    </main>
  );
}

// useSearchParams needs a Suspense boundary
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

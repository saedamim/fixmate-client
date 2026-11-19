

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatar = (file: File | undefined) => {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const { error } = await signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message || "Registration failed");
        return;
      }

      router.push("/sign-in");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-800 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-center text-3xl font-bold">
          Create Account
        </h1>

        <div className="flex flex-col items-center gap-3">
          <label htmlFor="avatar" className="cursor-pointer">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-3xl">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>
          </label>

          <input
            id="avatar"
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleAvatar(e.target.files?.[0])}
          />

          <label
            htmlFor="avatar"
            className="cursor-pointer text-sm text-blue-600"
          >
            Upload Profile Picture
          </label>
        </div>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}


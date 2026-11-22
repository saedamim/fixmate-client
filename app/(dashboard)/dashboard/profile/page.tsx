"use client";

import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export default function UpdateProfilePage() {
  const { data: session, isPending } = useSession();
  // `typed` stays null until the user edits, so the field shows the saved name without an effect
  const [typed, setTyped] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const user = session?.user;
  const name = typed ?? user?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return setMessage({ ok: false, text: "Please enter your name (at least 2 characters)." });

    setSaving(true);
    setMessage(null);
    try {
      const { error } = await authClient.updateUser({ name: trimmed });
      setMessage(error ? { ok: false, text: error.message || "Could not update your profile." } : { ok: true, text: "Profile updated." });
      if (!error) setTyped(null);
    } catch {
      setMessage({ ok: false, text: "Could not reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Update Profile</h1>
      <p className="mt-2 mb-8 text-gray-600">Change the name shown on your bookings and in the menu.</p>

      {isPending || !user ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" aria-busy="true" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-gray-800">Full name</label>
            <input id="name" value={name} onChange={(e) => setTyped(e.target.value)} maxLength={80} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-800">Email</label>
            <input id="email" value={user.email} readOnly disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
          </div>
          {message && (
            <p role="status" className={`text-sm font-medium ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}
    </main>
  );
}

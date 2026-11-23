"use client";

import { toast } from "sonner";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import AvatarPicker from "@/components/site/AvatarPicker";

type Draft = { name: string; phone: string; area: string; bio: string; image: string | null };
type Errors = Partial<Record<"name" | "phone" | "bio", string>>;

const BIO_MAX = 300;
const roleLabel: Record<string, string> = { customer: "Customer", technician: "Technician", admin: "Admin" };

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const readOnlyClass = `${inputClass} bg-gray-50 text-gray-500`;

function validate({ name, phone, bio }: Draft): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = "Please enter your name (at least 2 characters)";
  if (phone.trim() && !/^\+?[\d\s-]{7,20}$/.test(phone.trim())) errors.phone = "Enter a valid phone number";
  if (bio.length > BIO_MAX) errors.bio = `The bio can be at most ${BIO_MAX} characters`;
  return errors;
}

export default function UpdateProfilePage() {
  const { data: session, isPending } = useSession();
  // `edits` stays empty until the user types, so the form shows the saved values without an effect
  const [edits, setEdits] = useState<Partial<Draft>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const user = session?.user;
  const form: Draft | undefined = user && {
    name: user.name ?? "",
    phone: user.phone ?? "",
    area: user.area ?? "",
    bio: user.bio ?? "",
    image: user.image ?? null,
    ...edits,
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setEdits((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return toast.error("Please fix the highlighted fields.");

    setSaving(true);
    try {
      // updateUser refreshes the session, so the Navbar and dashboard top bar show the new name and photo straight away
      const { error } = await authClient.updateUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        bio: form.bio.trim(),
        image: form.image,
      });
      if (error) return toast.error(error.message || "Could not update your profile.");

      setEdits({});
      toast.success("Profile updated.");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Update Profile</h1>
      <p className="mt-2 mb-8 text-gray-600">Your details are shown on your bookings and in the menu.</p>

      {isPending || !user || !form ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" aria-busy="true" />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <AvatarPicker name={form.name} url={form.image} onChange={(url) => set("image", url)} onBusyChange={setImageBusy} disabled={saving} />

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-gray-800">Full name</label>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} aria-invalid={!!errors.name} className={inputClass} />
            {errors.name && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.name}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-800">Email</label>
              <input id="email" value={user.email} readOnly disabled className={readOnlyClass} />
            </div>
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-semibold text-gray-800">Role</label>
              <input id="role" value={roleLabel[user.role ?? ""] ?? user.role ?? ""} readOnly disabled className={readOnlyClass} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-gray-800">Phone</label>
              <input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+880 1700-000000" aria-invalid={!!errors.phone} className={inputClass} />
              {errors.phone && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="area" className="mb-1 block text-sm font-semibold text-gray-800">Area</label>
              <input id="area" value={form.area} onChange={(e) => set("area", e.target.value)} maxLength={100} placeholder="Mirpur, Dhaka" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-semibold text-gray-800">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder={user.role === "technician" ? "Your skills and experience" : "A few words about you"}
              aria-invalid={!!errors.bio}
              className={inputClass}
            />
            <p className={`mt-1 text-xs ${form.bio.length > BIO_MAX ? "font-medium text-red-600" : "text-gray-500"}`}>{form.bio.length}/{BIO_MAX}</p>
            {errors.bio && <p role="alert" className="text-sm font-medium text-red-600">{errors.bio}</p>}
          </div>

          <button
            type="submit"
            disabled={saving || imageBusy}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}
    </main>
  );
}

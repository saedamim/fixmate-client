"use client";

import { useState } from "react";
import { callApi, errorMessage } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { API_URL, categories, serviceModes, type Service } from "@/lib/data/services";

type Form = {
  title: string;
  description: string;
  category: string;
  mode: string;
  price: string; // kept as text while typing, sent as a number
  duration: string;
  serviceArea: string;
  imageUrl: string;
  available: boolean;
};
type Errors = Partial<Record<keyof Form, string>>;

const emptyForm: Form = { title: "", description: "", category: "", mode: "", price: "", duration: "", serviceArea: "", imageUrl: "", available: true };

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const buttonClass =
  "rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60";

export const forbiddenMessage = "Only technician accounts can manage services.";

// Same rules as the backend, so most mistakes are caught before sending
function validate(form: Form): Errors {
  const errors: Errors = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const price = Number(form.price);

  if (title.length < 3 || title.length > 100) errors.title = "Title must be 3 to 100 characters";
  if (description.length < 10 || description.length > 1000) errors.description = "Description must be 10 to 1000 characters";
  if (!form.category) errors.category = "Please choose a category";
  if (!form.mode) errors.mode = "Please choose a service mode";
  if (form.duration.trim().length > 50) errors.duration = "Duration must be 50 characters or fewer";
  if (form.serviceArea.trim().length > 100) errors.serviceArea = "Service area must be 100 characters or fewer";
  if (!form.price.trim() || !Number.isFinite(price) || price <= 0 || price > 100000) errors.price = "Enter a price greater than 0";
  return errors;
}

// Add a service (no `service` prop) or edit one. Used by both technician service pages.
export default function ServiceForm({
  service,
  onSaved,
  onCancel,
}: {
  service?: Service;
  onSaved: (message: string) => void;
  onCancel?: () => void;
}) {
  const isNew = !service;
  const { data: session } = useSession(); // shown read-only: the server takes the owner from the token, not from this form
  const [form, setForm] = useState<Form>(
    service
      ? { title: service.title, description: service.description, category: service.category, mode: service.mode, price: String(service.price), duration: service.duration ?? "", serviceArea: service.serviceArea ?? "", imageUrl: service.imageUrl ?? "", available: service.available }
      : emptyForm
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof Form>(name: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  // Uses the existing image upload endpoint and keeps the returned link
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setFormError("");

      const data = new FormData();
      data.append("image", file);
      const response = await fetch(`${API_URL}/api/upload/image`, { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.imageUrl) {
        setFormError(result.message || "Image upload failed. You can save the service without an image.");
        return;
      }
      update("imageUrl", result.imageUrl);
    } catch {
      setFormError("Could not reach the server to upload the image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      setSaving(true);

      // Only these fields are sent. The server sets the owner and the approval status.
      await callApi(isNew ? "/api/services" : `/api/services/${service.id}`, {
        method: isNew ? "POST" : "PUT",
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          mode: form.mode,
          price: Number(form.price),
          duration: form.duration.trim(),
          serviceArea: form.serviceArea.trim(),
          imageUrl: form.imageUrl || null,
          available: form.available,
        },
        forbiddenMessage,
      });

      onSaved(
        isNew
          ? "Service submitted for review. An admin must approve it before customers can see it."
          : "Service updated. It is pending approval again, so customers cannot see it until an admin approves it."
      );
    } catch (err) {
      setFormError(errorMessage(err));
      setSaving(false);
    }
  };

  const fieldError = (name: keyof Form) =>
    errors[name] && <p className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>;

  return (
    <section aria-labelledby="service-form-title" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 id="service-form-title" className="text-xl font-bold text-gray-900">
        {isNew ? "Add a service" : "Edit service"}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {isNew
          ? "New services are reviewed by an admin before customers can see them."
          : "Saving sends this service back to pending, so an admin has to approve it again."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-800">Title</label>
          <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. AC Repair & Gas Refill" aria-invalid={Boolean(errors.title)} className={inputClass} />
          {fieldError("title")}
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-800">Description</label>
          <textarea id="description" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What the service includes" aria-invalid={Boolean(errors.description)} className={inputClass} />
          {fieldError("description")}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-gray-800">Category</label>
            <select id="category" value={form.category} onChange={(e) => update("category", e.target.value)} aria-invalid={Boolean(errors.category)} className={inputClass}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            {fieldError("category")}
          </div>
          <div>
            <label htmlFor="mode" className="mb-2 block text-sm font-semibold text-gray-800">Service mode</label>
            <select id="mode" value={form.mode} onChange={(e) => update("mode", e.target.value)} aria-invalid={Boolean(errors.mode)} className={inputClass}>
              <option value="">Select a mode</option>
              {serviceModes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {fieldError("mode")}
          </div>
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-semibold text-gray-800">Base price (USD)</label>
            <input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} aria-invalid={Boolean(errors.price)} className={inputClass} />
            {fieldError("price")}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="duration" className="mb-2 block text-sm font-semibold text-gray-800">Estimated duration</label>
            <input id="duration" value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 1-2 hours" aria-invalid={Boolean(errors.duration)} className={inputClass} />
            {fieldError("duration")}
          </div>
          <div>
            <label htmlFor="serviceArea" className="mb-2 block text-sm font-semibold text-gray-800">Service area</label>
            <input id="serviceArea" value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} placeholder="e.g. Dhanmondi, Dhaka" aria-invalid={Boolean(errors.serviceArea)} className={inputClass} />
            {fieldError("serviceArea")}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="technicianName" className="mb-2 block text-sm font-semibold text-gray-800">Technician name</label>
            <input id="technicianName" value={service?.technician ?? session?.user.name ?? ""} readOnly className={`${inputClass} bg-gray-50 text-gray-600`} />
          </div>
          <div>
            <label htmlFor="technicianEmail" className="mb-2 block text-sm font-semibold text-gray-800">Technician email</label>
            <input id="technicianEmail" value={session?.user.email ?? ""} readOnly className={`${inputClass} bg-gray-50 text-gray-600`} />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="mb-2 block text-sm font-semibold text-gray-800">Service image (optional)</label>
          <div className="flex flex-wrap items-center gap-4">
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="Service preview" className="h-20 w-28 rounded-lg object-cover" />
            )}
            <input
              id="image"
              type="file"
              accept="image/*"
              disabled={uploading || saving}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
              className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-800"
            />
            {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
            {form.imageUrl && !uploading && (
              <button type="button" onClick={() => update("imageUrl", "")} className="text-sm font-semibold text-red-600 hover:underline">
                Remove image
              </button>
            )}
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={form.available} onChange={(e) => update("available", e.target.checked)} className="h-4 w-4 accent-teal-700" />
          Available for booking
        </label>

        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{formError}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving || uploading} className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : isNew ? "Submit for review" : "Save changes"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={saving} className={buttonClass}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

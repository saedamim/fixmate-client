"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { API_URL, categories, categoryIcon, serviceModes, type Service } from "@/lib/data/services";

type ServiceStatus = Service["status"];

// Sent by GET /api/services/mine: counts cover all of this technician's services
type Counts = Record<ServiceStatus | "total", number>;

type Form = {
  title: string;
  description: string;
  category: string;
  mode: string;
  price: string; // kept as text while typing, sent as a number
  imageUrl: string;
  available: boolean;
};
type Errors = Partial<Record<keyof Form, string>>;

const emptyForm: Form = { title: "", description: "", category: "", mode: "", price: "", imageUrl: "", available: true };

const filters: { value: "all" | ServiceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusLabel: Record<ServiceStatus, string> = { pending: "Pending approval", approved: "Approved", rejected: "Rejected" };
const statusStyle: Record<ServiceStatus, string> = {
  pending: "bg-orange-50 text-orange-600",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};
const statusNote: Record<ServiceStatus, string> = {
  pending: "Waiting for an admin to approve it. Customers cannot see it yet.",
  approved: "Visible to customers while it is available.",
  rejected: "An admin rejected it. Edit it to send it for approval again.",
};

const forbiddenMessage = "Only technician accounts can manage services.";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";
const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

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
  if (!form.price.trim() || !Number.isFinite(price) || price <= 0 || price > 100000) errors.price = "Enter a price greater than 0";
  return errors;
}

export default function TechnicianServicesPage() {
  const { data: session, isPending } = useSession();
  const isTechnician = session?.user.role === "technician";

  const [filter, setFilter] = useState<"all" | ServiceStatus>("all");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // changes to reload the list
  const [services, setServices] = useState<Service[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add / edit form: editing is "new", the id of the service being edited, or "" when closed
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Delete: confirmId shows the inline "are you sure" on one card
  const [confirmId, setConfirmId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  // Load this technician's services whenever the filter or page changes
  useEffect(() => {
    if (!isTechnician) return;

    let ignore = false;
    const query = new URLSearchParams({ page: String(page), limit: "9" });
    if (filter !== "all") query.set("status", filter);

    callApi(`/api/services/mine?${query}`, { forbiddenMessage })
      .then((result) => {
        if (ignore) return;
        // The current page no longer exists (for example after a delete): go to the last page
        if (result.services.length === 0 && page > 1) {
          setPage(result.totalPages || 1);
          return;
        }
        setServices(result.services);
        setCounts(result.counts);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(errorMessage(err));
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isTechnician, filter, page, attempt]);

  const selectFilter = (value: "all" | ServiceStatus) => {
    if (value === filter && page === 1) return;
    setFilter(value);
    setPage(1);
    setLoading(true);
    setError("");
  };

  const goToPage = (value: number) => {
    setPage(value);
    setLoading(true);
  };

  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((n) => n + 1);
  };

  const update = <K extends keyof Form>(name: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const openForm = (service?: Service) => {
    setSuccess("");
    setFormError("");
    setErrors({});
    setEditing(service ? service.id : "new");
    setForm(
      service
        ? { title: service.title, description: service.description, category: service.category, mode: service.mode, price: String(service.price), imageUrl: service.imageUrl ?? "", available: service.available }
        : emptyForm
    );
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

    const isNew = editing === "new";
    try {
      setSaving(true);

      await callApi(isNew ? "/api/services" : `/api/services/${editing}`, {
        method: isNew ? "POST" : "PUT",
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          mode: form.mode,
          price: Number(form.price),
          imageUrl: form.imageUrl || null,
          available: form.available,
        },
        forbiddenMessage,
      });

      setSuccess(
        isNew
          ? "Service added. An admin must approve it before customers can see it."
          : "Service updated. It is pending approval again, so customers cannot see it until an admin approves it."
      );
      setEditing("");
      if (isNew && (filter !== "all" || page !== 1)) {
        setFilter("all");
        setPage(1);
      }
      setLoading(true);
      setAttempt((n) => n + 1);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await callApi(`/api/services/${id}`, { method: "DELETE", forbiddenMessage });

      setConfirmId("");
      setSuccess("Service deleted.");
      setAttempt((n) => n + 1); // quiet reload so the list, counts and pages are correct
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
    } finally {
      setBusyId("");
    }
  };

  const fieldError = (name: keyof Form) =>
    errors[name] && <p className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>;

  const summary = [
    { label: "Total Services", value: counts?.total ?? 0, style: "text-gray-900" },
    { label: "Pending", value: counts?.pending ?? 0, style: "text-orange-600" },
    { label: "Approved", value: counts?.approved ?? 0, style: "text-green-700" },
    { label: "Rejected", value: counts?.rejected ?? 0, style: "text-red-600" },
  ];

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with a technician account to manage services.</p>
        <Link href="/sign-in?redirect=/dashboard/technician/services" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  } else if (!isTechnician) {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only technician accounts can manage services.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
      <>
        {success && (
          <p role="status" className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800">{success}</p>
        )}

        {/* Add / edit form */}
        {editing && (
          <section aria-labelledby="service-form-title" className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 id="service-form-title" className="text-xl font-bold text-gray-900">
              {editing === "new" ? "Add a service" : "Edit service"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {editing === "new"
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
                  <label htmlFor="price" className="mb-2 block text-sm font-semibold text-gray-800">Starting price ($)</label>
                  <input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} aria-invalid={Boolean(errors.price)} className={inputClass} />
                  {fieldError("price")}
                </div>
              </div>

              <div>
                <label htmlFor="image" className="mb-2 block text-sm font-semibold text-gray-800">Image (optional)</label>
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
                <button type="submit" disabled={saving || uploading} className={`${actionClass} bg-orange-500 px-6 py-3 text-white hover:bg-orange-600`}>
                  {saving ? "Saving..." : editing === "new" ? "Add service" : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditing("")} disabled={saving} className={`${buttonClass} px-6 py-3 disabled:opacity-60`}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {loading && !counts ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : error && !counts ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={retry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">Try again</button>
              {error === SESSION_EXPIRED && <Link href="/sign-in?redirect=/dashboard/technician/services" className={buttonClass}>Sign in</Link>}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {summary.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${s.style}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by status">
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => selectFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    filter === f.value ? "border-teal-700 bg-teal-700 text-white" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {f.label} ({counts?.[f.value === "all" ? "total" : f.value] ?? 0})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2" aria-busy="true">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-medium text-red-600">{error}</p>
                <button onClick={retry} className="mt-4 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">Try again</button>
              </div>
            ) : services.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
                <p>{filter === "all" ? "You have not added any services yet." : `You have no ${filter} services.`}</p>
                {filter === "all" && !editing && (
                  <button onClick={() => openForm()} className="mt-4 font-semibold text-teal-700 hover:underline">Add your first service →</button>
                )}
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm text-gray-600">{total} {total === 1 ? "service" : "services"}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {services.map((s) => (
                    <article key={s.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        {s.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-3xl" aria-hidden>{categoryIcon(s.category)}</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-gray-900">{s.title}</h3>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[s.status]}`}>{statusLabel[s.status]}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{s.category} · {s.mode} · ${s.price}</p>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-gray-700">{s.description}</p>
                      <p className="mt-3 text-xs text-gray-500">
                        {s.available ? "Available for booking" : "Marked unavailable"} · {statusNote[s.status]}
                      </p>

                      {confirmId === s.id ? (
                        <div className="mt-4 rounded-lg bg-red-50 p-3">
                          <p className="text-sm font-medium text-red-700">Delete this service? This cannot be undone.</p>
                          <div className="mt-3 flex gap-3">
                            <button onClick={() => deleteService(s.id)} disabled={busyId === s.id} className={`${actionClass} bg-red-600 text-white hover:bg-red-700`}>
                              {busyId === s.id ? "Deleting..." : "Yes, delete"}
                            </button>
                            <button onClick={() => setConfirmId("")} disabled={busyId === s.id} className={`${buttonClass} disabled:opacity-60`}>Keep</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex gap-3">
                          <button onClick={() => openForm(s)} className={`${actionClass} bg-teal-700 text-white hover:bg-teal-800`}>Edit</button>
                          <button
                            onClick={() => {
                              setActionError(null);
                              setSuccess("");
                              setConfirmId(s.id);
                            }}
                            className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {actionError?.id === s.id && (
                        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{actionError.message}</p>
                      )}
                    </article>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
                    <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>← Previous</button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>Next →</button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard/technician" className="text-sm font-semibold text-teal-700 hover:underline">← Technician Dashboard</Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
          <p className="mt-2 text-gray-600">Add, edit and remove the services you offer.</p>
        </div>
        {isTechnician && !editing && (
          <button onClick={() => openForm()} className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600">
            + Add service
          </button>
        )}
      </div>

      {content}
    </main>
  );
}

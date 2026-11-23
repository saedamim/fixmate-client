"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import ServiceForm, { forbiddenMessage } from "@/components/site/ServiceForm";
import { categoryIcon, type Service } from "@/lib/data/services";
import { usd } from "@/lib/currency";

type ServiceStatus = Service["status"];

// Sent by GET /api/services/mine: counts cover all of this technician's services
type Counts = Record<ServiceStatus | "total", number>;

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

const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";
const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export default function MyServicesPage() {
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

  // The service being edited (the form is shown in place), or null
  const [editing, setEditing] = useState<Service | null>(null);

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

  const openForm = (service: Service) => {
    setSuccess("");
    setEditing(service);
  };

  const handleSaved = (message: string) => {
    setSuccess(message);
    setEditing(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  const deleteService = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await callApi(`/api/services/${id}`, { method: "DELETE", forbiddenMessage });

      setConfirmId("");
      setSuccess("Service deleted.");
      toast.success("Service deleted.");
      setAttempt((n) => n + 1); // quiet reload so the list, counts and pages are correct
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
      toast.error(errorMessage(err));
    } finally {
      setBusyId("");
    }
  };

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
        <Link href="/sign-in?redirect=/dashboard/technician/my-services" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
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

        {editing && (
          <div className="mb-8">
            <ServiceForm key={editing.id} service={editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
          </div>
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
              {error === SESSION_EXPIRED && <Link href="/sign-in?redirect=/dashboard/technician/my-services" className={buttonClass}>Sign in</Link>}
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
                {filter === "all" && (
                  <Link href="/dashboard/technician/add-service" className="mt-4 inline-block font-semibold text-teal-700 hover:underline">Add your first service →</Link>
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
                          <p className="mt-1 text-sm text-gray-600">{s.category} · {s.mode} · {usd(s.price)}</p>
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
        {isTechnician && (
          <Link href="/dashboard/technician/add-service" className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600">
            + Add service
          </Link>
        )}
      </div>

      {content}
    </main>
  );
}

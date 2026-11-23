"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { formatDate, statusLabel, statusStyle, statusTextStyle, type BookingStatus as Status } from "@/lib/bookings";
import RoleGate from "@/components/dashboard/RoleGate";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

type Request = {
  id: string;
  customerName: string;
  serviceTitle: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string;
  phone: string;
  address: string; // empty for In-shop services
  problemDescription: string;
  price: number;
  status: Status;
};

// Sent by GET /api/bookings/technician: counts cover all of this technician's bookings
type Counts = Record<Status | "total", number>;

const filters: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const forbiddenMessage = "Only technician accounts can view this dashboard.";

const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

function RequestsManager() {

  const [filter, setFilter] = useState<"all" | Status>("all");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // changes to reload the list
  const [requests, setRequests] = useState<Request[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState(""); // booking with an action in progress
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [rejecting, setRejecting] = useState<Request | null>(null); // request waiting for the reject confirmation
  const [completingId, setCompletingId] = useState(""); // booking showing the final amount form
  const [amount, setAmount] = useState("");

  // Load this technician's bookings whenever the filter or page changes
  useEffect(() => {
    let ignore = false;
    const query = new URLSearchParams({ page: String(page), limit: "9" });
    if (filter !== "all") query.set("status", filter);

    callApi(`/api/bookings/technician?${query}`, { forbiddenMessage })
      .then((result) => {
        if (ignore) return;
        // The current page no longer exists (for example after a status change): go to the last page
        if (result.bookings.length === 0 && page > 1) {
          setPage(result.totalPages || 1);
          return;
        }
        setRequests(result.bookings);
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
  }, [filter, page, attempt]);

  const selectFilter = (value: "all" | Status) => {
    if (value === filter && page === 1) return; // already showing this list
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

  const openComplete = (request: Request) => {
    setActionError(null);
    setCompletingId(request.id);
    setAmount(String(request.price));
  };

  // Sends the new status to the API, then refreshes the list and counts
  const updateStatus = async (id: string, status: Status, finalAmount?: number) => {
    try {
      setBusyId(id);
      setActionError(null);

      const { booking } = await callApi(`/api/bookings/technician/${id}/status`, {
        method: "PATCH",
        body: { status, ...(finalAmount !== undefined && { finalAmount }) },
        forbiddenMessage,
      });

      // Show the change straight away; drop the card if it no longer matches the filter
      setRequests((list) =>
        filter === "all" ? list.map((r) => (r.id === id ? booking : r)) : list.filter((r) => r.id !== id)
      );
      setCompletingId("");
      setRejecting(null);
      toast.success(status === "completed" ? "Bill sent to the customer." : `Request ${statusLabel[status].toLowerCase()}.`);
      setAttempt((n) => n + 1); // quiet reload so counts and pages are correct
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
      toast.error(errorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const confirmComplete = (id: string) => {
    const finalAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(finalAmount) || finalAmount <= 0) {
      setActionError({ id, message: "Enter a final amount greater than 0." });
      return;
    }
    updateStatus(id, "completed", finalAmount);
  };

  const summary = [
    { label: "Total Requests", value: counts?.total ?? 0, style: "text-gray-900" },
    { label: "New Requests", value: counts?.requested ?? 0, style: statusTextStyle.requested },
    { label: "Accepted", value: counts?.accepted ?? 0, style: statusTextStyle.accepted },
    { label: "In Progress", value: counts?.in_progress ?? 0, style: statusTextStyle.in_progress },
    { label: "Completed", value: counts?.completed ?? 0, style: statusTextStyle.completed },
  ];

  return (
    <>
    {/* The first load has no counts yet, so show the skeleton; later reloads keep the page steady */}
    {loading && !counts ? (
      <div className="mt-6" aria-busy="true">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-60 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    ) : error && !counts ? (
      <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-600">{error}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={retry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
            Try again
          </button>
          {error === SESSION_EXPIRED && (
            <Link href="/sign-in?redirect=/dashboard/technician/requests" className={buttonClass}>Sign in</Link>
          )}
        </div>
      </div>
    ) : (
      <>
        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.style}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => selectFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === f.value
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {f.label} ({counts?.[f.value === "all" ? "total" : f.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Request list */}
        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-60 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={retry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
                Try again
              </button>
              {error === SESSION_EXPIRED && (
                <Link href="/sign-in?redirect=/dashboard/technician/requests" className={buttonClass}>Sign in</Link>
              )}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
            {filter === "all" ? "You have no requests yet." : `You have no ${statusLabel[filter].toLowerCase()} requests.`}
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-600">
              {total} {total === 1 ? "request" : "requests"}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {requests.map((r) => {
                const busy = busyId === r.id;
                return (
                  <article key={r.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{r.serviceTitle}</h3>
                        <p className="mt-1 text-sm text-gray-600">{r.customerName}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Date</dt>
                        <dd className="font-medium text-gray-900">{formatDate(r.preferredDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Time</dt>
                        <dd className="font-medium text-gray-900">{r.preferredTime}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium text-gray-900">{r.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Address</dt>
                        <dd className="font-medium text-gray-900">{r.address || "In-shop (no address)"}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-gray-500">Problem</dt>
                        <dd className="font-medium text-gray-900">{r.problemDescription}</dd>
                      </div>
                    </dl>

                    {completingId === r.id ? (
                      <div className="mt-5">
                        <label htmlFor={`amount-${r.id}`} className="mb-2 block text-sm font-semibold text-gray-800">
                          Bill amount ($)
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <input
                            id={`amount-${r.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={busy}
                            className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                          />
                          <button onClick={() => confirmComplete(r.id)} disabled={busy} className={`${actionClass} bg-green-600 text-white hover:bg-green-700`}>
                            {busy ? "Sending..." : "Send bill"}
                          </button>
                          <button onClick={() => setCompletingId("")} disabled={busy} className={`${buttonClass} disabled:opacity-60`}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {r.status === "requested" && (
                          <div className="mt-5 flex gap-3">
                            <button onClick={() => updateStatus(r.id, "accepted")} disabled={busy} className={`${actionClass} bg-teal-700 text-white hover:bg-teal-800`}>
                              Accept
                            </button>
                            <button onClick={() => { setActionError(null); setRejecting(r); }} disabled={busy} className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}>
                              Reject
                            </button>
                          </div>
                        )}
                        {r.status === "accepted" && (
                          <button onClick={() => updateStatus(r.id, "in_progress")} disabled={busy} className={`${actionClass} mt-5 self-start bg-orange-500 text-white hover:bg-orange-600`}>
                            Start Work
                          </button>
                        )}
                        {r.status === "in_progress" && (
                          <button onClick={() => openComplete(r)} disabled={busy} className={`${actionClass} mt-5 self-start bg-green-600 text-white hover:bg-green-700`}>
                            Complete &amp; Send Bill
                          </button>
                        )}
                      </>
                    )}

                    {actionError?.id === r.id && (
                      <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{actionError.message}</p>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className={`${buttonClass} disabled:pointer-events-none disabled:opacity-40`}>
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </>
    )}

      {rejecting && (
        <ConfirmDialog
          title="Reject this request?"
          message={`${rejecting.serviceTitle} for ${rejecting.customerName}. The customer will see it as rejected and this cannot be undone.`}
          confirmLabel="Yes, reject request"
          cancelLabel="Keep request"
          busyLabel="Rejecting..."
          busy={busyId === rejecting.id}
          error={actionError?.id === rejecting.id ? actionError.message : undefined}
          onConfirm={() => updateStatus(rejecting.id, "rejected")}
          onClose={() => setRejecting(null)}
        />
      )}
    </>
  );
}

export default function TechnicianRequestsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Manage Requests</h1>
      <p className="mt-2 mb-8 text-gray-600">Accept jobs, update their progress and send the bill when the work is done.</p>

      <RoleGate role="technician" action="manage requests" signInPath="/dashboard/technician/requests">
        {() => <RequestsManager />}
      </RoleGate>
    </main>
  );
}

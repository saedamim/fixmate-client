"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { formatDate, statusLabel, statusStyle, type BookingStatus } from "@/lib/bookings";
import type { Service } from "@/lib/data/services";

type Option = { value: string; label: string };

type Stats = {
  users: { total: number; customer: number; technician: number; admin: number };
  services: { total: number; pending: number; approved: number; rejected: number };
  bookings: Record<BookingStatus | "total", number>;
  revenue: number;
};

type User = { id: string; name: string; email: string; role: string; emailVerified: boolean; createdAt: string };

type Booking = {
  id: string;
  serviceTitle: string;
  customerName: string;
  technician: string;
  preferredDate: string;
  preferredTime: string;
  price: number;
  finalAmount?: number;
  paymentStatus: string;
  status: BookingStatus;
};

const tabs = ["Overview", "Users", "Services", "Bookings"] as const;

const roleOptions: Option[] = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "technician", label: "Technicians" },
  { value: "admin", label: "Admins" },
];

const serviceOptions: Option[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const bookingOptions: Option[] = [
  { value: "all", label: "All" },
  ...(Object.keys(statusLabel) as BookingStatus[]).map((s) => ({ value: s, label: statusLabel[s] })),
];

const serviceStatusStyle: Record<Service["status"], string> = {
  pending: "bg-orange-50 text-orange-600",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const forbiddenMessage = "Only admin accounts can view this dashboard.";

const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";
const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const money = (amount: number) => `$${Number(amount.toFixed(2))}`;

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-600">{message}</p>
      <div className="mt-4 flex justify-center gap-3">
        <button onClick={onRetry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
          Try again
        </button>
        {message === SESSION_EXPIRED && (
          <Link href="/sign-in?redirect=/dashboard/admin" className={buttonClass}>Sign in</Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview: platform statistics from GET /api/admin/stats
// ---------------------------------------------------------------------------
function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    callApi("/api/admin/stats", { forbiddenMessage })
      .then((result) => !ignore && setStats(result))
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setError("");
    setAttempt((n) => n + 1);
  };

  if (error) return <ErrorBox message={error} onRetry={retry} />;

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.users.total, note: `${stats.users.customer} customers · ${stats.users.technician} technicians · ${stats.users.admin} admins` },
    { label: "Services", value: stats.services.total, note: `${stats.services.approved} approved · ${stats.services.rejected} rejected` },
    { label: "Services Awaiting Review", value: stats.services.pending, note: "Pending approval", style: "text-orange-600" },
    { label: "Total Bookings", value: stats.bookings.total, note: `${stats.bookings.cancelled} cancelled · ${stats.bookings.rejected} rejected` },
    { label: "Pending Bookings", value: stats.bookings.requested, note: "Waiting for a technician", style: "text-orange-600" },
    { label: "In Progress", value: stats.bookings.accepted + stats.bookings.in_progress, note: `${stats.bookings.accepted} accepted · ${stats.bookings.in_progress} started`, style: "text-sky-700" },
    { label: "Completed Bookings", value: stats.bookings.completed, note: "Work finished", style: "text-green-700" },
    { label: "Completed Work Value", value: money(stats.revenue), note: "Sum of final amounts", style: "text-green-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">{c.label}</p>
          <p className={`mt-1 text-3xl font-bold ${c.style ?? "text-gray-900"}`}>{c.value}</p>
          <p className="mt-1 text-xs text-gray-500">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminList: one filtered, paginated list used by the Users, Services and Bookings tabs.
// `render` receives the current page of items and a reload function.
// ---------------------------------------------------------------------------
function AdminList<T extends { id: string }>({
  path,
  filterName,
  options,
  noun,
  render,
}: {
  path: string; // e.g. "/api/admin/users"; the response must hold a list named after it
  filterName: string; // query parameter used by the filter ("role" or "status")
  options: Option[];
  noun: string; // "users", "services", "bookings"
  render: (items: T[], reload: () => void) => React.ReactNode;
}) {
  const key = path.split("/").pop() as string;

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0); // changes to reload the list
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const query = new URLSearchParams({ page: String(page), limit: "9" });
    if (filter !== "all") query.set(filterName, filter);

    callApi(`${path}?${query}`, { forbiddenMessage })
      .then((result) => {
        if (ignore) return;
        // The current page no longer exists: go to the last page
        if (result[key].length === 0 && page > 1) {
          setPage(result.totalPages || 1);
          return;
        }
        setItems(result[key]);
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
  }, [path, key, filterName, filter, page, attempt]);

  const selectFilter = (value: string) => {
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

  const reload = () => setAttempt((n) => n + 1); // quiet reload after an action

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={`Filter ${noun}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => selectFilter(o.value)}
            aria-pressed={filter === o.value}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === o.value
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
          No {noun} found.
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-600">{total} {noun}</p>
          <div className="mt-4">{render(items, reload)}</div>

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
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function UserRows({ users }: { users: User[] }) {
  return (
    <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
      {users.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{u.name}</p>
            <p className="break-all text-sm text-gray-600">{u.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-teal-50 px-3 py-1 capitalize text-teal-700">{u.role}</span>
            <span className={`rounded-full px-3 py-1 ${u.emailVerified ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {u.emailVerified ? "Verified" : "Not verified"}
            </span>
            <span className="text-gray-500">Joined {formatDate(u.createdAt.slice(0, 10))}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ServiceRows({ services, reload }: { services: Service[]; reload: () => void }) {
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const setStatus = async (id: string, status: Service["status"]) => {
    try {
      setBusyId(id);
      setActionError(null);
      await callApi(`/api/admin/services/${id}/status`, { method: "PATCH", body: { status }, forbiddenMessage });
      reload();
    } catch (err) {
      setActionError({ id, message: errorMessage(err) });
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {services.map((s) => (
        <article key={s.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.category} · {s.mode}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${serviceStatusStyle[s.status]}`}>
              {s.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-700">By {s.technician} · From ${s.price}</p>

          <div className="mt-4 flex gap-3">
            {s.status !== "approved" && (
              <button onClick={() => setStatus(s.id, "approved")} disabled={busyId === s.id} className={`${actionClass} bg-teal-700 text-white hover:bg-teal-800`}>
                Approve
              </button>
            )}
            {s.status !== "rejected" && (
              <button onClick={() => setStatus(s.id, "rejected")} disabled={busyId === s.id} className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}>
                Reject
              </button>
            )}
          </div>

          {actionError?.id === s.id && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{actionError.message}</p>
          )}
        </article>
      ))}
    </div>
  );
}

function BookingRows({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map((b) => (
        <article key={b.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{b.serviceTitle}</h3>
              <p className="mt-1 text-sm text-gray-600">{b.customerName} → {b.technician}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[b.status]}`}>
              {statusLabel[b.status]}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900">{formatDate(b.preferredDate)}, {b.preferredTime}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{b.finalAmount !== undefined ? "Final amount" : "Price"}</dt>
              <dd className="font-medium text-gray-900">${b.finalAmount ?? b.price}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Payment</dt>
              <dd className="font-medium capitalize text-gray-900">{b.paymentStatus}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: session, isPending } = useSession();
  const isAdmin = session?.user.role === "admin";
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with an admin account to view this dashboard.</p>
        <Link href="/sign-in?redirect=/dashboard/admin" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  } else if (!isAdmin) {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only admin accounts can view this dashboard.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
      <>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Dashboard sections">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`shrink-0 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-orange-500 text-white" : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <Overview />}
        {tab === "Users" && (
          <AdminList<User> path="/api/admin/users" filterName="role" options={roleOptions} noun="users" render={(users) => <UserRows users={users} />} />
        )}
        {tab === "Services" && (
          <AdminList<Service> path="/api/admin/services" filterName="status" options={serviceOptions} noun="services" render={(services, reload) => <ServiceRows services={services} reload={reload} />} />
        )}
        {tab === "Bookings" && (
          <AdminList<Booking> path="/api/admin/bookings" filterName="status" options={bookingOptions} noun="bookings" render={(bookings) => <BookingRows bookings={bookings} />} />
        )}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-2 mb-8 text-gray-600">Platform overview, users, service approvals and all bookings.</p>

      {content}
    </main>
  );
}

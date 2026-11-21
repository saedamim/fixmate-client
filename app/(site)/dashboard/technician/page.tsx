"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type Status = "pending" | "accepted" | "in_progress" | "completed" | "rejected";

// Same shape the booking API will return, so real data can replace the sample later
type Request = {
  id: string;
  customerName: string;
  serviceTitle: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string;
  phone: string;
  address: string;
  problemDescription: string;
  status: Status;
};

// ---------------------------------------------------------------------------
// TEMPORARY SAMPLE DATA: not from the database.
// To use real data, change loadRequests() to fetch from the API.
// ---------------------------------------------------------------------------
const sampleRequests: Request[] = [
  { id: "s1", customerName: "Sample Customer A", serviceTitle: "AC Repair & Servicing", preferredDate: "2026-12-02", preferredTime: "09:00-12:00", phone: "+880 1700-000001", address: "House 12, Road 4, Dhanmondi, Dhaka", problemDescription: "The AC turns on but does not cool the room.", status: "pending" },
  { id: "s2", customerName: "Sample Customer B", serviceTitle: "Washing Machine Repair", preferredDate: "2026-12-03", preferredTime: "12:00-15:00", phone: "+880 1700-000002", address: "Flat 5B, Green Road, Dhaka", problemDescription: "Water does not drain after the wash cycle.", status: "pending" },
  { id: "s3", customerName: "Sample Customer C", serviceTitle: "Refrigerator Repair", preferredDate: "2026-12-04", preferredTime: "15:00-18:00", phone: "+880 1700-000003", address: "House 8, Sector 7, Uttara, Dhaka", problemDescription: "The fridge makes a loud noise and the freezer is warm.", status: "accepted" },
  { id: "s4", customerName: "Sample Customer D", serviceTitle: "TV Screen Repair", preferredDate: "2026-12-01", preferredTime: "12:00-15:00", phone: "+880 1700-000004", address: "Flat 3A, Mirpur 10, Dhaka", problemDescription: "Vertical lines appear on the screen.", status: "in_progress" },
  { id: "s5", customerName: "Sample Customer E", serviceTitle: "Microwave Oven Repair", preferredDate: "2026-11-28", preferredTime: "09:00-12:00", phone: "+880 1700-000005", address: "House 21, Banani, Dhaka", problemDescription: "The microwave runs but does not heat the food.", status: "completed" },
  { id: "s6", customerName: "Sample Customer F", serviceTitle: "Laptop Repair", preferredDate: "2026-11-30", preferredTime: "15:00-18:00", phone: "+880 1700-000006", address: "Flat 9C, Gulshan 2, Dhaka", problemDescription: "The laptop will not charge, even with a new charger.", status: "rejected" },
];

// Pretend API call. Replace the body with a real fetch later.
function loadRequests(): Promise<Request[]> {
  return new Promise((resolve) => setTimeout(() => resolve(sampleRequests), 600));
}

const filters: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const statusLabel = Object.fromEntries(filters.map((f) => [f.value, f.label]));

const statusStyle: Record<Status, string> = {
  pending: "bg-orange-50 text-orange-600",
  accepted: "bg-teal-50 text-teal-700",
  in_progress: "bg-sky-50 text-sky-700",
  completed: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const actionClass = "rounded-lg px-4 py-2 text-sm font-semibold transition";

export default function TechnicianDashboardPage() {
  const { data: session, isPending } = useSession();
  const isTechnician = session?.user.role === "technician";

  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // changes to reload after an error

  useEffect(() => {
    if (!isTechnician) return;

    let ignore = false;
    loadRequests()
      .then((data) => {
        if (ignore) return;
        setRequests(data);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setError("Could not load your requests. Please try again.");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isTechnician, attempt]);

  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((n) => n + 1);
  };

  // Changes the status on this page only. Nothing is saved yet.
  const setStatus = (id: string, status: Status) =>
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));

  const count = (status: Status) => requests.filter((r) => r.status === status).length;
  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const summary = [
    { label: "Total Requests", value: requests.length, style: "text-gray-900" },
    { label: "Pending", value: count("pending"), style: "text-orange-600" },
    { label: "In Progress", value: count("in_progress"), style: "text-sky-700" },
    { label: "Completed", value: count("completed"), style: "text-green-700" },
  ];

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with a technician account to view this dashboard.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/sign-in?redirect=/dashboard/technician" className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            Create an account
          </Link>
        </div>
      </div>
    );
  } else if (!isTechnician) {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only technician accounts can view this dashboard.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
      <>
        {/* Welcome */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Welcome, {session.user.name}</h2>
          <p className="mt-1 text-sm text-gray-600">{session.user.email}</p>
          <span className="mt-3 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Technician</span>
        </section>

        <p role="note" className="mt-4 rounded-lg bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
          Sample data: these requests are temporary examples. The buttons only change this page and nothing is saved yet.
        </p>

        {loading ? (
          <div className="mt-6" aria-busy="true">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-60 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <button onClick={retry} className="mt-4 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    filter === f.value
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {f.label} ({f.value === "all" ? requests.length : count(f.value)})
                </button>
              ))}
            </div>

            {/* Request list */}
            {visible.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
                {filter === "all" ? "You have no requests yet." : `You have no ${statusLabel[filter].toLowerCase()} requests.`}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {visible.map((r) => (
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
                        <dd className="font-medium text-gray-900">{r.address}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-gray-500">Problem</dt>
                        <dd className="font-medium text-gray-900">{r.problemDescription}</dd>
                      </div>
                    </dl>

                    {r.status === "pending" && (
                      <div className="mt-5 flex gap-3">
                        <button onClick={() => setStatus(r.id, "accepted")} className={`${actionClass} bg-teal-700 text-white hover:bg-teal-800`}>
                          Accept
                        </button>
                        <button onClick={() => setStatus(r.id, "rejected")} className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}>
                          Reject
                        </button>
                      </div>
                    )}
                    {r.status === "accepted" && (
                      <button onClick={() => setStatus(r.id, "in_progress")} className={`${actionClass} mt-5 self-start bg-orange-500 text-white hover:bg-orange-600`}>
                        Start Repair
                      </button>
                    )}
                    {r.status === "in_progress" && (
                      <button onClick={() => setStatus(r.id, "completed")} className={`${actionClass} mt-5 self-start bg-green-600 text-white hover:bg-green-700`}>
                        Mark as Completed
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
      <p className="mt-2 mb-8 text-gray-600">Manage the repair requests assigned to you.</p>

      {content}
    </main>
  );
}

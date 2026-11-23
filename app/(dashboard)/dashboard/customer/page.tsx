"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import BarChart from "@/components/dashboard/BarChart";
import { callApi, errorMessage, SESSION_EXPIRED } from "@/lib/api";
import { formatDate, statusChartData, statusLabel, statusStyle, statusTextStyle, type BookingStatus as Status } from "@/lib/bookings";

type Booking = {
  id: string;
  serviceTitle: string;
  category: string;
  technician: string;
  preferredDate: string;
  preferredTime: string;
  status: Status;
};

// Sent by GET /api/bookings/my: counts cover all of this customer's bookings
type Counts = Record<Status | "total", number>;

const forbiddenMessage = "Only customer accounts can view the customer dashboard.";
const buttonClass =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

const links = [
  { href: "/dashboard/customer/bookings", title: "My Bookings", text: "Track, filter and cancel your repair requests." },
  { href: "/dashboard/customer/payments", title: "Payments", text: "See your payment history." },
  { href: "/services", title: "Browse services", text: "Find a technician and book a repair." },
];

export default function CustomerOverviewPage() {
  const { data: session, isPending } = useSession();
  const isCustomer = session?.user.role === "customer";

  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // changes to reload after an error

  // The same endpoint My Bookings uses: the counts plus the newest bookings
  useEffect(() => {
    if (!isCustomer) return;

    let ignore = false;
    callApi("/api/bookings/my?page=1&limit=3", { forbiddenMessage })
      .then((result) => {
        if (ignore) return;
        setCounts(result.counts);
        setRecent(result.bookings);
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
  }, [isCustomer, attempt]);

  const retry = () => {
    setLoading(true);
    setError("");
    setAttempt((n) => n + 1);
  };

  // Active jobs are the ones still moving: waiting for a technician, accepted or in progress
  const stats = counts && [
    { label: "Total Requests", value: counts.total, style: "text-gray-900" },
    { label: "Active Jobs", value: counts.requested + counts.accepted + counts.in_progress, style: statusTextStyle.in_progress },
    { label: "Completed Jobs", value: counts.completed, style: statusTextStyle.completed },
    { label: "Cancelled / Rejected", value: counts.cancelled + counts.rejected, style: statusTextStyle.cancelled },
  ];

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in to see your dashboard.</p>
        <Link href="/sign-in?redirect=/dashboard/customer" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  } else if (!isCustomer) {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only customer accounts can view the customer dashboard.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
      <>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={retry} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600">Try again</button>
              {error === SESSION_EXPIRED && <Link href="/sign-in?redirect=/dashboard/customer" className={buttonClass}>Sign in</Link>}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats?.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${s.style}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {counts && counts.total > 0 && (
              <div className="mt-6">
                <BarChart title="Bookings by status" subtitle="Where each of your repair requests stands" data={statusChartData(counts)} />
              </div>
            )}

            <section aria-labelledby="recent-title" className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="recent-title" className="text-xl font-bold text-gray-900">Recent bookings</h2>
                {recent.length > 0 && (
                  <Link href="/dashboard/customer/bookings" className="text-sm font-semibold text-teal-700 hover:underline">View all →</Link>
                )}
              </div>

              {recent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
                  <p>You have no bookings yet.</p>
                  <Link href="/services" className="mt-4 inline-block font-semibold text-teal-700 hover:underline">Browse services →</Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {recent.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{b.serviceTitle}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatDate(b.preferredDate)}, {b.preferredTime} · {b.technician}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[b.status]}`}>{statusLabel[b.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section aria-labelledby="links-title" className="mt-8">
          <h2 id="links-title" className="mb-4 text-xl font-bold text-gray-900">Quick links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-teal-600">
                <p className="font-semibold text-gray-900">{l.title} →</p>
                <p className="mt-1 text-sm text-gray-600">{l.text}</p>
              </Link>
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
      <p className="mt-2 mb-8 text-gray-600">An overview of your repair bookings.</p>
      {content}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { callApi, errorMessage } from "@/lib/api";
import { statusChartData, type BookingStatus } from "@/lib/bookings";
import { usdMoney } from "@/lib/currency";
import { formatDateTime, type Earnings, type ServiceCounts } from "@/lib/payments";
import BarChart from "@/components/dashboard/BarChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RoleGate from "@/components/dashboard/RoleGate";

const forbiddenMessage = "Only technician accounts can view this dashboard.";

// Services, new requests and earnings, each from its own endpoint. Earnings count only payments Stripe confirmed.
function Overview({ name, email }: { name: string; email: string }) {
  const [serviceCounts, setServiceCounts] = useState<ServiceCounts | null>(null);
  const [requestCounts, setRequestCounts] = useState<Record<BookingStatus | "total", number> | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      callApi("/api/services/mine?limit=1", { forbiddenMessage }),
      callApi("/api/bookings/technician?limit=1", { forbiddenMessage }),
      callApi("/api/payments/earnings", { forbiddenMessage }),
    ])
      .then(([services, bookings, money]) => {
        if (ignore) return;
        setServiceCounts(services.counts);
        setRequestCounts(bookings.counts);
        setEarnings(money);
      })
      .catch((err) => !ignore && setError(errorMessage(err)));

    return () => {
      ignore = true;
    };
  }, []);

  const cards = [
    { label: "Total Services", value: serviceCounts?.total, style: "text-gray-900" },
    { label: "Approved Services", value: serviceCounts?.approved, style: "text-green-700" },
    { label: "Pending Requests", value: requestCounts?.requested, style: "text-orange-600", href: "/dashboard/technician/requests" },
    { label: "Total Earnings", value: earnings && usdMoney(earnings.totalEarnings), style: "text-teal-700" },
  ];

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Welcome, {name}</h2>
        <p className="mt-1 text-sm text-gray-600">{email}</p>
        <span className="mt-3 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Technician</span>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const card = (
            <>
              <p className="text-sm text-gray-600">{c.label}</p>
              <p className={`mt-1 text-3xl font-bold ${c.style}`}>{c.value ?? "—"}</p>
            </>
          );
          const className = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${className} transition hover:border-teal-300`}>{card}</Link>
          ) : (
            <div key={c.label} className={className}>{card}</div>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
          Could not load your overview: {error}
        </p>
      )}

      <div className="mt-6">
        <RevenueChart title="Earnings, last 30 days" subtitle="Confirmed payments per day" path="/api/payments/earnings-by-day?days=30" forbidden={forbiddenMessage} />
      </div>

      {requestCounts && requestCounts.total > 0 && (
        <div className="mt-6">
          <BarChart title="Requests by status" subtitle="Every job sent to you, by where it stands" data={statusChartData(requestCounts)} />
        </div>
      )}

      <section aria-labelledby="recent-earnings" className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 id="recent-earnings" className="text-lg font-bold text-gray-900">Recent Earnings</h2>
        {!earnings ? (
          <p className="mt-3 text-sm text-gray-600">{error ? "Unavailable." : "Loading..."}</p>
        ) : earnings.recent.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No payments yet. Earnings appear here once a customer&apos;s payment is confirmed.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {earnings.recent.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{e.serviceTitle}</p>
                  <p className="text-sm text-gray-600">
                    {e.customerName}{e.paidAt && ` · ${formatDateTime(e.paidAt)}`}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-green-700">+{usdMoney(e.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function TechnicianDashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
          <p className="mt-2 text-gray-600">Your services and earnings at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/technician/requests" className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
            Requests
          </Link>
          <Link href="/dashboard/technician/add-service" className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
            + Add service
          </Link>
        </div>
      </div>

      <RoleGate role="technician" action="view this dashboard" signInPath="/dashboard/technician">
        {(user) => <Overview name={user.name} email={user.email} />}
      </RoleGate>
    </main>
  );
}

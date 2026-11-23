"use client";

import { useEffect, useState } from "react";
import { callApi, errorMessage } from "@/lib/api";
import { statusTextStyle, type BookingStatus } from "@/lib/bookings";
import { usd } from "@/lib/currency";
import RoleGate from "@/components/dashboard/RoleGate";
import { ErrorBox, forbiddenMessage } from "@/components/dashboard/PagedList";

type Stats = {
  users: { total: number; customer: number; technician: number; admin: number };
  services: { total: number; pending: number; approved: number; rejected: number };
  bookings: Record<BookingStatus | "total", number>;
  revenue: number;
};

const money = (amount: number) => usd(Number(amount.toFixed(2)));

// Platform statistics from GET /api/admin/stats
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
    { label: "Pending Bookings", value: stats.bookings.requested, note: "Waiting for a technician", style: statusTextStyle.requested },
    { label: "In Progress", value: stats.bookings.accepted + stats.bookings.in_progress, note: `${stats.bookings.accepted} accepted · ${stats.bookings.in_progress} started`, style: statusTextStyle.in_progress },
    { label: "Completed Bookings", value: stats.bookings.completed, note: "Work finished", style: "text-green-700" },
    { label: "Revenue", value: money(stats.revenue), note: "Confirmed payments only", style: "text-green-700" },
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

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-2 mb-8 text-gray-600">Platform overview: users, services, bookings and revenue.</p>

      <RoleGate role="admin" action="view this dashboard" signInPath="/dashboard/admin">
        {() => <Overview />}
      </RoleGate>
    </main>
  );
}

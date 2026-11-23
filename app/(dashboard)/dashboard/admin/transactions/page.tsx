"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { callApi } from "@/lib/api";
import { usdMoney } from "@/lib/currency";
import { formatDateTime, paymentStatusLabel, paymentStatusOptions, paymentStatusStyle, shortId, type Transaction } from "@/lib/payments";
import RoleGate from "@/components/dashboard/RoleGate";
import { PagedList, forbiddenMessage } from "@/components/dashboard/PagedList";

function TransactionRows({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
      {transactions.map((t) => (
        <li key={t.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{t.serviceTitle}</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-500">{t.transactionId ?? t.stripeSessionId ?? "No transaction ID yet"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900">
                {usdMoney(t.amount)} <span className="text-xs font-normal text-gray-500">{t.currency.toUpperCase()}</span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusStyle[t.status]}`}>
                {paymentStatusLabel[t.status]}
              </span>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-gray-500">Customer</dt>
              <dd className="font-medium text-gray-900">{t.customerName || "—"}</dd>
              {t.customerEmail && <dd className="break-all text-xs text-gray-600">{t.customerEmail}</dd>}
            </div>
            <div className="min-w-0">
              <dt className="text-gray-500">Technician</dt>
              <dd className="font-medium text-gray-900">{t.technicianName || "—"}</dd>
              {t.technicianEmail && <dd className="break-all text-xs text-gray-600">{t.technicianEmail}</dd>}
            </div>
            <div>
              <dt className="text-gray-500">Booking · Provider</dt>
              <dd className="font-medium text-gray-900">#{shortId(t.bookingId)} · {t.provider ?? "Stripe"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t.paidAt ? "Paid" : "Started"}</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(t.paidAt ?? t.createdAt)}</dd>
            </div>
          </dl>

          {t.reviewRequired && (
            <p className="mt-3 rounded-lg bg-orange-50 p-2 text-xs font-medium text-orange-700">Held for manual review</p>
          )}
          {t.status !== "paid" && t.status !== "pending" && t.failureReason && (
            <p className="mt-3 text-xs text-gray-500">{t.failureReason}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

// Total confirmed revenue (from the same stats endpoint as the admin overview); hidden if it cannot be loaded
function Revenue() {
  const [revenue, setRevenue] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    callApi("/api/admin/stats", { forbiddenMessage })
      .then((stats) => !ignore && setRevenue(stats.revenue))
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  if (revenue === null) return null;
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-600">Total revenue</p>
      <p className="mt-1 text-3xl font-bold text-green-700">{usdMoney(revenue)}</p>
      <p className="mt-1 text-xs text-gray-500">Confirmed payments only</p>
    </div>
  );
}

// Transactions: real payment records from GET /api/admin/transactions (admins only).
export default function AdminTransactionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard/admin" className="text-sm font-semibold text-teal-700 hover:underline">← Admin Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Transactions</h1>
      <p className="mt-2 mb-8 text-gray-600">Every payment attempt made on FixMate.</p>

      <RoleGate role="admin" action="view transactions" signInPath="/dashboard/admin/transactions">
        {() => (
          <>
            <Revenue />
            <PagedList<Transaction>
              path="/api/admin/transactions"
              listKey="transactions"
              filterName="status"
              options={paymentStatusOptions}
              noun="transactions"
              forbidden={forbiddenMessage}
              signInPath="/dashboard/admin/transactions"
              render={(transactions) => <TransactionRows transactions={transactions} />}
              empty={
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
                  <p className="text-lg font-semibold text-gray-900">No transactions yet</p>
                  <p className="mt-2 text-sm">Payments made by customers will appear here.</p>
                </div>
              }
            />
          </>
        )}
      </RoleGate>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { bdt } from "@/lib/currency";
import { formatDateTime, paymentStatusLabel, paymentStatusOptions, paymentStatusStyle, shortId, type Transaction } from "@/lib/payments";
import { PagedList, forbiddenMessage } from "@/components/dashboard/PagedList";

function TransactionRows({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm">
      {transactions.map((t) => (
        <li key={t.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{t.serviceTitle}</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-500">{t.tranId}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900">
                {bdt(t.amount)} <span className="text-xs font-normal text-gray-500">{t.currency}</span>
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
            <div>
              <dt className="text-gray-500">Booking</dt>
              <dd className="font-medium text-gray-900">#{shortId(t.bookingId)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Provider</dt>
              <dd className="font-medium text-gray-900">{t.provider}</dd>
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

// Transactions: real payment records from GET /api/admin/transactions (admins only).
export default function AdminTransactionsPage() {
  const { data: session, isPending } = useSession();

  let content: React.ReactNode;

  if (isPending) {
    content = <div className="h-40 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  } else if (!session) {
    content = (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-700">Please sign in with an admin account to view transactions.</p>
        <Link href="/sign-in?redirect=/dashboard/admin/transactions" className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600">
          Sign in
        </Link>
      </div>
    );
  } else if (session.user.role !== "admin") {
    content = (
      <p className="rounded-2xl bg-orange-50 p-6 text-sm font-medium text-orange-700">
        Only admin accounts can view transactions.
        {session.user.role && ` You are signed in as a ${session.user.role}.`}
      </p>
    );
  } else {
    content = (
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
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard/admin" className="text-sm font-semibold text-teal-700 hover:underline">← Admin Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Transactions</h1>
      <p className="mt-2 mb-8 text-gray-600">Every payment attempt made on FixMate.</p>
      {content}
    </main>
  );
}

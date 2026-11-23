"use client";

import Link from "next/link";
import RoleGate from "@/components/dashboard/RoleGate";
import { usdMoney } from "@/lib/currency";
import { formatDateTime, paymentStatusLabel, paymentStatusOptions, paymentStatusStyle, shortId, type Payment } from "@/lib/payments";
import { PagedList } from "@/components/dashboard/PagedList";

const forbiddenMessage = "Only customer accounts can view payments.";

function PaymentRows({ payments }: { payments: Payment[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {payments.map((p) => (
        <article key={p.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">{p.serviceTitle}</h3>
              <p className="mt-1 text-sm text-gray-600">Booking #{shortId(p.bookingId)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusStyle[p.status]}`}>
              {paymentStatusLabel[p.status]}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-medium text-gray-900">{usdMoney(p.amount)} <span className="text-xs font-normal text-gray-500">{p.currency.toUpperCase()}</span></dd>
            </div>
            <div>
              <dt className="text-gray-500">Method</dt>
              <dd className="font-medium text-gray-900">{p.provider}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Started</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(p.createdAt)}</dd>
            </div>
            {p.paidAt && (
              <div>
                <dt className="text-gray-500">Paid</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(p.paidAt)}</dd>
              </div>
            )}
          </dl>
          {p.transactionId && <p className="mt-3 break-all text-xs text-gray-500">Transaction ID: {p.transactionId}</p>}
        </article>
      ))}
    </div>
  );
}

// Payment History: real records from GET /api/payments/my. Nothing is shown until the backend has a record.
export default function CustomerPaymentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
      <p className="mt-2 mb-8 text-gray-600">Your payments for completed repairs.</p>

      <RoleGate role="customer" action="see payments" signInPath="/dashboard/customer/payments">
        {() => (
          <PagedList<Payment>
            path="/api/payments/my"
            listKey="payments"
            filterName="status"
            options={paymentStatusOptions}
            noun="payments"
            forbidden={forbiddenMessage}
            signInPath="/dashboard/customer/payments"
            render={(payments) => <PaymentRows payments={payments} />}
            empty={
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-gray-900">No payments yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                  When you pay for a completed repair, the payment will be listed here.
                </p>
                <Link href="/dashboard/customer/bookings" className="mt-5 inline-block font-semibold text-teal-700 hover:underline">
                  View my bookings →
                </Link>
              </div>
            }
          />
        )}
      </RoleGate>
    </main>
  );
}
